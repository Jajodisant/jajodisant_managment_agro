package com.agro.common.exception;

/**
 * Excepción lanzada cuando una operación viola una regla de negocio zootécnica o funcional.
 * Mapea a un código HTTP 422 (Unprocessable Entity).
 */
public class BusinessRuleException extends RuntimeException {

    public BusinessRuleException(String message) {
        super(message);
    }
}
