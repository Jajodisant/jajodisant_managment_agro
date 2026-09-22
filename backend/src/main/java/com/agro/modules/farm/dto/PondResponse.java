package com.agro.modules.farm.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.agro.modules.farm.domain.Pond;

/**
 * DTO inmutable (Record) de salida para información consolidada de un estanque.
 * Implementa los cálculos zootécnicos clave requeridos por la Historia de Usuario HU-01:
 * - Volumen cúbico efectivo de agua (m³).
 * - Aforo o capacidad de carga biológica máxima permitida (kg de biomasa).
 *
 * @param id                    Identificador único UUID del estanque.
 * @param farmId                Identificador UUID de la granja a la que pertenece.
 * @param farmName              Nombre descriptivo de la granja contenedora.
 * @param codeName              Código de identificación en campo del estanque (ej: 'T-01').
 * @param pondType              Tipo de estructura física constructiva.
 * @param lengthM               Longitud física en metros.
 * @param widthM                Ancho físico en metros.
 * @param avgDepthM             Profundidad media de la columna de agua en metros.
 * @param volumeM3              Volumen total de agua en metros cúbicos (m³).
 * @param hasAeration           Presencia de sistemas de aireación mecánica.
 * @param maxDensityKgM3        Densidad máxima de carga biológica permitida (kg/m³).
 * @param maxBiomassCapacityKg  Capacidad de biomasa máxima calculada: volumeM3 * maxDensityKgM3 (kg).
 * @param isActive              Indicador de si el estanque se encuentra operativo o en descanso.
 * @param createdAt             Fecha y hora de creación del registro en el sistema.
 */
public record PondResponse(
    UUID id,
    UUID farmId,
    String farmName,
    String codeName,
    String pondType,
    BigDecimal lengthM,
    BigDecimal widthM,
    BigDecimal avgDepthM,
    BigDecimal volumeM3,
    boolean hasAeration,
    BigDecimal maxDensityKgM3,
    BigDecimal maxBiomassCapacityKg,
    boolean isActive,
    OffsetDateTime createdAt
) {
    /**
     * Mapea y calcula las métricas zootécnicas de una entidad {@link Pond} hacia {@link PondResponse}.
     *
     * @param pond Entidad JPA de origen.
     * @return DTO inmutable con volumen y capacidad máxima de biomasa calculados.
     */
    public static PondResponse fromEntity(Pond pond) {
        // Cálculo de volumen: si la columna generada en base de datos aún no está hidratada en memoria,
        // se computa directamente (largo * ancho * profundidad).
        BigDecimal volume = pond.getVolumeM3();
        if (volume == null && pond.getLengthM() != null && pond.getWidthM() != null && pond.getAvgDepthM() != null) {
            volume = pond.getLengthM()
                .multiply(pond.getWidthM())
                .multiply(pond.getAvgDepthM())
                .setScale(2, RoundingMode.HALF_UP);
        }

        // Capacidad máxima de biomasa = volumen (m³) * densidad máxima permitida (kg/m³)
        BigDecimal maxCapacity = null;
        if (volume != null && pond.getMaxDensityKgM3() != null) {
            maxCapacity = volume.multiply(pond.getMaxDensityKgM3()).setScale(2, RoundingMode.HALF_UP);
        }

        return new PondResponse(
            pond.getId(),
            pond.getFarm() != null ? pond.getFarm().getId() : null,
            pond.getFarm() != null ? pond.getFarm().getName() : null,
            pond.getCodeName(),
            pond.getPondType(),
            pond.getLengthM(),
            pond.getWidthM(),
            pond.getAvgDepthM(),
            volume,
            pond.isHasAeration(),
            pond.getMaxDensityKgM3(),
            maxCapacity,
            pond.isActive(),
            pond.getCreatedAt()
        );
    }
}
