package com.agro.modules.farm.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.agro.config.CurrentUserProvider;
import com.agro.modules.farm.dto.CreatePondRequest;
import com.agro.modules.farm.dto.PondResponse;
import com.agro.modules.farm.dto.UpdatePondRequest;
import com.agro.modules.farm.service.PondService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para la gestión de Estanques y Unidades de Cultivo.
 * Implementa la API correspondiente a la Historia de Usuario HU-01 (Aforo y parametrización).
 */
@Tag(name = "Estanques", description = "Endpoints para el registro, configuración física y aforo zootécnico de estanques (HU-01)")
@RestController
@RequestMapping("/farms/{farmId}/ponds")
@RequiredArgsConstructor
public class PondController {

    private final PondService pondService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(
        summary = "Registrar y parametrizar un nuevo estanque (HU-01)",
        description = "Crea un estanque rectangular o circular calculando automáticamente su volumen hídrico (m³) "
                + "y sugiriendo la densidad máxima permitida (kg/m³) según disponga o no de aireación mecánica."
    )
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Estanque registrado y aforo calculado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Dimensiones o datos de entrada inválidos"),
        @ApiResponse(responseCode = "404", description = "Granja no encontrada"),
        @ApiResponse(responseCode = "409", description = "Código de estanque ya existente en la granja")
    })
    @PostMapping
    public ResponseEntity<PondResponse> createPond(
            @PathVariable UUID farmId,
            @Valid @RequestBody CreatePondRequest request,
            @Parameter(description = "UUID del usuario propietario (opcional en desarrollo)")
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        PondResponse response = pondService.createPond(farmId, ownerId, request);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Listar estanques de una granja", description = "Consulta todas las unidades de cultivo de la granja con soporte de filtro por estado activo.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Lista de estanques obtenida"),
        @ApiResponse(responseCode = "404", description = "Granja no encontrada")
    })
    @GetMapping
    public ResponseEntity<List<PondResponse>> getPonds(
            @PathVariable UUID farmId,
            @Parameter(description = "Si es true, filtra únicamente estanques activos y listos para producción")
            @RequestParam(required = false) Boolean onlyActive,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(pondService.getPondsByFarm(farmId, ownerId, onlyActive));
    }

    @Operation(summary = "Obtener detalle y aforo de un estanque", description = "Recupera la ficha técnica completa de un estanque incluyendo su volumen y capacidad máxima de biomasa.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estanque encontrado"),
        @ApiResponse(responseCode = "404", description = "Estanque o granja no encontrados")
    })
    @GetMapping("/{pondId}")
    public ResponseEntity<PondResponse> getPondById(
            @PathVariable UUID farmId,
            @PathVariable UUID pondId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(pondService.getPondById(farmId, pondId, ownerId));
    }

    @Operation(summary = "Consultar métricas de capacidad y aforo (HU-01)", description = "Devuelve exclusivamente el cálculo de volumen y carga biológica máxima del estanque.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Métricas de aforo calculadas"),
        @ApiResponse(responseCode = "404", description = "Estanque o granja no encontrados")
    })
    @GetMapping("/{pondId}/capacity")
    public ResponseEntity<PondResponse> getPondCapacity(
            @PathVariable UUID farmId,
            @PathVariable UUID pondId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(pondService.getPondById(farmId, pondId, ownerId));
    }

    @Operation(summary = "Actualizar infraestructura de un estanque", description = "Modifica dimensiones, presencia de aireación o densidad zootécnica de un estanque.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Estanque actualizado"),
        @ApiResponse(responseCode = "400", description = "Parámetros inválidos"),
        @ApiResponse(responseCode = "404", description = "Estanque o granja no encontrados"),
        @ApiResponse(responseCode = "409", description = "Código de estanque ya en uso en la granja")
    })
    @PutMapping("/{pondId}")
    public ResponseEntity<PondResponse> updatePond(
            @PathVariable UUID farmId,
            @PathVariable UUID pondId,
            @Valid @RequestBody UpdatePondRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(pondService.updatePond(farmId, pondId, ownerId, request));
    }

    @Operation(summary = "Eliminar un estanque", description = "Elimina permanentemente una unidad de cultivo de la granja.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Estanque eliminado"),
        @ApiResponse(responseCode = "404", description = "Estanque o granja no encontrados")
    })
    @DeleteMapping("/{pondId}")
    public ResponseEntity<Void> deletePond(
            @PathVariable UUID farmId,
            @PathVariable UUID pondId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        pondService.deletePond(farmId, pondId, ownerId);
        return ResponseEntity.noContent().build();
    }
}
