package com.agro.modules.advisory.dto;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import io.swagger.v3.oas.annotations.media.Schema;

/**
 * Reporte clínico y diagnóstico zootécnico generado por el consultorio asistido (HU-12).
 */
@Schema(description = "Dictamen clínico veterinario preliminar con protocolo de bioseguridad y tratamiento regulado")
public record VetConsultationResponse(
    @Schema(description = "Identificador único de la consulta clínica")
    UUID id,

    @Schema(description = "Identificador de la granja")
    UUID farmId,

    @Schema(description = "Identificador del lote evaluado (si aplica)")
    UUID batchId,

    @Schema(description = "Código del lote evaluado", example = "LT-TIL-2026-01")
    String batchCode,

    @Schema(description = "Tipo de producción", example = "PISCICULTURA")
    String productionType,

    @Schema(description = "Síntomas reportados en campo")
    String symptomsDescription,

    @Schema(description = "Diagnóstico presuntivo principal", example = "Estreptococosis Íctica Aguda")
    String presumptiveDiagnosis,

    @Schema(description = "Nivel de urgencia zootécnica (CRITICAL, HIGH, MODERATE, LOW)", example = "CRITICAL")
    String urgencyLevel,

    @Schema(description = "Porcentaje de certeza o concordancia clínica", example = "89.50")
    BigDecimal confidencePercentage,

    @Schema(description = "Protocolo de contingencia inmediata y bioseguridad en granja")
    String biosecurityProtocol,

    @Schema(description = "Tratamiento sugerido, posología de referencia y período de retiro ICA/FAO")
    String treatmentRecommendation,

    @Schema(description = "Instrucciones de toma y remisión de muestras a laboratorio oficial")
    String samplingInstructions,

    @Schema(description = "Lista de diagnósticos diferenciales considerados")
    List<DifferentialDiagnosisDto> differentials,

    @Schema(description = "Indica si la consulta fue validada por el médico veterinario oficial")
    Boolean veterinarianReviewed,

    @Schema(description = "Fecha y hora de generación de la consulta")
    Instant createdAt
) {}
