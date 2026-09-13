# BITÁCORA DE ESTADO Y GUÍA DE CONTINUIDAD TÉCNICA
**Proyecto:** `jajodisant_managment_agro`  
**Última Actualización:** 2026-09-13  
**Propósito de este documento:** Proveer contexto operativo inmediato para cualquier sesión futura (o nuevo agente de IA), resumiendo el estado exacto del repositorio, lo construido, las decisiones tomadas y el plan de reanudación paso a paso.

---

## 1. ESTADO ACTUAL DEL REPOSITORIO & GIT

### 1.1 Ramas y Pull Requests
* **Rama Principal de Producción:** `main` (inicializada con el plan maestro de arquitectura).
* **Rama de Integración:** `develop` (al día con los cambios aprobados).
* **PRs Mergeados en `develop`:**
  * **PR #1:** `feature/initial-setup` (Configuración base de Docker Compose, `.env.example`, `.gitignore`, `backend/pom.xml`, `application.yml` y `AgroApplication.java`).
  * **PR #2:** `feature/db-flyway-schema` (Migración Flyway `V1__init_schema.sql` corregida con índices zootécnicos/financieros y diagrama ERD).
* **Rama Local Actual:** `develop` (actualizada con `git pull origin develop`, working tree limpio).

### 1.2 Repositorio Remoto en GitHub
* **URL:** [https://github.com/Jajodisant/jajodisant_managment_agro](https://github.com/Jajodisant/jajodisant_managment_agro)

---

## 2. ARQUITECTURA TÉCNICA IMPLEMENTADA HASTA HOY

### 2.1 Pila de Tecnologías (Stack)
* **Base de Datos:** PostgreSQL 16 sobre Docker (con extensión `pgvector` contemplada para Fase 3).
* **Backend:** Java 21 LTS + Spring Boot 3.3.4 (Maven, Spring Data JPA, Hibernate, Flyway, Spring Security + JJWT 0.12.6, Springdoc OpenAPI/Swagger 2.6.0, Lombok, Bean Validation).
* **Frontend:** React 18+ con TypeScript + Vite + TailwindCSS estructurado como PWA (soporte offline-first con IndexedDB).
* **Orquestación:** `docker-compose.yml` multitenant con redes y volúmenes persistentes.

### 2.2 Archivos Críticos Configurados en el Proyecto
1. `docker-compose.yml`: Define servicios `postgres`, `backend` y `frontend` con `healthcheck` para PostgreSQL.
2. `.env.example`: Contrato de variables de entorno para DB, backend (puerto 8080, JWT) y frontend (puerto 3000).
3. `backend/pom.xml`: Todas las dependencias declaradas y listas para compilar con JDK 21.
4. `backend/src/main/resources/application.yml`:
   * `server.servlet.context-path: /api/v1`
   * `spring.jpa.hibernate.ddl-auto: validate` (Hibernate valida, no modifica; Flyway manda).
   * `flyway.enabled: true` apuntando a `classpath:db/migration`.
5. `backend/src/main/java/com/agro/AgroApplication.java`: Punto de entrada de la aplicación Spring Boot.
6. `backend/src/main/resources/db/migration/V1__init_schema.sql`:
   * 9 tablas: `farm`, `pond`, `species`, `feeding_table`, `batch`, `biometry_record`, `feeding_record`, `cost_record`, `log_event`.
   * Columna generada inmutable `pond.volume_m3 = (length_m * width_m * avg_depth_m) STORED`.
   * Relación `farm_id` en `cost_record` y `log_event` para soportar costos globales de la granja y eventos climáticos generales.
   * Índices de rendimiento zootécnico y financiero creados para evitar escaneos secuenciales.
7. `docs/database/ERD_DIAGRAM.md`: Diagrama Mermaid completo de la base de datos con tablas de cardinalidad.
8. Árbol de carpetas completo: Creado para backend modular (DDD) y frontend.

---

## 3. HOJA DE RUTA PARA LA PRÓXIMA SESIÓN (QUÉ HACER PASO A PASO)

Cuando abras un nuevo chat o retomes el trabajo, continúa exactamente desde estos pasos:

### Paso 1: Levantar la Base de Datos Local
Verificar que Docker esté corriendo y encender el contenedor de base de datos:
```bash
cd /home/jajodisant/Desktop/jajodisant_managment_agro
cp -n .env.example .env  # Si aún no existe el archivo .env real
docker compose up -d postgres
docker compose ps        # Verificar que el estado sea 'healthy'
```

### Paso 2: Crear la Nueva Rama de Funcionalidad
Crear la rama para el primer módulo de negocio del backend partiendo de `develop`:
```bash
git checkout develop
git pull origin develop
git checkout -b feature/backend-farm-module
```

### Paso 3: Construir el Módulo `farm` (Infraestructura)
Implementar en `backend/src/main/java/com/agro/modules/farm/`:
1. **Dominio (`domain/`):**
   * Clase `Farm.java`: Mapeo JPA de la tabla `farm` (`@Entity`, `@Table(name = "farm")`, campos `id`, `name`, `ownerId`, `location`, `createdAt`).
   * Clase `Pond.java`: Mapeo JPA de la tabla `pond` (`@Entity`, `@Table(name = "pond")`, relación `@ManyToOne` hacia `Farm`, campos de dimensiones, cálculo de volumen y densidad).
2. **Repositorio (`repository/`):**
   * `FarmRepository.java`: Extiende `JpaRepository<Farm, UUID>` con método `List<Farm> findByOwnerId(UUID ownerId)`.
   * `PondRepository.java`: Extiende `JpaRepository<Pond, UUID>` con método `List<Pond> findByFarmIdAndIsActiveTrue(UUID farmId)`.
3. **DTOs (`dto/`):**
   * Java records para solicitudes y respuestas (`CreateFarmRequest`, `FarmResponse`, `CreatePondRequest`, `PondResponse`).
4. **Servicio (`service/`):**
   * `FarmService.java` y `PondService.java`: Reglas de negocio (validar que el aforo no se exceda, validar que las dimensiones sean positivas).
5. **Controlador (`controller/`):**
   * `FarmController.java` y `PondController.java` exponiendo endpoints REST documentados con `@Tag` y `@Operation` de OpenAPI en `/api/v1/farms` y `/api/v1/ponds`.

### Paso 4: Validar la Ejecución del Backend
Correr la aplicación Spring Boot para comprobar que Flyway aplique la migración `V1__init_schema.sql` contra PostgreSQL y que Swagger UI esté accesible en:
`http://localhost:8080/api/v1/swagger-ui.html`

### Paso 5: Git Flow
Hacer commit, push de `feature/backend-farm-module` y abrir Pull Request hacia `develop`.

---

## 4. INSTRUCCIONES PARA EL AGENTE DE IA EN SESIONES FUTURAS
* El usuario prioriza el rigor técnico, la arquitectura limpia (Clean Architecture / Monolito Modular) y la precisión zootécnica/financiera.
* Mantener siempre comentarios cortos en español en el código y nombres de tablas/clases/métodos en inglés.
* Respetar el flujo Git Flow: ningún commit directo a `main` o `develop`; siempre trabajar en `feature/*` y pasar por Pull Request.
