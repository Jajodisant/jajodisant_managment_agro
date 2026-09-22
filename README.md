# Agro AI Management System (`AGRO-AI-SYS`)
Sistema Integral de Gestión Agropecuaria y Asesor de Decisiones con Inteligencia Artificial.

---

## 🐟 Descripción General

Plataforma integral diseñada para optimizar la toma de decisiones zootécnicas y financieras en explotaciones agropecuarias, con un MVP inicial de alta especialización en **Acuicultura (Piscicultura: Tilapia, Trucha, Cachama)** y escalabilidad hacia Ganadería de Precisión y Agricultura.

### Objetivos Clave
* **Control de Conversión Alimenticia (FCR):** Seguimiento diario de raciones según tablas nutricionales por rango de peso corporal.
* **Costeo Real Continuo ($/kg):** Cálculo en tiempo real del costo acumulado por kilogramo vivo producido.
* **Aforo Zootécnico y Capacidad de Carga:** Cálculo automático de volumen cúbico ($m^3$) y densidad límite según aireación forzada.
* **Prevención y Bioseguridad:** Detección oportuna de anomalías en calidad de agua y asistencia zootécnica.
* **Operatividad en Campo:** Arquitectura Offline-First (PWA) para registro en la orilla del estanque sin conectividad celular.

---

## 📊 Estado de Avance del Proyecto

* **Fase 1 (MVP Piscícola Operativo & Costos Directos):** **~36%**
* **Proyecto Global (Fases 1, 2 y 3):** **~18%**

### Tablero de Módulos del MVP

| Módulo / Componente | Estado | PR | Descripción |
| :--- | :---: | :---: | :--- |
| **Entorno Base & DevOps** | ✅ Completado | PR #1 | Docker Compose, PostgreSQL 16 con `pgvector`, Spring Boot 3.3.4. |
| **Base de Datos & Flyway** | ✅ Completado | PR #2 | Migración `V1__init_schema.sql` (9 tablas, índices de rendimiento y vista SQL). |
| **Entidades de Dominio JPA** | ✅ Completado | PR #3 | 10 entidades mapeadas (`Farm`, `Pond`, `Species`, `Batch`, `Biometry`, etc.). |
| **Farm & Pond: Persistencia & DTOs** | ✅ Completado | PR #5 | Repositorios JPA con tenancy por `ownerId` y DTOs inmutables (Java Records). |
| **Farm & Pond: Servicios & API REST**| 🟡 Próximo | - | Lógica zootécnica de volumen/aforo (HU-01), controladores y Swagger UI. |
| **Catálogo de Especies** | ⏳ Pendiente | - | Repositorios, curvas de alimentación nutricionales por especie y peso. |
| **Lotes y Siembras** | ⏳ Pendiente | - | HU-02: Registro de siembras, trazabilidad de etapas y alertas de sobrecupo. |
| **Biometrías y FCR** | ⏳ Pendiente | - | HU-05: Muestreos periódicos, ganancia diaria (GMD) y FCR acumulado. |
| **Alimentación Diaria** | ⏳ Pendiente | - | HU-03, HU-04: Cuota diaria de alimento y registro offline. |
| **Costos y Finanzas** | ⏳ Pendiente | - | HU-06: Costos directos/indirectos y costo por kilo en tiempo real ($/kg). |
| **Frontend PWA & Offline** | ⏳ Pendiente | - | React 18 + TS + Vite + TailwindCSS con Dexie.js (IndexedDB). |

---

## 🛠️ Stack Tecnológico

* **Backend:** Java 21 LTS, Spring Boot 3.3.4, Spring Data JPA, Hibernate, Spring Security + JJWT 0.12.6, Flyway, OpenAPI/Swagger 2.6.0, Lombok.
* **Base de Datos:** PostgreSQL 16 con extensión `pgvector` nativa.
* **Frontend:** React 18+, TypeScript, Vite, TailwindCSS (PWA con persistencia local IndexedDB).
* **Contenedores:** Docker y Docker Compose.
* **Metodología Git:** Git Flow (`main`, `develop`, `feature/*`, `docs/*`).

---

## 🚀 Inicio Rápido (Desarrollo Local)

### 1. Requisitos Previos
* Docker y Docker Compose
* JDK 21
* Maven 3.9+

### 2. Configuración y Base de Datos
```bash
# Copiar variables de entorno si no existen
cp -n .env.example .env

# Iniciar PostgreSQL 16 con soporte pgvector
docker compose up -d postgres
```

### 3. Compilar Backend
```bash
cd backend
mvn clean compile
```

### 4. Estructura de Paquetes Backend
```text
com.agro
├── AgroApplication.java
├── config/                  # Seguridad JWT, CORS, Exception Handler
├── common/                  # Excepciones globales y DTOs de respuesta
└── modules/
    ├── farm/                # Granjas, Estanques y aforo zootécnico (HU-01)
    ├── species/             # Catálogo y tablas nutricionales
    ├── lot/                 # Lotes, siembras y ciclo productivo (HU-02)
    ├── biometry/            # Muestreos de peso, GMD y FCR (HU-05)
    ├── feeding/             # Raciones y alimentación offline (HU-03, HU-04)
    ├── finance/             # Costos directos y $/kg en tiempo real (HU-06)
    └── advisory/            # Bitácora e inteligencia asistencial (HU-08)
```

---

## 📄 Licencia
Proyecto privado. Todos los derechos reservados.
