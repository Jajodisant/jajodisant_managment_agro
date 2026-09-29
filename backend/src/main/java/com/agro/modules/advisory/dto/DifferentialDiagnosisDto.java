package com.agro.modules.advisory.dto;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Representa una hipótesis diagnóstica diferencial evaluada por el motor clínico veterinario.
 */
@Schema(description = "Hipótesis diagnóstica diferencial con índice de concordancia sintomática")
public record DifferentialDiagnosisDto(
    @Schema(description = "Nombre clínico de la patología o síndrome", example = "Estreptococosis de los Peces")
    String diseaseName,

    @Schema(description = "Agente etiológico o patógeno causal", example = "Streptococcus agalactiae / iniae")
    String pathogen,

    @Schema(description = "Porcentaje estimado de concordancia clínica", example = "88.5")
    Double matchProbability,

    @Schema(description = "Signo patognomónico o síntoma clave coincidente", example = "Nado errático espiral y exoftalmia bilateral")
    String keyIndicator
) {}
