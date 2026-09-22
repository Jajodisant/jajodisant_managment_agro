package com.agro.modules.farm.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * DTO inmutable (Record) para la parametrización de un nuevo estanque o instalación acuícola.
 * Cumple estrictamente con los criterios de aceptación de la Historia de Usuario HU-01:
 * - Escenario 1: Captura de dimensiones (largo, ancho, profundidad) para cálculo automático de volumen.
 * - Escenario 2: Asignación o sugerencia de densidad máxima zootécnica basada en la presencia de aireación mecánica.
 *
 * @param codeName        Código o nombre identificador del estanque (ej: 'Estanque T-01', máx. 50 caracteres).
 * @param pondType        Tipo de estructura constructiva: 'earthen' (tierra), 'geomembrane', 'concrete', 'cage'.
 * @param lengthM         Longitud física en metros (mayor a 0).
 * @param widthM          Ancho físico en metros (mayor a 0).
 * @param avgDepthM       Profundidad media de la columna de agua en metros (obligatorio, mayor a 0).
 * @param hasAeration     Indica si dispone de aireación mecánica forzada (splasher, paletas, blower).
 * @param maxDensityKgM3  Límite máximo de carga biológica en kg/m³. Si se omite, el sistema asigna el valor técnico sugerido según aireación.
 */
public record CreatePondRequest(
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

    @DecimalMin(value = "0.1", message = "La densidad máxima debe ser al menos 0.1 kg/m³")
    BigDecimal maxDensityKgM3
) {}
