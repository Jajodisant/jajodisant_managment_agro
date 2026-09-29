package com.agro.modules.biometry.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

/**
 * DTO para el registro de un muestreo biométrico en campo (HU-05).
 */
public record CreateBiometryRequest(
    @NotNull(message = "La fecha del muestreo es obligatoria")
    LocalDate samplingDate,

    @NotNull(message = "La cantidad de peces muestreados es obligatoria")
    @Positive(message = "Debe muestrear al menos 1 pez")
    Integer sampledCount,

    @NotNull(message = "El peso total de la muestra es obligatorio")
    @DecimalMin(value = "0.01", message = "El peso de la muestra debe ser mayor a 0 gramos")
    BigDecimal totalSampleWeightG,

    @Min(value = 0, message = "La mortalidad observada no puede ser negativa")
    Integer observedMortality,

    String observations
) {}
