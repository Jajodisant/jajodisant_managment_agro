package com.agro.common.exception;

/**
 * Excepción lanzada cuando una entidad requerida no existe en la base de datos.
 * Mapea a un código HTTP 404 (Not Found).
 */
public class ResourceNotFoundException extends RuntimeException {

    public ResourceNotFoundException(String message) {
        super(message);
    }

    public ResourceNotFoundException(String resourceName, Object identifier) {
        super(String.format("%s no encontrado con el identificador: '%s'", resourceName, identifier));
    }
}
