package com.agro.modules.feeding.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.agro.config.CurrentUserProvider;
import com.agro.modules.feeding.dto.BatchFeedingSyncRequest;
import com.agro.modules.feeding.dto.CreateFeedingRecordRequest;
import com.agro.modules.feeding.dto.DailyFeedingPlanResponse;
import com.agro.modules.feeding.dto.FeedingRecordResponse;
import com.agro.modules.feeding.service.FeedingService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el cálculo de raciones diarias (HU-03) y registro/sincronización offline (HU-04).
 */
@Tag(name = "Alimentación", description = "Endpoints para cálculo de cuotas de concentrado (HU-03) y registro en campo con sincronización offline (HU-04)")
@RestController
@RequestMapping("/batches/{batchId}/feeding")
@RequiredArgsConstructor
public class FeedingController {

    private final FeedingService feedingService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(
        summary = "Consultar plan y horarios de alimentación diaria (HU-03)",
        description = "Calcula la cuota en kilogramos según la biomasa viva actual del lote y la tabla técnica de la especie, "
                + "repartiéndola en el número de raciones con sus horarios recomendados."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Plan diario calculado exitosamente"),
        @ApiResponse(responseCode = "404", description = "Lote no encontrado")
    })
    @GetMapping("/plan")
    public ResponseEntity<DailyFeedingPlanResponse> getDailyFeedingPlan(
            @PathVariable UUID batchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(feedingService.calculateDailyFeedingPlan(batchId, ownerId));
    }

    @Operation(
        summary = "Registrar suministro de ración (HU-04)",
        description = "Marca la entrega de una ración de concentrado en el estanque indicando kilogramos, costo y parámetros de agua."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Ración registrada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de ración inválidos"),
        @ApiResponse(responseCode = "404", description = "Lote no encontrado")
    })
    @PostMapping
    public ResponseEntity<FeedingRecordResponse> recordFeeding(
            @PathVariable UUID batchId,
            @Valid @RequestBody CreateFeedingRecordRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        FeedingRecordResponse response = feedingService.recordFeeding(batchId, ownerId, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(
        summary = "Sincronización por lotes en modo offline (HU-04 PWA Sync)",
        description = "Recibe los registros de alimentación almacenados temporalmente en el dispositivo (IndexedDB) "
                + "al recuperar conectividad y los persiste atómicamente en la base de datos central."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Registros sincronizados con éxito"),
        @ApiResponse(responseCode = "400", description = "Error en el formato de los registros"),
        @ApiResponse(responseCode = "404", description = "Lote no encontrado")
    })
    @PostMapping("/batch-sync")
    public ResponseEntity<List<FeedingRecordResponse>> syncBatchFeeding(
            @PathVariable UUID batchId,
            @Valid @RequestBody BatchFeedingSyncRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(feedingService.syncBatchFeeding(batchId, ownerId, request));
    }

    @Operation(summary = "Consultar historial de raciones suministradas", description = "Lista todas las entregas de alimento efectuadas en el lote.")
    @ApiResponse(responseCode = "200", description = "Historial obtenido")
    @GetMapping
    public ResponseEntity<List<FeedingRecordResponse>> getFeedingHistory(
            @PathVariable UUID batchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(feedingService.getFeedingHistory(batchId, ownerId));
    }
}
