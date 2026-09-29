package com.agro.modules.lot.dto;

import java.time.LocalDate;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;

/**
 * DTO para la transición de fases del ciclo biológico (stocking -> nursing -> growout -> harvested -> cancelled).
 */
public record UpdateBatchStatusRequest(
    @NotBlank(message = "El estado es obligatorio")
    @Pattern(regexp = "^(stocking|nursing|growout|harvested|cancelled)$", 
             message = "Estado inválido. Opciones permitidas: stocking, nursing, growout, harvested, cancelled")
    String status,

    LocalDate actualHarvestDate
) {}
