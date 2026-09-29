package com.agro.modules.lot.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.agro.config.CurrentUserProvider;
import com.agro.modules.lot.dto.BatchResponse;
import com.agro.modules.lot.dto.CreateBatchRequest;
import com.agro.modules.lot.dto.UpdateBatchStatusRequest;
import com.agro.modules.lot.service.BatchService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el ciclo productivo y siembra de lotes biológicos (HU-02).
 */
@Tag(name = "Lotes", description = "Endpoints para la siembra de lotes, alertas preventivas de aforo y ciclo biológico")
@RestController
@RequestMapping("/batches")
@RequiredArgsConstructor
public class BatchController {

    private final BatchService batchService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(
        summary = "Registrar siembra de lote con alerta de sobrecupo (HU-02)",
        description = "Inicia el ciclo productivo de un lote verificando la capacidad máxima del estanque. "
                + "Emite alerta preventiva si la biomasa proyectada a cosecha excede el aforo técnico."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Lote sembrado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Parámetros inválidos"),
        @ApiResponse(responseCode = "409", description = "Código de lote duplicado"),
        @ApiResponse(responseCode = "422", description = "Alerta preventiva de sobrepoblación (HU-02) requiere confirmación 'forceStocking=true'")
    })
    @PostMapping
    public ResponseEntity<BatchResponse> createBatch(
            @Valid @RequestBody CreateBatchRequest request,
            @Parameter(description = "UUID del usuario propietario")
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        BatchResponse response = batchService.createBatch(request, ownerId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Listar lotes de una granja", description = "Consulta todos los lotes biológicos registrados en una granja.")
    @ApiResponse(responseCode = "200", description = "Lista de lotes obtenida")
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<BatchResponse>> getBatchesByFarm(
            @PathVariable UUID farmId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(batchService.getBatchesByFarm(farmId, ownerId));
    }

    @Operation(summary = "Obtener detalle de un lote", description = "Consulta el estado biológico actual y trazabilidad del lote.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lote encontrado"),
        @ApiResponse(responseCode = "404", description = "Lote no encontrado")
    })
    @GetMapping("/{batchId}")
    public ResponseEntity<BatchResponse> getBatchById(
            @PathVariable UUID batchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(batchService.getBatchById(batchId, ownerId));
    }

    @Operation(summary = "Actualizar estado del ciclo biológico", description = "Avanza la etapa del lote: stocking, nursing, growout, harvested o cancelled.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estado del lote actualizado"),
        @ApiResponse(responseCode = "400", description = "Estado inválido"),
        @ApiResponse(responseCode = "404", description = "Lote no encontrado")
    })
    @PatchMapping("/{batchId}/status")
    public ResponseEntity<BatchResponse> updateBatchStatus(
            @PathVariable UUID batchId,
            @Valid @RequestBody UpdateBatchStatusRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(batchService.updateBatchStatus(batchId, ownerId, request));
    }
}
