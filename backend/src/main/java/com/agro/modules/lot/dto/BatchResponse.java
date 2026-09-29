package com.agro.modules.lot.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.agro.modules.lot.domain.Batch;

/**
 * DTO inmutable de salida con las métricas biológicas y trazabilidad de un lote.
 */
public record BatchResponse(
    UUID id,
    UUID farmId,
    String farmName,
    UUID pondId,
    String pondCodeName,
    UUID speciesId,
    String speciesCommonName,
    String batchCode,
    LocalDate stockingDate,
    Integer initialQuantity,
    BigDecimal initialAvgWeightG,
    BigDecimal initialBiomassKg,
    String status,
    LocalDate estimatedHarvestDate,
    LocalDate actualHarvestDate,
    boolean overcrowdingWarning,
    BigDecimal overcrowdingPercentage,
    OffsetDateTime createdAt
) {
    public static BatchResponse fromEntity(Batch batch, boolean overcrowdingWarning, BigDecimal overcrowdingPercentage) {
        BigDecimal initialBiomass = BigDecimal.ZERO;
        if (batch.getInitialQuantity() != null && batch.getInitialAvgWeightG() != null) {
            initialBiomass = BigDecimal.valueOf(batch.getInitialQuantity())
                    .multiply(batch.getInitialAvgWeightG())
                    .divide(new BigDecimal("1000.00"), 2, RoundingMode.HALF_UP);
        }

        return new BatchResponse(
            batch.getId(),
            batch.getFarm() != null ? batch.getFarm().getId() : null,
            batch.getFarm() != null ? batch.getFarm().getName() : null,
            batch.getPond() != null ? batch.getPond().getId() : null,
            batch.getPond() != null ? batch.getPond().getCodeName() : null,
            batch.getSpecies() != null ? batch.getSpecies().getId() : null,
            batch.getSpecies() != null ? batch.getSpecies().getCommonName() : null,
            batch.getBatchCode(),
            batch.getStockingDate(),
            batch.getInitialQuantity(),
            batch.getInitialAvgWeightG(),
            initialBiomass,
            batch.getStatus(),
            batch.getEstimatedHarvestDate(),
            batch.getActualHarvestDate(),
            overcrowdingWarning,
            overcrowdingPercentage,
            batch.getCreatedAt()
        );
    }
}
