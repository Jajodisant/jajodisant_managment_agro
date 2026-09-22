package com.agro.modules.farm.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO inmutable (Record) para actualizar la infraestructura física y los parámetros zootécnicos de un estanque.
 *
 * @param codeName        Código o nombre identificador del estanque (obligatorio, máx. 50 caracteres).
 * @param pondType        Tipo de estructura constructiva: 'earthen', 'geomembrane', 'concrete', 'cage'.
 * @param lengthM         Longitud física en metros (mayor a 0).
 * @param widthM          Ancho físico en metros (mayor a 0).
 * @param avgDepthM       Profundidad media de la columna de agua en metros (obligatorio, mayor a 0).
 * @param hasAeration     Indica si el estanque cuenta con aireación mecánica forzada.
 * @param maxDensityKgM3  Límite máximo de densidad zootécnica (kg de biomasa por m³).
 * @param isActive        Estado operativo del estanque (true = disponible para cultivo, false = secado/mantenimiento).
 */
public record UpdatePondRequest(
    @NotBlank(message = "El código o nombre del estanque es obligatorio")
    @Size(max = 50, message = "El código no debe superar los 50 caracteres")
    String codeName,

    String pondType,

    @DecimalMin(value = "0.01", message = "La longitud debe ser mayor a 0 metros")
    BigDecimal lengthM,

    @DecimalMin(value = "0.01", message = "El ancho debe ser mayor a 0 metros")
    BigDecimal widthM,

    @NotNull(message = "La profundidad promedio es obligatoria")
    @DecimalMin(value = "0.01", message = "La profundidad debe ser mayor a 0 metros")
    BigDecimal avgDepthM,

    boolean hasAeration,

    @NotNull(message = "La densidad máxima zootécnica es obligatoria")
    @DecimalMin(value = "0.1", message = "La densidad máxima debe ser al menos 0.1 kg/m³")
    BigDecimal maxDensityKgM3,

    boolean isActive
) {}
