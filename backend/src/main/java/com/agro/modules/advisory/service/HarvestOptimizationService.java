package com.agro.modules.advisory.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.modules.advisory.dto.HarvestOptimizationResponse;
import com.agro.modules.biometry.domain.BiometryRecord;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.domain.FeedingRecord;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.finance.repository.CostRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de negocio para el Motor de Optimización de Cosecha / Sacrificio (HU-07).
 * Calcula el punto de inflexión biológico (deterioro de FCR marginal vs precio de mercado $/kg)
 * para recomendar el momento financiero exacto de venta.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class HarvestOptimizationService {

    private final BatchService batchService;
    private final FarmService farmService;
    private final BiometryRecordRepository biometryRecordRepository;
    private final FeedingRecordRepository feedingRecordRepository;
    private final CostRecordRepository costRecordRepository;

    /**
     * Evalúa el punto de inflexión biológico y ventana óptima de cosecha para un lote específico.
     */
    public HarvestOptimizationResponse evaluateHarvestOptimization(
            UUID batchId,
            BigDecimal customMarketPrice,
            UUID ownerId) {

        log.info("Evaluando optimización de cosecha HU-07 para lote ID {}", batchId);

        Batch batch = batchService.findBatchEntity(batchId);
        farmService.findFarmEntity(batch.getFarm().getId(), ownerId);

        String speciesName = batch.getSpecies().getCommonName();
        String speciesLower = speciesName.toLowerCase(Locale.ROOT);

        // 1. Peso objetivo comercial según especie
        BigDecimal targetCommercialWeightG = determineTargetWeight(speciesLower);

        // 2. Precio de mercado de referencia en pie ($/kg)
        BigDecimal marketPricePerKg = (customMarketPrice != null && customMarketPrice.compareTo(BigDecimal.ZERO) > 0)
                ? customMarketPrice
                : determineDefaultMarketPrice(speciesLower);

        // 3. Biometrías históricas y estado poblacional
        List<BiometryRecord> biometries = biometryRecordRepository.findByBatchIdOrderBySamplingDateDesc(batchId);
        int totalMortality = biometryRecordRepository.sumMortalityByBatchId(batchId);
        int activePopulation = Math.max(0, batch.getInitialQuantity() - totalMortality);

        BigDecimal currentAvgWeightG;
        BigDecimal currentBiomassKg;
        BigDecimal dailyGainGPerAnimal = determineDefaultDailyGain(speciesLower);

        if (!biometries.isEmpty()) {
            BiometryRecord latest = biometries.get(0);
            currentAvgWeightG = latest.getCalculatedAvgWeightG() != null
                    ? latest.getCalculatedAvgWeightG()
                    : latest.getTotalSampleWeightG().divide(BigDecimal.valueOf(latest.getSampledCount()), 2, RoundingMode.HALF_UP);

            currentBiomassKg = latest.getEstimatedBiomassKg() != null
                    ? latest.getEstimatedBiomassKg()
                    : BigDecimal.valueOf(activePopulation).multiply(currentAvgWeightG).divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);

            if (biometries.size() >= 2) {
                BiometryRecord prev = biometries.get(1);
                long daysBetween = ChronoUnit.DAYS.between(prev.getSamplingDate(), latest.getSamplingDate());
                if (daysBetween > 0) {
                    BigDecimal weightDiffG = currentAvgWeightG.subtract(
                            prev.getCalculatedAvgWeightG() != null
                                    ? prev.getCalculatedAvgWeightG()
                                    : prev.getTotalSampleWeightG().divide(BigDecimal.valueOf(prev.getSampledCount()), 2, RoundingMode.HALF_UP)
                    );
                    if (weightDiffG.compareTo(BigDecimal.ZERO) > 0) {
                        dailyGainGPerAnimal = weightDiffG.divide(BigDecimal.valueOf(daysBetween), 2, RoundingMode.HALF_UP);
                    }
                }
            }
        } else {
            currentAvgWeightG = batch.getInitialAvgWeightG();
            currentBiomassKg = BigDecimal.valueOf(batch.getInitialQuantity())
                    .multiply(batch.getInitialAvgWeightG())
                    .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);
        }

        long daysInProduction = Math.max(1, ChronoUnit.DAYS.between(batch.getStockingDate(), LocalDate.now()));

        // 4. Costo promedio y consumo de alimento concentrado
        BigDecimal totalFeedKg = feedingRecordRepository.sumSuppliedQuantityByBatchId(batchId);
        BigDecimal totalFeedCost = feedingRecordRepository.sumTotalFeedCostByBatchId(batchId);

        BigDecimal averageFeedCostPerKg = new BigDecimal("4500.00");
        if (totalFeedKg.compareTo(BigDecimal.ZERO) > 0 && totalFeedCost.compareTo(BigDecimal.ZERO) > 0) {
            averageFeedCostPerKg = totalFeedCost.divide(totalFeedKg, 2, RoundingMode.HALF_UP);
        }

        // 5. FCR acumulado
        BigDecimal initialBiomassKg = BigDecimal.valueOf(batch.getInitialQuantity())
                .multiply(batch.getInitialAvgWeightG())
                .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);
        BigDecimal netBiomassGainedKg = currentBiomassKg.subtract(initialBiomassKg);

        BigDecimal accumulatedFcr = batch.getSpecies().getExpectedFcr() != null
                ? batch.getSpecies().getExpectedFcr()
                : new BigDecimal("1.30");

        if (netBiomassGainedKg.compareTo(BigDecimal.ZERO) > 0 && totalFeedKg.compareTo(BigDecimal.ZERO) > 0) {
            accumulatedFcr = totalFeedKg.divide(netBiomassGainedKg, 2, RoundingMode.HALF_UP);
        }

        // 6. FCR Marginal del periodo más reciente
        BigDecimal marginalFcr = calculateMarginalFcr(biometries, batchId, accumulatedFcr, currentAvgWeightG, targetCommercialWeightG);

        // 7. Costo marginal por kilogramo ganado: FCR marginal * costo de 1 kg de alimento
        BigDecimal marginalCostPerKgGain = marginalFcr.multiply(averageFeedCostPerKg).setScale(2, RoundingMode.HALF_UP);

        // 8. Margen marginal por kg producido ($/kg de ganancia neta)
        BigDecimal marginalProfitPerKgGain = marketPricePerKg.subtract(marginalCostPerKgGain).setScale(2, RoundingMode.HALF_UP);

        // 9. Ganancia diaria de biomasa de todo el lote (kg/día)
        BigDecimal dailyBiomassGainKg = BigDecimal.valueOf(activePopulation)
                .multiply(dailyGainGPerAnimal)
                .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);

        // 10. Pérdida o Ganancia diaria proyectada del lote completo
        BigDecimal projectedDailyProfitOrLoss = dailyBiomassGainKg.multiply(marginalProfitPerKgGain).setScale(2, RoundingMode.HALF_UP);

        // 11. Reglas de Inflexión y Diagnóstico de Cosecha
        String harvestStatus;
        String recommendationTitle;
        String recommendationMessage;
        boolean isPastOptimalPoint = false;
        LocalDate recommendedHarvestDate = LocalDate.now();

        if (marginalProfitPerKgGain.compareTo(BigDecimal.ZERO) <= 0) {
            harvestStatus = "OPTIMAL_HARVEST";
            isPastOptimalPoint = true;
            recommendationTitle = "¡Punto de Inflexión Biológico Sobrepasado! Cosecha Inmediata";
            recommendationMessage = String.format(
                    Locale.ROOT,
                    "Cada kilogramo ganado cuesta $%s en concentrado frente a $%s de precio de venta en pie. Continuar alimentando genera una pérdida proyectada de $%s COP/día para el lote. Se recomienda faenar/cosechar de inmediato.",
                    marginalCostPerKgGain.toPlainString(),
                    marketPricePerKg.toPlainString(),
                    projectedDailyProfitOrLoss.abs().toPlainString()
            );
            recommendedHarvestDate = LocalDate.now();
        } else if (currentAvgWeightG.compareTo(targetCommercialWeightG) >= 0) {
            harvestStatus = "OPTIMAL_HARVEST";
            isPastOptimalPoint = false;
            recommendationTitle = "Talla Comercial Óptima Alcanzada";
            recommendationMessage = String.format(
                    Locale.ROOT,
                    "El lote alcanzó el peso objetivo del mercado (%s g vs %s g meta). La tasa de conversión marginal (%s FCR) comienza a elevar los costos. Se recomienda programar la cosecha esta semana para asegurar el margen máximo.",
                    currentAvgWeightG.toPlainString(),
                    targetCommercialWeightG.toPlainString(),
                    marginalFcr.toPlainString()
            );
            recommendedHarvestDate = LocalDate.now().plusDays(3);
        } else {
            BigDecimal eightyFivePercentWeight = targetCommercialWeightG.multiply(new BigDecimal("0.85"));
            BigDecimal eightyPercentPrice = marketPricePerKg.multiply(new BigDecimal("0.80"));

            if (currentAvgWeightG.compareTo(eightyFivePercentWeight) >= 0 || marginalCostPerKgGain.compareTo(eightyPercentPrice) >= 0) {
                harvestStatus = "APPROACHING_HARVEST";
                isPastOptimalPoint = false;
                recommendationTitle = "Lote en Fase de Acabado Final";
                long remainingGrams = targetCommercialWeightG.subtract(currentAvgWeightG).longValue();
                long estimatedDays = dailyGainGPerAnimal.compareTo(BigDecimal.ZERO) > 0
                        ? Math.max(7, (long) Math.ceil(remainingGrams / dailyGainGPerAnimal.doubleValue()))
                        : 14;

                recommendationMessage = String.format(
                        Locale.ROOT,
                        "El lote está al %.1f%% de su peso de faenado (%s g de %s g). El costo marginal por kg ganado es de $%s COP. Se recomienda coordinar la venta mayorista para los próximos %d días.",
                        (currentAvgWeightG.doubleValue() / targetCommercialWeightG.doubleValue()) * 100.0,
                        currentAvgWeightG.toPlainString(),
                        targetCommercialWeightG.toPlainString(),
                        marginalCostPerKgGain.toPlainString(),
                        estimatedDays
                );
                recommendedHarvestDate = LocalDate.now().plusDays(estimatedDays);
            } else {
                harvestStatus = "GROWTH_PHASE";
                isPastOptimalPoint = false;
                recommendationTitle = "Fase de Crecimiento y Conversión Eficiente";
                recommendationMessage = String.format(
                        Locale.ROOT,
                        "El lote convierte eficientemente con un FCR marginal de %s. La ganancia diaria genera una rentabilidad neta proyectada de $%s COP/día para el lote. Continuar con el plan de ración estipulado.",
                        marginalFcr.toPlainString(),
                        projectedDailyProfitOrLoss.toPlainString()
                );
                long remainingGrams = targetCommercialWeightG.subtract(currentAvgWeightG).longValue();
                long estimatedDays = dailyGainGPerAnimal.compareTo(BigDecimal.ZERO) > 0
                        ? Math.max(21, (long) Math.ceil(remainingGrams / dailyGainGPerAnimal.doubleValue()))
                        : 45;
                recommendedHarvestDate = LocalDate.now().plusDays(estimatedDays);
            }
        }

        return new HarvestOptimizationResponse(
                batch.getId(),
                batch.getBatchCode(),
                speciesName,
                currentAvgWeightG,
                targetCommercialWeightG,
                currentBiomassKg,
                activePopulation,
                daysInProduction,
                accumulatedFcr,
                marginalFcr,
                averageFeedCostPerKg,
                marginalCostPerKgGain,
                marketPricePerKg,
                marginalProfitPerKgGain,
                dailyBiomassGainKg,
                projectedDailyProfitOrLoss,
                harvestStatus,
                recommendationTitle,
                recommendationMessage,
                recommendedHarvestDate,
                isPastOptimalPoint
        );
    }

    /**
     * Evalúa la optimización de cosecha para todos los lotes activos de una granja.
     */
    public List<HarvestOptimizationResponse> evaluateFarmHarvestOptimizations(
            UUID farmId,
            BigDecimal customMarketPrice,
            UUID ownerId) {

        farmService.findFarmEntity(farmId, ownerId);
        List<Batch> batches = batchService.findBatchEntitiesByFarm(farmId);

        List<HarvestOptimizationResponse> results = new ArrayList<>();
        for (Batch batch : batches) {
            if (!"harvested".equalsIgnoreCase(batch.getStatus()) && !"cancelled".equalsIgnoreCase(batch.getStatus())) {
                results.add(evaluateHarvestOptimization(batch.getId(), customMarketPrice, ownerId));
            }
        }
        return results;
    }

    private BigDecimal calculateMarginalFcr(
            List<BiometryRecord> biometries,
            UUID batchId,
            BigDecimal accumulatedFcr,
            BigDecimal currentWeightG,
            BigDecimal targetWeightG) {

        if (biometries.size() >= 2) {
            BiometryRecord bLatest = biometries.get(0);
            BiometryRecord bPrev = biometries.get(1);

            BigDecimal wLatest = bLatest.getCalculatedAvgWeightG() != null
                    ? bLatest.getCalculatedAvgWeightG()
                    : bLatest.getTotalSampleWeightG().divide(BigDecimal.valueOf(bLatest.getSampledCount()), 2, RoundingMode.HALF_UP);
            BigDecimal wPrev = bPrev.getCalculatedAvgWeightG() != null
                    ? bPrev.getCalculatedAvgWeightG()
                    : bPrev.getTotalSampleWeightG().divide(BigDecimal.valueOf(bPrev.getSampledCount()), 2, RoundingMode.HALF_UP);

            BigDecimal weightGainG = wLatest.subtract(wPrev);
            if (weightGainG.compareTo(BigDecimal.ZERO) > 0) {
                List<FeedingRecord> feedings = feedingRecordRepository.findByBatchIdOrderByFeedingDateDescFeedingTimeDesc(batchId);
                BigDecimal feedInIntervalKg = BigDecimal.ZERO;

                for (FeedingRecord f : feedings) {
                    if (!f.getFeedingDate().isBefore(bPrev.getSamplingDate()) && !f.getFeedingDate().isAfter(bLatest.getSamplingDate())) {
                        feedInIntervalKg = feedInIntervalKg.add(f.getSuppliedQuantityKg());
                    }
                }

                int population = bLatest.getEstimatedBiomassKg() != null && wLatest.compareTo(BigDecimal.ZERO) > 0
                        ? bLatest.getEstimatedBiomassKg().multiply(new BigDecimal("1000.00")).divide(wLatest, 0, RoundingMode.HALF_UP).intValue()
                        : 1000;

                BigDecimal totalBiomassGainedKg = BigDecimal.valueOf(population)
                        .multiply(weightGainG)
                        .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);

                if (feedInIntervalKg.compareTo(BigDecimal.ZERO) > 0 && totalBiomassGainedKg.compareTo(BigDecimal.ZERO) > 0) {
                    return feedInIntervalKg.divide(totalBiomassGainedKg, 2, RoundingMode.HALF_UP);
                }
            }
        }

        // Modelo biológico de decaimiento marginal según madurez comercial
        double maturityRatio = currentWeightG.doubleValue() / Math.max(1.0, targetWeightG.doubleValue());
        double fcrBase = accumulatedFcr.doubleValue();
        double marginalEstimate;

        if (maturityRatio <= 0.60) {
            marginalEstimate = fcrBase * 0.95;
        } else if (maturityRatio <= 0.85) {
            marginalEstimate = fcrBase * 1.10;
        } else if (maturityRatio <= 1.0) {
            marginalEstimate = fcrBase * 1.30;
        } else {
            marginalEstimate = fcrBase * (1.30 + (maturityRatio - 1.0) * 1.80);
        }

        return BigDecimal.valueOf(marginalEstimate).setScale(2, RoundingMode.HALF_UP);
    }

    private BigDecimal determineTargetWeight(String speciesLower) {
        if (speciesLower.contains("cerdo") || speciesLower.contains("porcin") || speciesLower.contains("pig")) {
            return new BigDecimal("105000.00"); // 105 kg
        } else if (speciesLower.contains("trucha") || speciesLower.contains("trout")) {
            return new BigDecimal("400.00"); // 400 g
        } else if (speciesLower.contains("cachama") || speciesLower.contains("pacu")) {
            return new BigDecimal("650.00"); // 650 g
        } else {
            return new BigDecimal("500.00"); // Tilapia estándar 500 g
        }
    }

    private BigDecimal determineDefaultMarketPrice(String speciesLower) {
        if (speciesLower.contains("cerdo") || speciesLower.contains("porcin") || speciesLower.contains("pig")) {
            return new BigDecimal("9500.00"); // 9,500 COP/kg cerdo en pie
        } else if (speciesLower.contains("trucha") || speciesLower.contains("trout")) {
            return new BigDecimal("16000.00"); // 16,000 COP/kg trucha arcoíris
        } else if (speciesLower.contains("cachama") || speciesLower.contains("pacu")) {
            return new BigDecimal("10500.00"); // 10,500 COP/kg cachama blanca
        } else {
            return new BigDecimal("12000.00"); // 12,000 COP/kg tilapia roja
        }
    }

    private BigDecimal determineDefaultDailyGain(String speciesLower) {
        if (speciesLower.contains("cerdo") || speciesLower.contains("porcin") || speciesLower.contains("pig")) {
            return new BigDecimal("750.00"); // 750 g/día en ceba
        } else if (speciesLower.contains("trucha") || speciesLower.contains("trout")) {
            return new BigDecimal("3.20"); // 3.2 g/día
        } else if (speciesLower.contains("cachama") || speciesLower.contains("pacu")) {
            return new BigDecimal("3.50"); // 3.5 g/día
        } else {
            return new BigDecimal("2.80"); // 2.8 g/día tilapia roja
        }
    }
}
