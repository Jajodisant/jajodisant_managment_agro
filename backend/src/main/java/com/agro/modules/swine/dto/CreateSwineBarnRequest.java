package com.agro.modules.swine.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateSwineBarnRequest(
    @NotNull(message = "El ID de la granja es obligatorio")
    UUID farmId,

    @NotBlank(message = "El código o nombre del galpón es obligatorio")
    String codeName,

    String barnType,

    @Positive(message = "El largo debe ser mayor a 0")
    BigDecimal lengthM,

    @Positive(message = "El ancho debe ser mayor a 0")
    BigDecimal widthM,

    Boolean hasAutomaticVentilation,
    Boolean hasCoolingSystem
) {}
