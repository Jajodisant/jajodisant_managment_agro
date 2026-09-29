package com.agro.modules.advisory.controller;

import java.util.List;
import java.util.UUID;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.agro.config.CurrentUserProvider;
import com.agro.modules.advisory.dto.VetConsultationRequest;
import com.agro.modules.advisory.dto.VetConsultationResponse;
import com.agro.modules.advisory.service.VetDiagnosisService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el Consultorio Veterinario Asistido por IA (HU-12).
 * Proporciona triaje clínico, diagnóstico diferencial, medidas inmediatas de bioseguridad
 * y trazabilidad de consultas sanitarias para peces y cerdos.
 */
@Tag(name = "Consultorio Veterinario Asistido (HU-12)", description = "Triaje clínico patológico, diagnósticos diferenciales y protocolos de bioseguridad agropecuaria.")
@RestController
@RequestMapping("/advisory/vet/consultations")
@RequiredArgsConstructor
public class VetConsultationController {

    private final VetDiagnosisService vetDiagnosisService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(
        summary = "Realizar consulta diagnóstica veterinaria asistida",
        description = "Evalúa signos clínicos patológicos en texto o voz reportados en campo para peces o cerdos, contrastándolos con manuales zootécnicos."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Diagnóstico diferencial y protocolo de bioseguridad generados exitosamente"),
        @ApiResponse(responseCode = "400", description = "Solicitud inválida o faltan campos obligatorios"),
        @ApiResponse(responseCode = "404", description = "Granja o lote no encontrados")
    })
    @PostMapping
    public ResponseEntity<VetConsultationResponse> createConsultation(
            @Valid @RequestBody VetConsultationRequest request,
            @Parameter(description = "Identificador opcional del usuario autenticado en header")
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        VetConsultationResponse response = vetDiagnosisService.createConsultation(request, ownerId);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @Operation(
        summary = "Historial de consultas veterinarias por granja",
        description = "Obtiene todas las consultas clínicas y diagnósticos emitidos para una unidad productiva en orden cronológico descendente."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Historial de consultas recuperado exitosamente"),
        @ApiResponse(responseCode = "404", description = "Granja no encontrada")
    })
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<VetConsultationResponse>> getConsultationsByFarm(
            @PathVariable UUID farmId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        List<VetConsultationResponse> list = vetDiagnosisService.getConsultationsByFarm(farmId, ownerId);
        return ResponseEntity.ok(list);
    }

    @Operation(
        summary = "Historial de consultas veterinarias por lote",
        description = "Obtiene el expediente clínico veterinario asociado a un lote biológico de peces o corral de cerdos."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Expediente de lote recuperado exitosamente")
    })
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<VetConsultationResponse>> getConsultationsByBatch(
            @PathVariable UUID batchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        List<VetConsultationResponse> list = vetDiagnosisService.getConsultationsByBatch(batchId, ownerId);
        return ResponseEntity.ok(list);
    }
}
