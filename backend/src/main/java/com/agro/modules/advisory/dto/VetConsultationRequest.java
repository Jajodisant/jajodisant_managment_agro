package com.agro.modules.advisory.dto;

import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Solicitud de consulta diagnóstica veterinaria asistida por IA (HU-12).
 */
@Schema(description = "Datos de entrada para el triaje clínico y diagnóstico veterinario preliminar")
public record VetConsultationRequest(
    @Schema(description = "Identificador de la granja", example = "5866a297-198f-4b62-8ea6-1cb2f28507b8")
    @NotNull(message = "El identificador de la granja es obligatorio")
    UUID farmId,

    @Schema(description = "Identificador opcional del lote afectado para contextualizar especie y biomasa", example = "4e49de2b-8176-49e9-9afd-1a842962a214")
    UUID batchId,

    @Schema(description = "Sistema productivo: PISCICULTURA o PORCICULTURA", example = "PISCICULTURA")
    @NotBlank(message = "El tipo de producción es obligatorio (PISCICULTURA o PORCICULTURA)")
    String productionType,

    @Schema(description = "Descripción detallada de signos clínicos, comportamiento, mortalidad o anomalías del agua/ambiente", example = "Tilapias boqueando en la superficie, aletas dorsales deshilachadas, nado en círculos y nubes blancas en piel.")
    @NotBlank(message = "La descripción de síntomas es obligatoria")
    @Size(min = 10, max = 3000, message = "La descripción de síntomas debe contener entre 10 y 3000 caracteres")
    String symptomsDescription
) {}
