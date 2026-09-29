-- =============================================================================
-- Migration: V2__porcine_infrastructure_schema.sql
-- Description: Swine infrastructure schema (Galpones, Corrales y Aforo Porcino HU-10)
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Table: swine_barn (Galpón Porcícola / Nave de Confinamiento)
-- -----------------------------------------------------------------------------
CREATE TABLE swine_barn (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    code_name VARCHAR(50) NOT NULL, -- Ej: 'Galpón G-01', 'Nave Ceba 2'
    barn_type VARCHAR(50) NOT NULL DEFAULT 'open_curtain', -- open_curtain (cortinas), tunnel_ventilation, traditional
    length_m NUMERIC(8, 2),
    width_m NUMERIC(8, 2),
    total_area_m2 NUMERIC(10, 2) GENERATED ALWAYS AS (
        length_m * width_m
    ) STORED, -- Cálculo inmutable del área total de la nave
    has_automatic_ventilation BOOLEAN NOT NULL DEFAULT false,
    has_cooling_system BOOLEAN NOT NULL DEFAULT false,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 2. Table: swine_pen (Corral Porcícola / División de Manejo por Etapa)
-- -----------------------------------------------------------------------------
CREATE TABLE swine_pen (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    barn_id UUID NOT NULL REFERENCES swine_barn(id) ON DELETE CASCADE,
    pen_code VARCHAR(50) NOT NULL, -- Ej: 'Corral P-01'
    phase VARCHAR(30) NOT NULL DEFAULT 'ceba', -- precebo (0.35 m2/cerdo), levante (0.65 m2/cerdo), ceba (1.0 m2/cerdo), maternidad, gestacion
    length_m NUMERIC(8, 2) NOT NULL,
    width_m NUMERIC(8, 2) NOT NULL,
    area_m2 NUMERIC(8, 2) GENERATED ALWAYS AS (
        length_m * width_m
    ) STORED, -- Área superficial del corral
    drinker_type VARCHAR(50) NOT NULL DEFAULT 'nipple', -- nipple (chupete), bowl (cazoleta), trough (canoa)
    drinker_count INT NOT NULL DEFAULT 2 CHECK (drinker_count > 0),
    feeder_spaces INT NOT NULL DEFAULT 4 CHECK (feeder_spaces > 0),
    max_density_m2_per_pig NUMERIC(4, 2) NOT NULL DEFAULT 1.00, -- Densidad zootécnica requerida por cerdo
    max_capacity_pigs INT NOT NULL DEFAULT 20 CHECK (max_capacity_pigs > 0),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- -----------------------------------------------------------------------------
-- 3. Vincular Lote (Batch) al Corral Porcícola (pen_id opcional)
-- -----------------------------------------------------------------------------
ALTER TABLE batch ADD COLUMN pen_id UUID REFERENCES swine_pen(id) ON DELETE SET NULL;

-- -----------------------------------------------------------------------------
-- 4. Índices para consultas de alto rendimiento
-- -----------------------------------------------------------------------------
CREATE INDEX idx_swine_barn_farm_id ON swine_barn(farm_id);
CREATE INDEX idx_swine_pen_barn_id ON swine_pen(barn_id);
CREATE INDEX idx_batch_pen_id ON batch(pen_id);

-- -----------------------------------------------------------------------------
-- 5. Semillero de Razas / Especies Porcinas en el Catálogo
-- -----------------------------------------------------------------------------
INSERT INTO species (id, common_name, scientific_name, expected_fcr, optimal_temp_min, optimal_temp_max, min_oxygen_mg_l)
VALUES 
    (uuid_generate_v4(), 'Cerdo Comercial (Pietrain x Landrace)', 'Sus scrofa domesticus', 2.45, 18.0, 24.0, NULL),
    (uuid_generate_v4(), 'Cerdo Criollo Zungo Costeño', 'Sus scrofa domesticus', 2.80, 22.0, 32.0, NULL);
