package com.agro.common.exception;

import java.time.OffsetDateTime;
import java.util.Map;

import com.fasterxml.jackson.annotation.JsonInclude;

/**
 * Representación estándar de errores de la API REST.
 * Cumple con estándares de observabilidad y provee retroalimentación detallada para el frontend PWA.
 *
 * @param timestamp   Fecha y hora exacta en que ocurrió el error.
 * @param status      Código de estado HTTP.
 * @param error       Descripción corta del error HTTP.
 * @param message     Mensaje explicativo detallado para el usuario o desarrollador.
 * @param path        URI del endpoint que originó la falla.
 * @param fieldErrors Mapa de errores específicos por campo (aplicable a validaciones Bean Validation).
 */
@JsonInclude(JsonInclude.Include.NON_NULL)
public record ErrorResponse(
    OffsetDateTime timestamp,
    int status,
    String error,
    String message,
    String path,
    Map<String, String> fieldErrors
) {
    public static ErrorResponse of(int status, String error, String message, String path) {
        return new ErrorResponse(OffsetDateTime.now(), status, error, message, path, null);
    }

    public static ErrorResponse of(int status, String error, String message, String path, Map<String, String> fieldErrors) {
        return new ErrorResponse(OffsetDateTime.now(), status, error, message, path, fieldErrors);
    }
}
