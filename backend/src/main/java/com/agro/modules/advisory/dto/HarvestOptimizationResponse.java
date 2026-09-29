package com.agro.modules.advisory.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

/**
 * DTO de respuesta para la recomendación de Punto de Inflexión Biológico y Cosecha Óptima (HU-07).
 */
public record HarvestOptimizationResponse(
    UUID batchId,
    String batchCode,
    String speciesName,
    BigDecimal currentAvgWeightG,
    BigDecimal targetCommercialWeightG,
    BigDecimal currentBiomassKg,
    Integer activePopulation,
    Long daysInProduction,
    BigDecimal accumulatedFcr,
    BigDecimal marginalFcr,
    BigDecimal averageFeedCostPerKg,
    BigDecimal marginalCostPerKgGain,
    BigDecimal marketPricePerKg,
    BigDecimal marginalProfitPerKgGain,
    BigDecimal dailyBiomassGainKg,
    BigDecimal projectedDailyProfitOrLoss,
    String harvestStatus,
    String recommendationTitle,
    String recommendationMessage,
    LocalDate recommendedHarvestDate,
    Boolean isPastOptimalPoint
) {}
