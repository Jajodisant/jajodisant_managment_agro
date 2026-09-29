package com.agro.modules.finance.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.modules.biometry.domain.BiometryRecord;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.finance.domain.CostRecord;
import com.agro.modules.finance.dto.BatchFinancialSummaryResponse;
import com.agro.modules.finance.dto.CostResponse;
import com.agro.modules.finance.dto.CreateCostRequest;
import com.agro.modules.finance.repository.CostRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de negocio para el control de costos de producción y cálculo de rentabilidad en tiempo real (HU-06).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class CostService {

    private final CostRecordRepository costRecordRepository;
    private final FeedingRecordRepository feedingRecordRepository;
    private final BiometryRecordRepository biometryRecordRepository;
    private final FarmService farmService;
    private final BatchService batchService;

    /**
     * Registra un egreso directo o indirecto de la explotación.
     */
    @Transactional
    public CostResponse recordCost(CreateCostRequest request, UUID ownerId) {
        log.info("Registrando costo de {} en categoría '{}' para granja ID {}",
                request.totalAmount(), request.category(), request.farmId());

        Farm farm = farmService.findFarmEntity(request.farmId(), ownerId);
        Batch batch = null;
        if (request.batchId() != null) {
            batch = batchService.findBatchEntity(request.batchId());
        }

        CostRecord cost = CostRecord.builder()
                .farm(farm)
                .batch(batch)
                .expenseDate(request.expenseDate() != null ? request.expenseDate() : LocalDate.now())
                .category(request.category().toLowerCase().trim())
                .description(request.description().trim())
                .totalAmount(request.totalAmount())
                .build();

        CostRecord saved = costRecordRepository.save(cost);
        return CostResponse.fromEntity(saved);
    }

    public List<CostResponse> getCostsByFarm(UUID farmId, UUID ownerId) {
        farmService.findFarmEntity(farmId, ownerId);
        return costRecordRepository.findByFarmIdOrderByExpenseDateDesc(farmId).stream()
                .map(CostResponse::fromEntity)
                .toList();
    }

    public List<CostResponse> getCostsByBatch(UUID batchId, UUID ownerId) {
        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        return costRecordRepository.findByBatchIdOrderByExpenseDateDesc(batchId).stream()
                .map(CostResponse::fromEntity)
                .toList();
    }

    /**
     * Calcula la estructura financiera completa y el costo por kilogramo producido ($/kg) en tiempo real (HU-06).
     */
    public BatchFinancialSummaryResponse getBatchFinancialSummary(UUID batchId, UUID ownerId) {
        log.info("Calculando estructura financiera y costo por kilo en tiempo real (HU-06) para lote ID {}", batchId);

        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        // 1. Biomasa viva actual estimada (desde última biometría o población inicial)
        Optional<BiometryRecord> latestBiometry = biometryRecordRepository.findTopByBatchIdOrderBySamplingDateDesc(batchId);
        BigDecimal currentBiomassKg;

        if (latestBiometry.isPresent()) {
            currentBiomassKg = latestBiometry.get().getEstimatedBiomassKg() != null
                    ? latestBiometry.get().getEstimatedBiomassKg()
                    : BigDecimal.valueOf(batch.getInitialQuantity())
                        .multiply(batch.getInitialAvgWeightG())
                        .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);
        } else {
            currentBiomassKg = BigDecimal.valueOf(batch.getInitialQuantity())
                    .multiply(batch.getInitialAvgWeightG())
                    .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);
        }

        // 2. Costos de alimento (acumulados de raciones diarias suministradas + egresos de concentrado en cost_record)
        BigDecimal feedingDailyCost = feedingRecordRepository.sumTotalFeedCostByBatchId(batchId);
        BigDecimal explicitFeedCost = costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "feed");
        BigDecimal totalFeedCost = feedingDailyCost.add(explicitFeedCost);

        // 3. Otros rubros directos e indirectos
        BigDecimal fingerlingsCost = costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "fingerlings");
        BigDecimal laborCost = costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "labor");
        BigDecimal energyCost = costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "energy");

        BigDecimal recordedCosts = costRecordRepository.sumTotalAmountByBatchId(batchId);
        BigDecimal otherCosts = recordedCosts
                .subtract(explicitFeedCost)
                .subtract(fingerlingsCost)
                .subtract(laborCost)
                .subtract(energyCost);
        if (otherCosts.compareTo(BigDecimal.ZERO) < 0) {
            otherCosts = BigDecimal.ZERO;
        }

        // 4. Costo total acumulado
        BigDecimal totalCumulativeCost = totalFeedCost
                .add(fingerlingsCost)
                .add(laborCost)
                .add(energyCost)
                .add(otherCosts);

        // 5. Costo de producción por kilogramo ($/kg)
        BigDecimal costPerKgProduced = BigDecimal.ZERO;
        if (currentBiomassKg.compareTo(BigDecimal.ZERO) > 0) {
            costPerKgProduced = totalCumulativeCost.divide(currentBiomassKg, 2, RoundingMode.HALF_UP);
        }

        log.info("Resumen HU-06: Biomasa={} kg, CostoTotal={} USD, CostoPorKg={} USD/kg",
                currentBiomassKg, totalCumulativeCost, costPerKgProduced);

        return new BatchFinancialSummaryResponse(
                batch.getId(),
                batch.getBatchCode(),
                currentBiomassKg,
                totalFeedCost,
                fingerlingsCost,
                laborCost,
                energyCost,
                otherCosts,
                totalCumulativeCost,
                costPerKgProduced
        );
    }
}
