package com.agro.modules.advisory.controller;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.agro.config.CurrentUserProvider;
import com.agro.modules.advisory.dto.HarvestOptimizationResponse;
import com.agro.modules.advisory.service.HarvestOptimizationService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el Motor de Optimización de Cosecha / Sacrificio (HU-07).
 */
@Tag(name = "Optimización de Cosecha & Inflexión Biológica (HU-07)", description = "Endpoints para evaluación de punto de inflexión biológico, costo marginal de alimento y semana óptima de venta.")
@RestController
@RequestMapping("/advisory/harvest-optimization")
@RequiredArgsConstructor
public class HarvestOptimizationController {

    private final HarvestOptimizationService harvestOptimizationService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(
        summary = "Evaluar optimización de cosecha de un lote",
        description = "Calcula el FCR marginal, costo por kg ganado y detecta el punto de inflexión financiero vs el precio de mercado en pie."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Evaluación de cosecha calculada exitosamente"),
        @ApiResponse(responseCode = "404", description = "Lote o granja no encontrados")
    })
    @GetMapping("/{batchId}")
    public ResponseEntity<HarvestOptimizationResponse> getBatchHarvestOptimization(
            @PathVariable UUID batchId,
            @Parameter(description = "Precio de mercado opcional en COP/kg en pie para calibración dinámica")
            @RequestParam(required = false) BigDecimal marketPrice,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        HarvestOptimizationResponse response = harvestOptimizationService.evaluateHarvestOptimization(batchId, marketPrice, ownerId);
        return ResponseEntity.ok(response);
    }

    @Operation(
        summary = "Evaluar optimización de cosecha para toda una granja",
        description = "Retorna el diagnóstico zootécnico y comercial para todos los lotes activos de la granja."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de evaluaciones de la granja obtenida exitosamente"),
        @ApiResponse(responseCode = "404", description = "Granja no encontrada")
    })
    @GetMapping("/farm/{farmId}")
    public ResponseEntity<List<HarvestOptimizationResponse>> getFarmHarvestOptimizations(
            @PathVariable UUID farmId,
            @Parameter(description = "Precio de mercado opcional en COP/kg en pie para calibración dinámica")
            @RequestParam(required = false) BigDecimal marketPrice,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        List<HarvestOptimizationResponse> response = harvestOptimizationService.evaluateFarmHarvestOptimizations(farmId, marketPrice, ownerId);
        return ResponseEntity.ok(response);
    }
}
