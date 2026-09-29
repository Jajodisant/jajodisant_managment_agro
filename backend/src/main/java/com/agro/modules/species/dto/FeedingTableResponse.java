package com.agro.modules.species.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.agro.modules.species.domain.FeedingTable;

/**
 * DTO inmutable de salida para la tabla de alimentación por rango de peso.
 */
public record FeedingTableResponse(
    UUID id,
    UUID speciesId,
    String speciesCommonName,
    BigDecimal minWeightG,
    BigDecimal maxWeightG,
    BigDecimal biomassPercentage,
    Integer dailyFrequency,
    BigDecimal suggestedProteinPct
) {
    public static FeedingTableResponse fromEntity(FeedingTable ft) {
        return new FeedingTableResponse(
            ft.getId(),
            ft.getSpecies() != null ? ft.getSpecies().getId() : null,
            ft.getSpecies() != null ? ft.getSpecies().getCommonName() : null,
            ft.getMinWeightG(),
            ft.getMaxWeightG(),
            ft.getBiomassPercentage(),
            ft.getDailyFrequency(),
            ft.getSuggestedProteinPct()
        );
    }
}
