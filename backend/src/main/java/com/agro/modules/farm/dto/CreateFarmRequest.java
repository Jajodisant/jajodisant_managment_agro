package com.agro.modules.farm.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * DTO inmutable (Record) para la creación y registro de una nueva granja o unidad productiva.
 *
 * @param name     Nombre descriptivo o comercial de la granja (obligatorio, máx. 150 caracteres).
 * @param location Ubicación geográfica, vereda o municipio de la explotación física (opcional).
 */
public record CreateFarmRequest(
    @NotBlank(message = "El nombre de la granja es obligatorio")
    @Size(max = 150, message = "El nombre no debe superar los 150 caracteres")
    String name,

    String location
) {}
