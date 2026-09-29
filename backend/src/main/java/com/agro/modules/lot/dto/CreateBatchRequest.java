package com.agro.modules.lot.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * DTO para la siembra y parametrización inicial de un lote biológico (HU-02).
 */
public record CreateBatchRequest(
    @NotNull(message = "La granja es obligatoria")
    UUID farmId,

    UUID pondId,

    UUID penId,

    @NotNull(message = "La especie es obligatoria")
    UUID speciesId,

    @NotBlank(message = "El código único del lote es obligatorio")
    @Size(max = 50, message = "El código de lote no debe superar los 50 caracteres")
    String batchCode,

    @NotNull(message = "La fecha de siembra es obligatoria")
    LocalDate stockingDate,

    @NotNull(message = "La cantidad inicial de peces es obligatoria")
    @Positive(message = "La cantidad inicial debe ser un número entero positivo")
    Integer initialQuantity,

    @NotNull(message = "El peso promedio inicial es obligatorio")
    @DecimalMin(value = "0.01", message = "El peso inicial promedio debe ser mayor a 0 gramos")
    BigDecimal initialAvgWeightG,

    @DecimalMin(value = "1.00", message = "El peso proyectado a cosecha debe ser al menos 1 gramo")
    BigDecimal targetHarvestWeightG,

    LocalDate estimatedHarvestDate,

    /**
     * Bandera para forzar la siembra consciente aún existiendo alerta preventiva de sobrecupo (HU-02).
     */
    boolean forceStocking
) {
    public CreateBatchRequest(
        UUID farmId,
        UUID pondId,
        UUID speciesId,
        String batchCode,
        LocalDate stockingDate,
        Integer initialQuantity,
        BigDecimal initialAvgWeightG,
        BigDecimal targetHarvestWeightG,
        LocalDate estimatedHarvestDate,
        boolean forceStocking
    ) {
        this(farmId, pondId, null, speciesId, batchCode, stockingDate, initialQuantity, initialAvgWeightG,
             targetHarvestWeightG, estimatedHarvestDate, forceStocking);
    }
}
