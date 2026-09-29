package com.agro.modules.feeding.dto;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

/**
 * DTO con el cálculo técnico de la cuota y horario de alimentación diaria (HU-03).
 */
public record DailyFeedingPlanResponse(
    UUID batchId,
    String batchCode,
    String speciesCommonName,
    BigDecimal currentAvgWeightG,
    BigDecimal currentBiomassKg,
    BigDecimal recommendedBiomassPercentage,
    BigDecimal totalDailyQuotaKg,
    Integer dailyFrequency,
    BigDecimal rationQuotaKg,
    List<String> suggestedHours,
    BigDecimal suggestedProteinPct
) {}
