package com.agro.modules.finance.controller;

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
import com.agro.modules.finance.dto.BatchFinancialSummaryResponse;
import com.agro.modules.finance.dto.CostResponse;
import com.agro.modules.finance.dto.CreateCostRequest;
import com.agro.modules.finance.service.CostService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el registro de egresos y cálculo del costo de producción por kilo en tiempo real (HU-06).
 */
@Tag(name = "Finanzas y Costos", description = "Endpoints para registro de egresos y cálculo de costo por kilogramo producido ($/kg) (HU-06)")
@RestController
@RequestMapping("/costs")
@RequiredArgsConstructor
public class CostController {

    private final CostService costService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(summary = "Registrar un costo o egreso", description = "Asocia un costo directo o indirecto a una granja o a un lote específico.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Costo registrado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de costo inválidos"),
        @ApiResponse(responseCode = "404", description = "Granja o lote no encontrado")
    })
    @PostMapping
    public ResponseEntity<CostResponse> recordCost(
            @Valid @RequestBody CreateCostRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        CostResponse response = costService.recordCost(request, ownerId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Historial de egresos por granja", description = "Consulta todos los costos registrados en la granja ordenados por fecha.")
    @ApiResponse(responseCode = "200", description = "Costos obtenidos")
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<CostResponse>> getCostsByFarm(
            @PathVariable UUID farmId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(costService.getCostsByFarm(farmId, ownerId));
    }

    @Operation(summary = "Historial de egresos por lote", description = "Consulta los costos directos imputados a un lote específico.")
    @ApiResponse(responseCode = "200", description = "Costos obtenidos")
    @GetMapping("/batch/{batchId}")
    public ResponseEntity<List<CostResponse>> getCostsByBatch(
            @PathVariable UUID batchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(costService.getCostsByBatch(batchId, ownerId));
    }

    @Operation(
        summary = "Estructura de costos y costo por kilo en tiempo real (HU-06)",
        description = "Calcula el costo real acumulado consolidando alimento, alevines, energía y mano de obra, "
                + "arrojando el costo por kilogramo producido ($/kg) contra la biomasa viva actual."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Resumen financiero obtenido"),
        @ApiResponse(responseCode = "404", description = "Lote no encontrado")
    })
    @GetMapping("/batch/{batchId}/summary")
    public ResponseEntity<BatchFinancialSummaryResponse> getBatchFinancialSummary(
            @PathVariable UUID batchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(costService.getBatchFinancialSummary(batchId, ownerId));
    }
}
