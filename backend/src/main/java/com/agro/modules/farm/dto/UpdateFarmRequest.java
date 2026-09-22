package com.agro.modules.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO inmutable (Record) para actualizar la información básica de una granja existente.
 *
 * @param name     Nombre actualizado de la granja (obligatorio, máx. 150 caracteres).
 * @param location Ubicación física o geográfica actualizada de la explotación (opcional).
 */
public record UpdateFarmRequest(
    @NotBlank(message = "El nombre de la granja es obligatorio")
    @Size(max = 150, message = "El nombre no debe superar los 150 caracteres")
    String name,

    String location
) {}
