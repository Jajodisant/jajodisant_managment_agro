package com.agro.modules.species.dto;

import java.math.BigDecimal;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

/**
 * DTO para parametrizar un tramo en la curva de alimentación de una especie.
 */
public record CreateFeedingTableRequest(
    @NotNull(message = "El peso mínimo es obligatorio")
    @DecimalMin(value = "0.01", message = "El peso mínimo debe ser mayor a 0 gramos")
    BigDecimal minWeightG,

    @NotNull(message = "El peso máximo es obligatorio")
    @DecimalMin(value = "0.01", message = "El peso máximo debe ser mayor a 0 gramos")
    BigDecimal maxWeightG,

    @NotNull(message = "El porcentaje de biomasa es obligatorio")
    @DecimalMin(value = "0.01", message = "El porcentaje de biomasa debe ser mayor a 0")
    BigDecimal biomassPercentage,

    @NotNull(message = "La frecuencia diaria de alimentación es obligatoria")
    @Min(value = 1, message = "Debe haber al menos 1 ración al día")
    Integer dailyFrequency,

    BigDecimal suggestedProteinPct
) {}
