package com.agro.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

import io.swagger.v3.oas.models.OpenAPI;
import io.swagger.v3.oas.models.info.Contact;
import io.swagger.v3.oas.models.info.Info;
import io.swagger.v3.oas.models.info.License;
import io.swagger.v3.oas.models.servers.Server;

import java.util.List;

/**
 * Configuración OpenAPI 3.0 / Swagger UI para documentación viva de los endpoints agropecuarios.
 */
@Configuration
public class OpenApiConfig {

    @Bean
    public OpenAPI customOpenAPI() {
        return new OpenAPI()
            .info(new Info()
                .title("API de Gestión Agropecuaria & Asesor Piscícola")
                .version("1.0.0")
                .description("Plataforma integral para parametrización de granjas, cálculo de aforo de estanques (HU-01), "
                        + "trazabilidad de biometrías, curvas de alimentación y proyecciones zootécnicas.")
                .contact(new Contact()
                    .name("Equipo de Desarrollo Agro")
                    .email("contacto@agro-management.internal"))
                .license(new License().name("Apache 2.0").url("https://springdoc.org")))
            .servers(List.of(
                new Server().url("/api/v1").description("Servidor Local / Contexto Base API v1")
            ));
    }
}
