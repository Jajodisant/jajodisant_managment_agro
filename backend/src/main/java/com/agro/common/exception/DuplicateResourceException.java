package com.agro.common.exception;

/**
 * Excepción lanzada cuando se intenta registrar un recurso que viola restricciones de unicidad de negocio.
 * Mapea a un código HTTP 409 (Conflict).
 */
public class DuplicateResourceException extends RuntimeException {

    public DuplicateResourceException(String message) {
        super(message);
    }

    public DuplicateResourceException(String resourceName, String field, Object value) {
        super(String.format("Ya existe un %s con %s '%s'", resourceName, field, value));
    }
}
