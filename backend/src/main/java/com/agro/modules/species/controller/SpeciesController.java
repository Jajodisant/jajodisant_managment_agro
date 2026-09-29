package com.agro.modules.species.controller;

import java.net.URI;
import java.util.List;
import java.util.UUID;

import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.servlet.support.ServletUriComponentsBuilder;

import com.agro.modules.species.dto.CreateFeedingTableRequest;
import com.agro.modules.species.dto.CreateSpeciesRequest;
import com.agro.modules.species.dto.FeedingTableResponse;
import com.agro.modules.species.dto.SpeciesResponse;
import com.agro.modules.species.service.SpeciesService;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.responses.ApiResponse;
import io.swagger.v3.oas.annotations.responses.ApiResponses;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/**
 * Controlador REST para el catálogo zootécnico de especies y curvas de alimentación técnica.
 */
@Tag(name = "Especies", description = "Endpoints para el catálogo de especies y curvas nutricionales de alimentación")
@RestController
@RequestMapping("/species")
@RequiredArgsConstructor
public class SpeciesController {

    private final SpeciesService speciesService;

    @Operation(summary = "Registrar una nueva especie", description = "Añade una especie al catálogo con sus parámetros de confort zootécnico.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Especie creada con éxito"),
        @ApiResponse(responseCode = "400", description = "Datos inválidos"),
        @ApiResponse(responseCode = "409", description = "Especie ya existente")
    })
    @PostMapping
    public ResponseEntity<SpeciesResponse> createSpecies(@Valid @RequestBody CreateSpeciesRequest request) {
        SpeciesResponse response = speciesService.createSpecies(request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Listar todas las especies", description = "Devuelve el catálogo completo de especies disponibles para cultivo.")
    @ApiResponse(responseCode = "200", description = "Catálogo obtenido exitosamente")
    @GetMapping
    public ResponseEntity<List<SpeciesResponse>> getAllSpecies() {
        return ResponseEntity.ok(speciesService.getAllSpecies());
    }

    @Operation(summary = "Obtener detalle de una especie", description = "Consulta la ficha zootécnica de una especie por su ID.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Especie encontrada"),
        @ApiResponse(responseCode = "404", description = "Especie no encontrada")
    })
    @GetMapping("/{id}")
    public ResponseEntity<SpeciesResponse> getSpeciesById(@PathVariable UUID id) {
        return ResponseEntity.ok(speciesService.getSpeciesById(id));
    }

    @Operation(summary = "Añadir tramo a tabla de alimentación", description = "Configura la ración porcentual diaria y raciones por día según rango de peso corporal.")
    @ApiResponses({
        @ApiResponse(responseCode = "201", description = "Tramo de alimentación registrado"),
        @ApiResponse(responseCode = "400", description = "Datos o rangos inválidos"),
        @ApiResponse(responseCode = "404", description = "Especie no encontrada")
    })
    @PostMapping("/{speciesId}/feeding-tables")
    public ResponseEntity<FeedingTableResponse> addFeedingTable(
            @PathVariable UUID speciesId,
            @Valid @RequestBody CreateFeedingTableRequest request) {

        FeedingTableResponse response = speciesService.addFeedingTable(speciesId, request);
        URI location = ServletUriComponentsBuilder.fromCurrentRequest()
                .path("/{id}")
                .buildAndExpand(response.id())
                .toUri();
        return ResponseEntity.created(location).body(response);
    }

    @Operation(summary = "Consultar tabla de alimentación de una especie", description = "Retorna la curva nutricional completa ordenada por rangos crecientes de peso corporal.")
    @ApiResponses({
        @ApiResponse(responseCode = "200", description = "Tabla nutricional obtenida"),
        @ApiResponse(responseCode = "404", description = "Especie no encontrada")
    })
    @GetMapping("/{speciesId}/feeding-tables")
    public ResponseEntity<List<FeedingTableResponse>> getFeedingTables(@PathVariable UUID speciesId) {
        return ResponseEntity.ok(speciesService.getFeedingTablesBySpecies(speciesId));
    }
}
