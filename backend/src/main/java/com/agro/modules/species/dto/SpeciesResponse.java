package com.agro.modules.species.dto;

import java.math.BigDecimal;
import java.util.UUID;

import com.agro.modules.species.domain.Species;

/**
 * DTO inmutable de salida con las características y umbrales de confort de una especie acuícola.
 */
public record SpeciesResponse(
    UUID id,
    String commonName,
    String scientificName,
    BigDecimal expectedFcr,
    BigDecimal optimalTempMin,
    BigDecimal optimalTempMax,
    BigDecimal minOxygenMgL,
    int feedingTablesCount
) {
    public static SpeciesResponse fromEntity(Species species) {
        int count = (species.getFeedingTables() != null) ? species.getFeedingTables().size() : 0;
        return new SpeciesResponse(
            species.getId(),
            species.getCommonName(),
            species.getScientificName(),
            species.getExpectedFcr(),
            species.getOptimalTempMin(),
            species.getOptimalTempMax(),
            species.getMinOxygenMgL(),
            count
        );
    }
}
