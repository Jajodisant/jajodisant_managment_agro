package com.agro.modules.species.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO inmutable para la creación de una nueva especie en el catálogo zootécnico.
 */
public record CreateSpeciesRequest(
    @NotBlank(message = "El nombre común de la especie es obligatorio")
    @Size(max = 100, message = "El nombre común no debe superar los 100 caracteres")
    String commonName,

    @Size(max = 100, message = "El nombre científico no debe superar los 100 caracteres")
    String scientificName,

    @DecimalMin(value = "0.50", message = "El FCR esperado debe ser al menos 0.50")
    BigDecimal expectedFcr,

    BigDecimal optimalTempMin,
    BigDecimal optimalTempMax,
    BigDecimal minOxygenMgL
) {}
