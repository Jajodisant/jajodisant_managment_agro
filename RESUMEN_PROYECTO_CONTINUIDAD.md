# BITÁCORA DE ESTADO Y GUÍA DE CONTINUIDAD TÉCNICA
**Proyecto:** `jajodisant_managment_agro`  
**Última Actualización:** 2026-09-13  
**Propósito de este documento:** Proveer contexto operativo inmediato para cualquier sesión futura (o nuevo agente de IA), resumiendo el estado exacto del repositorio, las decisiones tomadas y la metodología de trabajo interactiva.

---

## 1. REGLAS METODOLÓGICAS DE TRABAJO (CÓMO TRABAJA EL USUARIO)

> ⚠️ **INSTRUCCIÓN OBLIGATORIA PARA EL ASISTENTE DE IA EN NUEVAS SESIONES:**
> 1. **NO crear archivos de código por tu cuenta automáticamente a menos que el usuario lo solicite explícitamente.**
> 2. **Metodología de Acompañamiento:** El usuario programa o pega el código manualmente para aprender y controlar cada componente. El asistente debe guiar **paso a paso, archivo por archivo**, explicando:
>    * Ruta exacta del archivo.
>    * Contenido de código limpio con comentarios explicativos en español.
>    * Por qué se implementa de esa forma (justificación de diseño y zootécnica).
> 3. **Git Flow Riguroso:**
>    * Nunca hacer commit a `main` ni a `develop` directamente.
>    * Cada funcionalidad se desarrolla en su propia rama `feature/<nombre-modulo>`.
>    * El ciclo obligatorio por módulo es:
>      1. Actualizar `develop` (`git checkout develop && git pull origin develop`).
>      2. Crear rama `feature/*` (`git checkout -b feature/...`).
>      3. Crear/editar los archivos paso a paso.
>      4. Probar y compilar localmente.
>      5. Commit con convención semántica (`feat(...)`, `fix(...)`, `docs(...)`).
>      6. Push al remoto (`git push -u origin feature/...`).
>      7. Crear Pull Request hacia `develop` (`gh pr create` o vía GitHub web).
>      8. El usuario revisa y mergea en GitHub.
>      9. Volver al paso 1 para la siguiente feature.

---

## 2. ESTADO ACTUAL DEL REPOSITORIO & GIT

### 2.1 Ramas y Pull Requests Mergeados
* **`main`**: Código de producción inicializado con el plan maestro.
* **`develop`**: Rama base de integración activa, 100% al día.
* **PRs Mergeados en `develop`:**
  * **PR #1:** `feature/initial-setup` (Docker Compose, `.env.example`, `.gitignore`, `backend/pom.xml`, `application.yml` y `AgroApplication.java`).
  * **PR #2:** `feature/db-flyway-schema` (Migración Flyway `V1__init_schema.sql` con 9 tablas, índices de rendimiento zootécnicos/financieros, costos a nivel de granja y diagrama ERD en `docs/database/ERD_DIAGRAM.md`).
* **Rama Local Actual:** `develop` (Clean working tree, sin cambios pendientes).

### 2.2 Repositorio Remoto en GitHub
* **URL:** [https://github.com/Jajodisant/jajodisant_managment_agro](https://github.com/Jajodisant/jajodisant_managment_agro)

---

## 3. ARQUITECTURA TÉCNICA IMPLEMENTADA HASTA HOY

* **Base de Datos:** PostgreSQL 16 sobre Docker (soporte `pgvector` en `docker-compose.yml` para Fase 3).
* **Backend:** Java 21 LTS + Spring Boot 3.3.4 (Maven, Spring Data JPA, Hibernate, Flyway, Spring Security + JJWT 0.12.6, Springdoc OpenAPI/Swagger 2.6.0, Lombok, Bean Validation).
* **Frontend:** React 18+ con TypeScript + Vite + TailwindCSS estructurado como PWA (soporte offline-first con IndexedDB).
* **Orquestación:** `docker-compose.yml` con healthcheck en Postgres para sincronización con el backend.

---

## 4. PRÓXIMA SESIÓN: GUÍA PASO A PASO (MÓDULO FARM & POND)

Al reanudar la sesión, el asistente debe guiar al usuario a realizar manualmente los siguientes pasos:

### Paso 1: Levantar PostgreSQL en Docker
```bash
cd /home/jajodisant/Desktop/jajodisant_managment_agro
cp -n .env.example .env
docker compose up -d postgres
docker compose ps # Confirmar estado 'healthy'
```

### Paso 2: Crear Rama de Funcionalidad
```bash
git checkout develop
git pull origin develop
git checkout -b feature/backend-farm-module
```

### Paso 3: Construcción Paso a Paso del Módulo (Archivo por Archivo)
Guiar al usuario para que cree manualmente en `backend/src/main/java/com/agro/modules/farm/`:
1. `domain/Farm.java` (Entidad JPA con `@Entity`, `@Table(name = "farm")`, UUID, campos y timestamps).
2. `domain/Pond.java` (Entidad JPA con `@Entity`, relación `@ManyToOne` con Farm, dimensiones y cálculo inmutable de volumen).
3. `repository/FarmRepository.java` (Interfaz Spring Data JPA).
4. `repository/PondRepository.java` (Interfaz Spring Data JPA).
5. `dto/CreateFarmRequest.java` y `dto/FarmResponse.java` (Records inmutables con validaciones Bean Validation `@NotBlank`).
6. `dto/CreatePondRequest.java` y `dto/PondResponse.java` (Records inmutables con validaciones de dimensiones positivas).
7. `service/FarmService.java` (Lógica de negocio y reglas de validación).
8. `service/PondService.java` (Lógica de aforo y cálculo de densidades zootécnicas).
9. `controller/FarmController.java` y `controller/PondController.java` (Endpoints REST `/api/v1/farms` y `/api/v1/ponds` documentados con Swagger).

### Paso 4: Verificación y Compilación
* Compilar con Maven: `./mvnw clean compile` o `mvn clean compile`.
* Levantar la app y verificar en `http://localhost:8080/api/v1/swagger-ui.html` que Flyway aplique la migración `V1` y Swagger exponga los nuevos endpoints.

### Paso 5: Ciclo Git Flow
* Hacer commit con mensaje convencional: `feat(farm): entidades jpa, repositorios y endpoints rest para granjas y estanques`.
* Push de la rama y creación de Pull Request hacia `develop`.
