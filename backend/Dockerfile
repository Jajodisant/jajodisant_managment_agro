# =========================================================================
# Etapa 1: Build de la aplicación Spring Boot con Maven y OpenJDK 21
# =========================================================================
FROM maven:3.9-eclipse-temurin-21-alpine AS builder

WORKDIR /build

# Copiar pom.xml para aprovechar la caché de capas de dependencias
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar el código fuente y compilar artefacto JAR
COPY src ./src
RUN mvn clean package -DskipTests -B

# =========================================================================
# Etapa 2: Imagen de ejecución ligera con JRE 21 Alpine
# =========================================================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# Crear usuario y grupo de sistema sin privilegios para mayor seguridad
RUN addgroup -S agrogroup && adduser -S agrouser -G agrogroup

# Copiar el JAR generado en la etapa de build
COPY --from=builder /build/target/agro-backend-0.0.1-SNAPSHOT.jar app.jar

# Permisos para el usuario no privilegiado
RUN chown -R agrouser:agrogroup /app
USER agrouser:agrogroup

EXPOSE 8080

HEALTHCHECK --interval=30s --timeout=5s --start-period=60s --retries=3 \
  CMD wget --quiet --tries=1 --spider http://localhost:8080/api/v1/species || exit 1

ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-XX:MaxRAMPercentage=75.0", "-jar", "app.jar"]
