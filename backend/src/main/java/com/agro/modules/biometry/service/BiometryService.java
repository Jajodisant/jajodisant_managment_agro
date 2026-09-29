package com.agro.modules.biometry.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.temporal.ChronoUnit;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.common.exception.BusinessRuleException;
import com.agro.modules.biometry.domain.BiometryRecord;
import com.agro.modules.biometry.dto.BiometryResponse;
import com.agro.modules.biometry.dto.CreateBiometryRequest;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de negocio para el registro de biometrías y cálculo automático de FCR y GMD (HU-05).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class BiometryService {

    public static final BigDecimal GREEN_FCR_THRESHOLD = new BigDecimal("1.35");
    public static final BigDecimal AMBER_FCR_THRESHOLD = new BigDecimal("1.60");

    private final BiometryRecordRepository biometryRecordRepository;
    private final FeedingRecordRepository feedingRecordRepository;
    private final BatchService batchService;
    private final FarmService farmService;

    /**
     * Registra un muestreo biométrico y computa en tiempo real biomasa, ganancia y FCR (HU-05).
     */
    @Transactional
    public BiometryResponse recordBiometry(UUID batchId, UUID ownerId, CreateBiometryRequest request) {
        log.info("Registrando biometría para lote ID {} en fecha {}", batchId, request.samplingDate());

        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        if (request.samplingDate().isBefore(batch.getStockingDate())) {
            throw new BusinessRuleException("La fecha de biometría no puede ser anterior a la siembra del lote");
        }

        // 1. Peso promedio del muestreo (g)
        BigDecimal avgWeightG = request.totalSampleWeightG()
                .divide(BigDecimal.valueOf(request.sampledCount()), 2, RoundingMode.HALF_UP);

        // 2. Mortalidad acumulada histórica
        int previousMortality = biometryRecordRepository.sumMortalityByBatchId(batchId);
        int currentObservedMortality = (request.observedMortality() != null) ? request.observedMortality() : 0;
        int totalMortality = previousMortality + currentObservedMortality;

        int remainingPopulation = Math.max(0, batch.getInitialQuantity() - totalMortality);

        // 3. Biomasa total actual estimada en kg: (población * peso promedio en g) / 1000
        BigDecimal currentBiomassKg = BigDecimal.valueOf(remainingPopulation)
                .multiply(avgWeightG)
                .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);

        // 4. Biomasa inicial sembrada (kg)
        BigDecimal initialBiomassKg = BigDecimal.valueOf(batch.getInitialQuantity())
                .multiply(batch.getInitialAvgWeightG())
                .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);

        // 5. Ganancia neta de biomasa ganada (kg)
        BigDecimal netBiomassGainedKg = currentBiomassKg.subtract(initialBiomassKg);

        // 6. Alimento suministrado acumulado hasta la fecha (kg)
        BigDecimal accumulatedFeedKg = feedingRecordRepository.sumSuppliedQuantityByBatchId(batchId);

        // 7. Cálculo automático de FCR (Factor de Conversión Alimenticia)
        BigDecimal accumulatedFcr = null;
        String fcrStatus = "GREEN";

        if (netBiomassGainedKg.compareTo(BigDecimal.ZERO) > 0 && accumulatedFeedKg.compareTo(BigDecimal.ZERO) > 0) {
            accumulatedFcr = accumulatedFeedKg.divide(netBiomassGainedKg, 2, RoundingMode.HALF_UP);

            if (accumulatedFcr.compareTo(GREEN_FCR_THRESHOLD) <= 0) {
                fcrStatus = "GREEN";
            } else if (accumulatedFcr.compareTo(AMBER_FCR_THRESHOLD) <= 0) {
                fcrStatus = "AMBER";
            } else {
                fcrStatus = "RED";
            }
        }

        // 8. Ganancia Media Diaria (GMD en g/día)
        Optional<BiometryRecord> lastBiometry = biometryRecordRepository.findTopByBatchIdOrderBySamplingDateDesc(batchId);
        BigDecimal dailyGainG = BigDecimal.ZERO;

        if (lastBiometry.isPresent()) {
            long days = ChronoUnit.DAYS.between(lastBiometry.get().getSamplingDate(), request.samplingDate());
            if (days > 0) {
                BigDecimal lastAvgWeight = lastBiometry.get().getCalculatedAvgWeightG() != null
                        ? lastBiometry.get().getCalculatedAvgWeightG()
                        : lastBiometry.get().getTotalSampleWeightG()
                            .divide(BigDecimal.valueOf(lastBiometry.get().getSampledCount()), 2, RoundingMode.HALF_UP);
                dailyGainG = avgWeightG.subtract(lastAvgWeight).divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
            }
        } else {
            long days = ChronoUnit.DAYS.between(batch.getStockingDate(), request.samplingDate());
            if (days > 0) {
                dailyGainG = avgWeightG.subtract(batch.getInitialAvgWeightG())
                        .divide(BigDecimal.valueOf(days), 2, RoundingMode.HALF_UP);
            }
        }

        // 9. Persistir registro de biometría
        BiometryRecord biometry = BiometryRecord.builder()
                .batch(batch)
                .samplingDate(request.samplingDate())
                .sampledCount(request.sampledCount())
                .totalSampleWeightG(request.totalSampleWeightG())
                .observedMortality(currentObservedMortality)
                .estimatedBiomassKg(currentBiomassKg)
                .observations(request.observations())
                .build();

        BiometryRecord saved = biometryRecordRepository.save(biometry);

        log.info("Biometría procesada (HU-05): Biomasa={} kg, FCR={}, Estado={}", currentBiomassKg, accumulatedFcr, fcrStatus);

        return new BiometryResponse(
                saved.getId(),
                batch.getId(),
                batch.getBatchCode(),
                saved.getSamplingDate(),
                saved.getSampledCount(),
                saved.getTotalSampleWeightG(),
                avgWeightG,
                saved.getObservedMortality(),
                saved.getEstimatedBiomassKg(),
                remainingPopulation,
                netBiomassGainedKg,
                accumulatedFeedKg,
                accumulatedFcr,
                fcrStatus,
                dailyGainG,
                saved.getObservations(),
                saved.getCreatedAt()
        );
    }

    public List<BiometryResponse> getBiometriesByBatch(UUID batchId, UUID ownerId) {
        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        return biometryRecordRepository.findByBatchIdOrderBySamplingDateDesc(batchId).stream()
                .map(b -> {
                    BigDecimal avgWeight = (b.getCalculatedAvgWeightG() != null)
                            ? b.getCalculatedAvgWeightG()
                            : b.getTotalSampleWeightG().divide(BigDecimal.valueOf(b.getSampledCount()), 2, RoundingMode.HALF_UP);

                    return new BiometryResponse(
                            b.getId(),
                            batch.getId(),
                            batch.getBatchCode(),
                            b.getSamplingDate(),
                            b.getSampledCount(),
                            b.getTotalSampleWeightG(),
                            avgWeight,
                            b.getObservedMortality(),
                            b.getEstimatedBiomassKg(),
                            null, null, null, null, "GREEN", BigDecimal.ZERO,
                            b.getObservations(),
                            b.getCreatedAt()
                    );
                })
                .toList();
    }
}
