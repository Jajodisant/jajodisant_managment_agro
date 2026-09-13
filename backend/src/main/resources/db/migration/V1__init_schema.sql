-- =============================================================================
-- Migration: V1__init_schema.sql
-- Description: Core schema for aquaculture management system (PostgreSQL 16)
-- =============================================================================

-- Extensiones necesarias para identificadores únicos
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- -----------------------------------------------------------------------------
-- 1. Table: farm (Granja / Unidad productiva raíz)
-- -----------------------------------------------------------------------------
CREATE TABLE farm (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(150) NOT NULL,
    owner_id UUID NOT NULL, -- Identificador del usuario propietario (Auth JWT)
    location TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Table: pond (Estanque / Infraestructura física de cultivo)
-- -----------------------------------------------------------------------------
CREATE TABLE pond (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    code_name VARCHAR(50) NOT NULL, -- Ej: 'Pond T-01', 'Tank Geo-2'
    pond_type VARCHAR(50) NOT NULL DEFAULT 'earthen', -- earthen (tierra), geomembrane, concrete, cage
    length_m NUMERIC(8, 2),
    width_m NUMERIC(8, 2),
    avg_depth_m NUMERIC(6, 2) NOT NULL,
    volume_m3 NUMERIC(10, 2) GENERATED ALWAYS AS (
        length_m * width_m * avg_depth_m
    ) STORED, -- Cálculo inmutable del volumen de agua en PostgreSQL
    has_aeration BOOLEAN NOT NULL DEFAULT false,
    max_density_kg_m3 NUMERIC(6, 2) NOT NULL DEFAULT 3.0, -- Límite de aforo zootécnico
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Table: species (Catálogo de especies y parámetros óptimos)
-- -----------------------------------------------------------------------------
CREATE TABLE species (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    common_name VARCHAR(100) NOT NULL, -- Ej: 'Red Tilapia', 'Rainbow Trout'
    scientific_name VARCHAR(100),       -- Ej: 'Oreochromis sp.'
    expected_fcr NUMERIC(4, 2) DEFAULT 1.30, -- Factor de conversión alimenticia esperado
    optimal_temp_min NUMERIC(4, 1) DEFAULT 26.0,
    optimal_temp_max NUMERIC(4, 1) DEFAULT 30.0,
    min_oxygen_mg_l NUMERIC(4, 1) DEFAULT 4.0
);

-- -----------------------------------------------------------------------------
-- 4. Table: feeding_table (Curvas de alimentación sugeridas por especie)
-- -----------------------------------------------------------------------------
CREATE TABLE feeding_table (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    species_id UUID NOT NULL REFERENCES species(id) ON DELETE CASCADE,
    min_weight_g NUMERIC(8, 2) NOT NULL, -- Rango mínimo de peso (gramos)
    max_weight_g NUMERIC(8, 2) NOT NULL, -- Rango máximo de peso (gramos)
    biomass_percentage NUMERIC(4, 2) NOT NULL, -- % de peso vivo en comida al día
    daily_frequency INT NOT NULL, -- Número de raciones al día
    suggested_protein_pct NUMERIC(4, 1) -- Porcentaje de proteína en concentrado
);

-- -----------------------------------------------------------------------------
-- 5. Table: batch (Lote biológico / Ciclo productivo)
-- -----------------------------------------------------------------------------
CREATE TABLE batch (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    pond_id UUID REFERENCES pond(id) ON DELETE SET NULL, -- Nullable si se cosecha o traslada
    species_id UUID NOT NULL REFERENCES species(id),
    batch_code VARCHAR(50) NOT NULL UNIQUE, -- Código único del lote, ej: 'TIL-2026-001'
    stocking_date DATE NOT NULL, -- Fecha de siembra
    initial_quantity INT NOT NULL CHECK (initial_quantity > 0),
    initial_avg_weight_g NUMERIC(8, 2) NOT NULL CHECK (initial_avg_weight_g > 0),
    status VARCHAR(30) NOT NULL DEFAULT 'stocking', -- stocking, nursing, growout, harvested, cancelled
    estimated_harvest_date DATE,
    actual_harvest_date DATE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 6. Table: biometry_record (Muestreos de peso, mortalidad y biomasa)
-- -----------------------------------------------------------------------------
CREATE TABLE biometry_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batch(id) ON DELETE CASCADE,
    sampling_date DATE NOT NULL DEFAULT CURRENT_DATE,
    sampled_count INT NOT NULL CHECK (sampled_count > 0), -- Peces muestreados
    total_sample_weight_g NUMERIC(10, 2) NOT NULL CHECK (total_sample_weight_g > 0),
    calculated_avg_weight_g NUMERIC(8, 2) GENERATED ALWAYS AS (
        total_sample_weight_g / sampled_count
    ) STORED, -- Peso promedio calculado automáticamente
    observed_mortality INT NOT NULL DEFAULT 0, -- Bajas reportadas
    estimated_biomass_kg NUMERIC(10, 2), -- Biomasa total estimada en kg
    observations TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 7. Table: feeding_record (Registro diario de alimentación suministrada)
-- -----------------------------------------------------------------------------
CREATE TABLE feeding_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    batch_id UUID NOT NULL REFERENCES batch(id) ON DELETE CASCADE,
    feeding_date DATE NOT NULL DEFAULT CURRENT_DATE,
    ration_number INT NOT NULL DEFAULT 1, -- Turno de comida (1, 2, 3...)
    feeding_time TIME NOT NULL,
    feed_brand_type VARCHAR(100) NOT NULL, -- Marca y tipo de concentrado
    supplied_quantity_kg NUMERIC(8, 2) NOT NULL CHECK (supplied_quantity_kg >= 0),
    cost_per_kg NUMERIC(10, 2) NOT NULL CHECK (cost_per_kg >= 0), -- Costo del concentrado por kg
    water_temperature_c NUMERIC(4, 1),
    dissolved_oxygen_mg_l NUMERIC(4, 1),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 8. Table: cost_record (Registro de costos directos e indirectos)
-- -----------------------------------------------------------------------------
CREATE TABLE cost_record (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE, -- Granja asociada obligatoria
    batch_id UUID REFERENCES batch(id) ON DELETE SET NULL,       -- Opcional para costos generales de granja
    expense_date DATE NOT NULL DEFAULT CURRENT_DATE,
    category VARCHAR(50) NOT NULL, -- fingerlings, feed, labor, energy, chemicals, maintenance
    description TEXT NOT NULL,
    total_amount NUMERIC(12, 2) NOT NULL CHECK (total_amount >= 0),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 9. Table: log_event (Bitácora de incidencias y anomalías - Base para RAG)
-- -----------------------------------------------------------------------------
CREATE TABLE log_event (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE, -- Granja asociada obligatoria
    batch_id UUID REFERENCES batch(id) ON DELETE SET NULL,
    pond_id UUID REFERENCES pond(id) ON DELETE SET NULL,
    event_timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
    event_type VARCHAR(50) NOT NULL, -- water_quality, disease, climate, behavior
    raw_description TEXT NOT NULL, -- Descripción ingresada por el operario
    ai_diagnosis TEXT, -- Diagnóstico generado por el modelo de IA
    suggested_protocol TEXT, -- Plan de acción técnico recomendado
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================================================
-- ÍNDICES DE RENDIMIENTO (Performance Optimization)
-- =============================================================================
CREATE INDEX idx_pond_farm ON pond(farm_id);
CREATE INDEX idx_feeding_table_species ON feeding_table(species_id);
CREATE INDEX idx_batch_farm ON batch(farm_id);
CREATE INDEX idx_batch_pond ON batch(pond_id);
CREATE INDEX idx_biometry_batch ON biometry_record(batch_id);
CREATE INDEX idx_biometry_date ON biometry_record(batch_id, sampling_date);
CREATE INDEX idx_feeding_batch_date ON feeding_record(batch_id, feeding_date);
CREATE INDEX idx_cost_farm ON cost_record(farm_id);
CREATE INDEX idx_cost_batch ON cost_record(batch_id);
CREATE INDEX idx_log_farm ON log_event(farm_id);
CREATE INDEX idx_log_batch ON log_event(batch_id);
