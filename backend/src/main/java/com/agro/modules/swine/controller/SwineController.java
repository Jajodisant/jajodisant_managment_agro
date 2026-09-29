package com.agro.modules.swine.controller;

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
import com.agro.modules.swine.dto.CreateSwineBarnRequest;
import com.agro.modules.swine.dto.CreateSwinePenRequest;
import com.agro.modules.swine.dto.SwineBarnResponse;
import com.agro.modules.swine.dto.SwinePenResponse;
import com.agro.modules.swine.service.SwineService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para la gestión de infraestructura porcícola (Galpones, Corrales y Aforo HU-10).
 */
@Tag(name = "Infraestructura Porcícola (HU-10)", description = "Endpoints para registro y aforo de galpones y corrales porcícolas según etapa de crecimiento.")
@RestController
@RequestMapping("/swine")
@RequiredArgsConstructor
public class SwineController {

    private final SwineService swineService;
    private final CurrentUserProvider currentUserProvider;

    @Operation(summary = "Registrar un galpón porcícola", description = "Crea una nave o galpón de confinamiento porcino asociada a una granja.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Galpón creado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "409", description = "Código de galpón ya existe en la granja")
    })
    @PostMapping("/barns")
    public ResponseEntity<SwineBarnResponse> createBarn(
            @Valid @RequestBody CreateSwineBarnRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        SwineBarnResponse response = swineService.createBarn(request, ownerId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Listar galpones de una granja", description = "Retorna todos los galpones activos de la granja.")
    @GetMapping("/barns/farm/{farmId}")
    public ResponseEntity<List<SwineBarnResponse>> getBarnsByFarm(
            @PathVariable UUID farmId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(swineService.getBarnsByFarm(farmId, ownerId));
    }

    @Operation(summary = "Registrar un corral porcícola", description = "Crea un corral con cálculo zootécnico automático de capacidad según etapa (precebo, levante, ceba).")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Corral creado exitosamente"),
        @ApiResponse(responseCode = "400", description = "Datos de entrada inválidos"),
        @ApiResponse(responseCode = "409", description = "Código de corral ya existe en el galpón")
    })
    @PostMapping("/pens")
    public ResponseEntity<SwinePenResponse> createPen(
            @Valid @RequestBody CreateSwinePenRequest request,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        SwinePenResponse response = swineService.createPen(request, ownerId);

        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();

        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Listar corrales de un galpón", description = "Retorna todos los corrales pertenecientes a un galpón con sus aforos zootécnicos.")
    @GetMapping("/pens/barn/{barnId}")
    public ResponseEntity<List<SwinePenResponse>> getPensByBarn(
            @PathVariable UUID barnId,
            @RequestHeader(value = "X-User-Id", required = false) UUID userIdHeader) {

        UUID ownerId = currentUserProvider.resolveUserId(userIdHeader);
        return ResponseEntity.ok(swineService.getPensByBarn(barnId, ownerId));
    }
}
