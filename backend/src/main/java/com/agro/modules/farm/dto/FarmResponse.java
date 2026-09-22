package com.agro.modules.farm.dto;

import java.time.OffsetDateTime;
import java.util.UUID;

import com.agro.modules.farm.domain.Farm;

/**
 * DTO inmutable (Record) de salida con los datos consolidados de una granja y su infraestructura.
 *
 * @param id          Identificador único UUID de la granja.
 * @param name        Nombre registrado de la granja.
 * @param ownerId     Identificador UUID del usuario propietario (multi-tenancy).
 * @param location    Ubicación física o vereda de la granja.
 * @param pondsCount  Número total de estanques registrados en la granja.
 * @param createdAt   Fecha y hora de creación del registro con zona horaria.
 */
public record FarmResponse(
    UUID id,
    String name,
    UUID ownerId,
    String location,
    int pondsCount,
    OffsetDateTime createdAt
) {
    /**
     * Mapea una entidad {@link Farm} a su representación {@link FarmResponse}.
     *
     * @param farm Entidad JPA de origen.
     * @return Instancia inmutable de FarmResponse con el conteo de estanques.
     */
    public static FarmResponse fromEntity(Farm farm) {
        int count = (farm.getPonds() != null) ? farm.getPonds().size() : 0;
        return new FarmResponse(
            farm.getId(),
            farm.getName(),
            farm.getOwnerId(),
            farm.getLocation(),
            count,
            farm.getCreatedAt()
        );
    }
}
