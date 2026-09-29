package com.agro.modules.feeding.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * DTO para registrar una ración de concentrado suministrada en estanque (HU-04).
 */
public record CreateFeedingRecordRequest(
    LocalDate feedingDate,

    @Positive(message = "El número de ración debe ser positivo")
    Integer rationNumber,

    @NotNull(message = "La hora de suministro es obligatoria")
    LocalTime feedingTime,

    @NotBlank(message = "La marca o tipo de concentrado es obligatorio")
    @Size(max = 100, message = "El tipo de concentrado no debe superar los 100 caracteres")
    String feedBrandType,

    @NotNull(message = "La cantidad suministrada en kg es obligatoria")
    @DecimalMin(value = "0.01", message = "La cantidad suministrada debe ser mayor a 0 kg")
    BigDecimal suppliedQuantityKg,

    @NotNull(message = "El costo unitario por kilogramo es obligatorio")
    @DecimalMin(value = "0.00", message = "El costo no puede ser negativo")
    BigDecimal costPerKg,

    BigDecimal waterTemperatureC,
    BigDecimal dissolvedOxygenMgL
) {}
