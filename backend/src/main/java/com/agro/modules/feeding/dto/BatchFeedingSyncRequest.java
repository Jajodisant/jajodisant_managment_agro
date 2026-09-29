package com.agro.modules.feeding.dto;

import java.util.List;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotEmpty;

/**
 * DTO para la sincronización por lotes de registros capturados en terreno sin conexión (HU-04 Offline Mode).
 */
public record BatchFeedingSyncRequest(
    @NotEmpty(message = "La lista de registros para sincronizar no puede estar vacía")
    List<@Valid CreateFeedingRecordRequest> records
) {}
