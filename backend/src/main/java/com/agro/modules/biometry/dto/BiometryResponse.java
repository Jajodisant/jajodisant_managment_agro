package com.agro.modules.biometry.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * DTO inmutable con métricas zootécnicas consolidadas del muestreo (HU-05: FCR, GMD y Semáforo de alerta).
 */
public record BiometryResponse(
    UUID id,
    UUID batchId,
    String batchCode,
    LocalDate samplingDate,
    Integer sampledCount,
    BigDecimal totalSampleWeightG,
    BigDecimal calculatedAvgWeightG,
    Integer observedMortality,
    BigDecimal estimatedBiomassKg,
    Integer remainingPopulation,
    BigDecimal netBiomassGainedKg,
    BigDecimal accumulatedFeedKg,
    BigDecimal accumulatedFcr,
    String fcrStatus,
    BigDecimal dailyWeightGainG,
    String observations,
    OffsetDateTime createdAt
) {}
