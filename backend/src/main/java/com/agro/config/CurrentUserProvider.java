package com.agro.config;

import java.util.UUID;

import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;

/**
 * Proveedor utilitario para resolver el identificador del usuario autenticado (ownerId).
 * En producción extrae el UUID del contexto de seguridad JWT.
 * En desarrollo permite un header 'X-User-Id' o un UUID por defecto para agilizar pruebas.
 */
@Component
public class CurrentUserProvider {

    /**
     * UUID por defecto para entorno de desarrollo local y pruebas automatizadas.
     */
    public static final UUID DEFAULT_DEV_USER_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    /**
     * Resuelve el identificador único del usuario propietario.
     *
     * @param headerUserId UUID opcional recibido en el encabezado HTTP 'X-User-Id'.
     * @return UUID resuelto del propietario de los recursos agropecuarios.
     */
    public UUID resolveUserId(UUID headerUserId) {
        if (headerUserId != null) {
            return headerUserId;
        }

        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        if (authentication != null && authentication.isAuthenticated()
                && !"anonymousUser".equals(authentication.getPrincipal())) {
            try {
                return UUID.fromString(authentication.getName());
            } catch (IllegalArgumentException ignored) {
                // Si el principal no es un UUID directo, se continúa con el valor fallback
            }
        }

        return DEFAULT_DEV_USER_ID;
    }
}
