# Agro AI Management System (`AGRO-AI-SYS`)
Sistema Integral de Gestión Agropecuaria y Asesor de Decisiones con Inteligencia Artificial.

---

## 🐟 Descripción General

Plataforma integral diseñada para optimizar la toma de decisiones zootécnicas y financieras en explotaciones agropecuarias, con un MVP inicial de alta especialización en **Acuicultura (Piscicultura: Tilapia, Trucha, Cachama)** y escalabilidad hacia Ganadería de Precisión y Agricultura.

### Objetivos Clave
* **Control de Conversión Alimenticia (FCR):** Seguimiento diario de raciones según tablas nutricionales por rango de peso corporal.
* **Costeo Real Continuo ($/kg):** Cálculo en tiempo real del costo acumulado por kilogramo vivo producido.
* **Prevención y Bioseguridad:** Detección oportuna de desviaciones en calidad de agua y asistencia zootécnica.
* **Operatividad en Campo:** Arquitectura Offline-First (PWA) para registro en la orilla del estanque sin conectividad.

---

## 🛠️ Stack Tecnológico

* **Backend:** Java 21 LTS, Spring Boot 3.3.4, Spring Data JPA, Hibernate, Spring Security + JWT, Flyway, OpenAPI/Swagger.
* **Base de Datos:** PostgreSQL 16 con extensión `pgvector`.
* **Frontend:** React 18+, TypeScript, Vite, TailwindCSS (PWA con persistencia local IndexedDB).
* **Infraestructura:** Docker y Docker Compose.

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

# Iniciar PostgreSQL 16 con pgvector
docker compose up -d postgres
```

### 3. Compilar Backend
```bash
cd backend
mvn clean compile
```

---

## 📄 Licencia
Proyecto privado. Todos los derechos reservados.
