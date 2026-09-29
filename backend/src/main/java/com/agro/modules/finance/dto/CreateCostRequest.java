package com.agro.modules.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;

/**
 * DTO para el registro de egresos y costos de producción (HU-06).
 */
public record CreateCostRequest(
    @NotNull(message = "La granja es obligatoria")
    UUID farmId,

    UUID batchId,

    LocalDate expenseDate,

    @NotBlank(message = "La categoría del costo es obligatoria")
    @Pattern(regexp = "^(fingerlings|feed|labor|energy|chemicals|maintenance|other)$",
             message = "Categoría inválida. Opciones: fingerlings, feed, labor, energy, chemicals, maintenance, other")
    String category,

    @NotBlank(message = "La descripción del costo es obligatoria")
    String description,

    @NotNull(message = "El monto es obligatorio")
    @DecimalMin(value = "0.01", message = "El monto debe ser mayor a 0")
    BigDecimal totalAmount
) {}
