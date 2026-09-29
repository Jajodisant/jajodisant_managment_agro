package com.agro.modules.biometry.controller;

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
import com.agro.modules.biometry.dto.BiometryResponse;
import com.agro.modules.biometry.dto.CreateBiometryRequest;
import com.agro.modules.biometry.service.BiometryService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el registro de muestreos biométricos y cálculo de FCR (HU-05).
 */
@Tag(name = "Biometrías", description = "Endpoints para el registro de muestreos biométricos y cálculo automático de FCR y GMD (HU-05)")
@RestController
@RequestMapping("/batches/{batchId}/biometries")
@RequiredArgsConstructor
public class BiometryController {

    private final BiometryService biometryService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(
        summary = "Registrar muestreo biométrico con cálculo automático de FCR (HU-05)",
        description = "Ingresa peso de muestra y mortalidad observada para actualizar biomasa, ganancia diaria (GMD) "
                + "y computar el Factor de Conversión Alimenticia (FCR) acumulado con semáforo verde/ámbar/rojo."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Muestreo registrado y métricas zootécnicas calculadas"),
        @ApiResponse(responseCode = "400", description = "Datos de muestreo inválidos"),
        @ApiResponse(responseCode = "404", description = "Lote no encontrado")
    })
    @PostMapping
    public ResponseEntity<BiometryResponse> recordBiometry(
            @PathVariable UUID batchId,
            @Valid @RequestBody CreateBiometryRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        BiometryResponse response = biometryService.recordBiometry(batchId, ownerId, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Historial de biometrías de un lote", description = "Lista todos los muestreos periódicos del lote ordenados cronológicamente.")
    @ApiResponse(responseCode = "200", description = "Historial biométrico recuperado")
    @GetMapping
    public ResponseEntity<List<BiometryResponse>> getBiometries(
            @PathVariable UUID batchId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(biometryService.getBiometriesByBatch(batchId, ownerId));
    }
}
