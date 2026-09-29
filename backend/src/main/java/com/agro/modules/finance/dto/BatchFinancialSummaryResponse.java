package com.agro.modules.finance.dto;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * DTO consolidado con la estructura financiera y costo por kilo en tiempo real (HU-06).
 */
public record BatchFinancialSummaryResponse(
    UUID batchId,
    String batchCode,
    BigDecimal currentBiomassKg,
    BigDecimal feedCost,
    BigDecimal fingerlingsCost,
    BigDecimal laborCost,
    BigDecimal energyCost,
    BigDecimal otherCosts,
    BigDecimal totalCumulativeCost,
    BigDecimal costPerKgProduced
) {}
