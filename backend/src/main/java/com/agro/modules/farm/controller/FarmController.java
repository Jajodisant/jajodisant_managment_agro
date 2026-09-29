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
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.agro.config.CurrentUserProvider;
import com.agro.modules.farm.dto.CreateFarmRequest;
import com.agro.modules.farm.dto.FarmResponse;
import com.agro.modules.farm.dto.UpdateFarmRequest;
import com.agro.modules.farm.service.FarmService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.Parameter;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para la gestión de Granjas (Unidades Productivas Raíz).
 */
@Tag(name = "Granjas", description = "Endpoints para la administración y configuración de granjas piscícolas")
@RestController
@RequestMapping("/farms")
@RequiredArgsConstructor
public class FarmController {

    private final FarmService farmService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(summary = "Registrar una nueva granja", description = "Crea una unidad productiva raíz asociada al usuario autenticado.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Granja creada exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos")
    })
    @PostMapping
    public ResponseEntity<FarmResponse> createFarm(
            @Valid @RequestBody CreateFarmRequest request,
            @Parameter(description = "UUID del usuario propietario (opcional en desarrollo)")
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        FarmResponse response = farmService.createFarm(request, ownerId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Listar todas las granjas del usuario", description = "Recupera todas las granjas pertenecientes al usuario autenticado.")
    @ApiResponse(responseCode = "200", description = "Lista de granjas obtenida con éxito")
    @GetMapping
    public ResponseEntity<List<FarmResponse>> getFarms(
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(farmService.getFarmsByOwner(ownerId));
    }

    @Operation(summary = "Obtener detalle de una granja", description = "Consulta la información de una granja específica por su ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Granja encontrada"),
        @ApiResponse(responseCode = "404", description = "Granja no encontrada")
    })
    @GetMapping("/{farmId}")
    public ResponseEntity<FarmResponse> getFarmById(
            @PathVariable UUID farmId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(farmService.getFarmById(farmId, ownerId));
    }

    @Operation(summary = "Actualizar información de una granja", description = "Modifica los datos generales (nombre, ubicación) de una granja existente.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Granja actualizada"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "404", description = "Granja no encontrada")
    })
    @PutMapping("/{farmId}")
    public ResponseEntity<FarmResponse> updateFarm(
            @PathVariable UUID farmId,
            @Valid @RequestBody UpdateFarmRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(farmService.updateFarm(farmId, ownerId, request));
    }

    @Operation(summary = "Eliminar una granja", description = "Elimina permanentemente una granja y en cascada todos sus estanques asociados.")
    @ApiResponses({
        @ApiResponse(responseCode = "204", description = "Granja eliminada con éxito"),
        @ApiResponse(responseCode = "404", description = "Granja no encontrada")
    })
    @DeleteMapping("/{farmId}")
    public ResponseEntity<Void> deleteFarm(
            @PathVariable UUID farmId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        farmService.deleteFarm(farmId, ownerId);
        return ResponseEntity.noContent().build();
    }
}
