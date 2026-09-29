package com.agro.modules.lot.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.common.exception.BusinessRuleException;
import com.agro.common.exception.DuplicateResourceException;
import com.agro.common.exception.ResourceNotFoundException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.domain.Pond;
import com.agro.modules.farm.dto.PondResponse;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.farm.service.PondService;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.dto.CreateBatchRequest;
import com.agro.modules.lot.dto.BatchResponse;
import com.agro.modules.lot.dto.UpdateBatchStatusRequest;
import com.agro.modules.lot.repository.BatchRepository;
import com.agro.modules.species.domain.Species;
import com.agro.modules.species.service.SpeciesService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de aplicación para la gestión de lotes biológicos y siembras.
 * Implementa la validación zootécnica de alerta preventiva de aforo y sobrepoblación (HU-02).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BatchService {

    public static final BigDecimal DEFAULT_HARVEST_TARGET_WEIGHT_G = new BigDecimal("500.00");

    private final BatchRepository batchRepository;
    private final FarmService farmService;
    private final PondService pondService;
    private final SpeciesService speciesService;

    /**
     * Registra la siembra de un nuevo lote de peces validando el aforo del estanque (HU-02).
     */
    @Transactional
    public BatchResponse createBatch(CreateBatchRequest request, UUID ownerId) {
        log.info("Iniciando siembra de lote '{}' en granja ID {}", request.batchCode(), request.farmId());

        // 1. Validar propiedad y existencia de granja
        Farm farm = farmService.findFarmEntity(request.farmId(), ownerId);

        // 2. Validar unicidad del código del lote
        String code = request.batchCode().trim();
        if (batchRepository.existsByBatchCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("Lote", "código", code);
        }

        // 3. Validar especie
        Species species = speciesService.findSpeciesEntity(request.speciesId());

        // 4. Validar estanque y capacidad biológica (HU-02)
        Pond pond = null;
        boolean hasOvercrowding = false;
        BigDecimal overcrowdingPct = BigDecimal.ZERO;

        if (request.pondId() != null) {
            pond = pondService.findPondEntity(request.farmId(), request.pondId());
            if (!pond.isActive()) {
                throw new BusinessRuleException(
                    String.format("El estanque '%s' se encuentra inactivo o en mantenimiento sanitario", pond.getCodeName()));
            }

            // Calcular biomasa proyectada a cosecha
            BigDecimal targetWeightG = request.targetHarvestWeightG() != null
                    ? request.targetHarvestWeightG()
                    : DEFAULT_HARVEST_TARGET_WEIGHT_G;

            BigDecimal projectedHarvestBiomassKg = BigDecimal.valueOf(request.initialQuantity())
                    .multiply(targetWeightG)
                    .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);

            PondResponse pondMetrics = PondResponse.fromEntity(pond);
            BigDecimal maxBiomassCapacityKg = pondMetrics.maxBiomassCapacityKg();

            if (maxBiomassCapacityKg != null && projectedHarvestBiomassKg.compareTo(maxBiomassCapacityKg) > 0) {
                hasOvercrowding = true;
                BigDecimal diff = projectedHarvestBiomassKg.subtract(maxBiomassCapacityKg);
                overcrowdingPct = diff.multiply(new BigDecimal("100.00"))
                        .divide(maxBiomassCapacityKg, 2, RoundingMode.HALF_UP);

                log.warn("Alerta preventiva HU-02 en lote '{}': Biomasa proyectada {} kg excede capacidad {} kg en {}%",
                        code, projectedHarvestBiomassKg, maxBiomassCapacityKg, overcrowdingPct);

                if (!request.forceStocking()) {
                    throw new BusinessRuleException(String.format(
                        "Alerta preventiva de sobrepoblación (HU-02): La biomasa proyectada a cosecha (%.2f kg) "
                        + "supera la capacidad técnica máxima del estanque '%s' (%.2f kg) en un %.2f%%. "
                        + "Para continuar conscientemente con plan de desdoble/traslado, confirme con 'forceStocking=true'.",
                        projectedHarvestBiomassKg, pond.getCodeName(), maxBiomassCapacityKg, overcrowdingPct
                    ));
                }
            }
        }

        Batch batch = Batch.builder()
                .farm(farm)
                .pond(pond)
                .species(species)
                .batchCode(code)
                .stockingDate(request.stockingDate())
                .initialQuantity(request.initialQuantity())
                .initialAvgWeightG(request.initialAvgWeightG())
                .status("stocking")
                .estimatedHarvestDate(request.estimatedHarvestDate())
                .build();

        Batch saved = batchRepository.save(batch);
        log.info("Lote '{}' sembrado exitosamente. ID: {}", saved.getBatchCode(), saved.getId());
        return BatchResponse.fromEntity(saved, hasOvercrowding, overcrowdingPct);
    }

    public List<BatchResponse> getBatchesByFarm(UUID farmId, UUID ownerId) {
        farmService.findFarmEntity(farmId, ownerId);
        return batchRepository.findByFarmId(farmId).stream()
                .map(b -> BatchResponse.fromEntity(b, false, BigDecimal.ZERO))
                .toList();
    }

    public BatchResponse getBatchById(UUID batchId, UUID ownerId) {
        Batch batch = findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);
        return BatchResponse.fromEntity(batch, false, BigDecimal.ZERO);
    }

    @Transactional
    public BatchResponse updateBatchStatus(UUID batchId, UUID ownerId, UpdateBatchStatusRequest request) {
        Batch batch = findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        batch.setStatus(request.status().trim().toLowerCase());
        if (request.actualHarvestDate() != null) {
            batch.setActualHarvestDate(request.actualHarvestDate());
        }

        Batch updated = batchRepository.save(batch);
        return BatchResponse.fromEntity(updated, false, BigDecimal.ZERO);
    }

    public Batch findBatchEntity(UUID batchId) {
        return batchRepository.findById(batchId)
                .orElseThrow(() -> new ResourceNotFoundException("Lote", batchId));
    }
}
