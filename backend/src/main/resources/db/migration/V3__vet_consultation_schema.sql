-- =============================================================================
-- Migration: V3__vet_consultation_schema.sql
-- Description: Veterinary diagnostic and clinical assistance schema (HU-12)
-- =============================================================================

CREATE TABLE vet_consultation (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES farm(id) ON DELETE CASCADE,
    batch_id UUID REFERENCES batch(id) ON DELETE SET NULL,
    production_type VARCHAR(30) NOT NULL, -- PISCICULTURA, PORCICULTURA
    symptoms_description TEXT NOT NULL,
    presumptive_diagnosis VARCHAR(250) NOT NULL,
    urgency_level VARCHAR(30) NOT NULL DEFAULT 'MODERATE', -- CRITICAL, HIGH, MODERATE, LOW
    confidence_percentage NUMERIC(5, 2) NOT NULL DEFAULT 85.00,
    biosecurity_protocol TEXT NOT NULL,
    treatment_recommendation TEXT NOT NULL,
    sampling_instructions TEXT,
    differential_diagnoses TEXT, -- Resumen estructurado de diferenciales
    veterinarian_reviewed BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_vet_consultation_farm_id ON vet_consultation(farm_id);
CREATE INDEX idx_vet_consultation_batch_id ON vet_consultation(batch_id);
CREATE INDEX idx_vet_consultation_created_at ON vet_consultation(created_at DESC);
