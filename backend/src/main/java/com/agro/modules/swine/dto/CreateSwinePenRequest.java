package com.agro.modules.swine.dto;

import java.math.BigDecimal;
import java.util.UUID;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;

public record CreateSwinePenRequest(
    @NotNull(message = "El ID del galpón es obligatorio")
    UUID barnId,

    @NotBlank(message = "El código del corral es obligatorio")
    String penCode,

    String phase,

    @NotNull(message = "El largo del corral es obligatorio")
    @Positive(message = "El largo debe ser mayor a 0")
    BigDecimal lengthM,

    @NotNull(message = "El ancho del corral es obligatorio")
    @Positive(message = "El ancho debe ser mayor a 0")
    BigDecimal widthM,

    String drinkerType,
    Integer drinkerCount,
    Integer feederSpaces
) {}
