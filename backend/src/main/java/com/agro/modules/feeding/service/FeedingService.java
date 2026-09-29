package com.agro.modules.feeding.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.modules.biometry.domain.BiometryRecord;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.domain.FeedingRecord;
import com.agro.modules.feeding.dto.BatchFeedingSyncRequest;
import com.agro.modules.feeding.dto.CreateFeedingRecordRequest;
import com.agro.modules.feeding.dto.DailyFeedingPlanResponse;
import com.agro.modules.feeding.dto.FeedingRecordResponse;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;
import com.agro.modules.species.domain.FeedingTable;
import com.agro.modules.species.repository.FeedingTableRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de lógica de negocio para la alimentación diaria (HU-03: cálculo de ración según biomasa,
 * y HU-04: registro ultrarrápido y sincronización diferida offline).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FeedingService {

    private final FeedingRecordRepository feedingRecordRepository;
    private final BiometryRecordRepository biometryRecordRepository;
    private final FeedingTableRepository feedingTableRepository;
    private final BatchService batchService;
    private final FarmService farmService;

    /**
     * Calcula la ración técnica diaria y sugerencia de horarios basada en la biomasa actual del lote (HU-03).
     */
    public DailyFeedingPlanResponse calculateDailyFeedingPlan(UUID batchId, UUID ownerId) {
        log.info("Calculando plan de alimentación técnica (HU-03) para lote ID {}", batchId);

        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        // 1. Obtener biomasa y peso promedio actual (desde última biometría o siembra inicial)
        Optional<BiometryRecord> latestBiometry = biometryRecordRepository.findTopByBatchIdOrderBySamplingDateDesc(batchId);

        BigDecimal currentAvgWeightG;
        BigDecimal currentBiomassKg;

        if (latestBiometry.isPresent()) {
            currentAvgWeightG = latestBiometry.get().getCalculatedAvgWeightG() != null
                    ? latestBiometry.get().getCalculatedAvgWeightG()
                    : latestBiometry.get().getTotalSampleWeightG()
                        .divide(BigDecimal.valueOf(latestBiometry.get().getSampledCount()), 2, RoundingMode.HALF_UP);

            currentBiomassKg = latestBiometry.get().getEstimatedBiomassKg() != null
                    ? latestBiometry.get().getEstimatedBiomassKg()
                    : BigDecimal.valueOf(batch.getInitialQuantity())
                        .multiply(currentAvgWeightG)
                        .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);
        } else {
            currentAvgWeightG = batch.getInitialAvgWeightG();
            currentBiomassKg = BigDecimal.valueOf(batch.getInitialQuantity())
                    .multiply(currentAvgWeightG)
                    .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);
        }

        // 2. Consultar tabla de alimentación técnica de la especie según peso
        Optional<FeedingTable> nutritionRule = feedingTableRepository
                .findNutritionByWeight(batch.getSpecies().getId(), currentAvgWeightG);

        BigDecimal biomassPct = nutritionRule.map(FeedingTable::getBiomassPercentage)
                .orElse(new BigDecimal("2.50"));
        int frequency = nutritionRule.map(FeedingTable::getDailyFrequency)
                .orElse(2);
        BigDecimal suggestedProtein = nutritionRule.map(FeedingTable::getSuggestedProteinPct)
                .orElse(new BigDecimal("32.0"));

        // 3. Cuota diaria total = biomasa * (porcentaje / 100)
        BigDecimal totalDailyQuotaKg = currentBiomassKg.multiply(biomassPct)
                .divide(new BigDecimal("100.00"), 2, RoundingMode.HALF_UP);

        // 4. Cuota por ración
        BigDecimal rationQuotaKg = totalDailyQuotaKg.divide(BigDecimal.valueOf(frequency), 2, RoundingMode.HALF_UP);

        // 5. Horarios sugeridos según frecuencia
        List<String> suggestedHours = generateSuggestedHours(frequency);

        log.info("Plan HU-03: Biomasa={} kg, %Biomasa={}, CuotaDiaria={} kg ({} raciones de {} kg)",
                currentBiomassKg, biomassPct, totalDailyQuotaKg, frequency, rationQuotaKg);

        return new DailyFeedingPlanResponse(
                batch.getId(),
                batch.getBatchCode(),
                batch.getSpecies().getCommonName(),
                currentAvgWeightG,
                currentBiomassKg,
                biomassPct,
                totalDailyQuotaKg,
                frequency,
                rationQuotaKg,
                suggestedHours,
                suggestedProtein
        );
    }

    /**
     * Registra el suministro de una ración individual en campo (HU-04).
     */
    @Transactional
    public FeedingRecordResponse recordFeeding(UUID batchId, UUID ownerId, CreateFeedingRecordRequest request) {
        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        FeedingRecord record = FeedingRecord.builder()
                .batch(batch)
                .feedingDate(request.feedingDate() != null ? request.feedingDate() : LocalDate.now())
                .rationNumber(request.rationNumber() != null ? request.rationNumber() : 1)
                .feedingTime(request.feedingTime())
                .feedBrandType(request.feedBrandType().trim())
                .suppliedQuantityKg(request.suppliedQuantityKg())
                .costPerKg(request.costPerKg())
                .waterTemperatureC(request.waterTemperatureC())
                .dissolvedOxygenMgL(request.dissolvedOxygenMgL())
                .build();

        FeedingRecord saved = feedingRecordRepository.save(record);
        return FeedingRecordResponse.fromEntity(saved);
    }

    /**
     * Sincroniza múltiples registros acumulados localmente en modo offline (HU-04 PWA Sync).
     */
    @Transactional
    public List<FeedingRecordResponse> syncBatchFeeding(UUID batchId, UUID ownerId, BatchFeedingSyncRequest request) {
        log.info("Sincronizando {} raciones offline para el lote ID {}", request.records().size(), batchId);
        List<FeedingRecordResponse> responses = new ArrayList<>();
        for (CreateFeedingRecordRequest recReq : request.records()) {
            responses.add(recordFeeding(batchId, ownerId, recReq));
        }
        return responses;
    }

    public List<FeedingRecordResponse> getFeedingHistory(UUID batchId, UUID ownerId) {
        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        return feedingRecordRepository.findByBatchIdOrderByFeedingDateDescFeedingTimeDesc(batchId).stream()
                .map(FeedingRecordResponse::fromEntity)
                .toList();
    }

    private List<String> generateSuggestedHours(int frequency) {
        return switch (frequency) {
            case 1 -> List.of("10:00");
            case 2 -> List.of("09:00", "15:00");
            case 3 -> List.of("08:00", "12:00", "16:00");
            case 4 -> List.of("08:00", "11:00", "14:00", "17:00");
            default -> List.of("07:30", "10:00", "12:30", "15:00", "17:30");
        };
    }
}
