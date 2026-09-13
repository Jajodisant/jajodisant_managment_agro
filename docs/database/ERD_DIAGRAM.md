# Entity-Relationship Diagram (ERD) - Agro Management System

This document outlines the visual schema and relationships for the core operational, biological, and financial tables of the aquaculture MVP.

---

## 1. Visual Entity-Relationship Diagram (Mermaid)

```mermaid
erDiagram
    farm ||--o{ pond : "owns / tiene"
    farm ||--o{ batch : "manages / gestiona"
    farm ||--o{ cost_record : "incurs / incurre (granjas/lotes)"
    farm ||--o{ log_event : "logs / bitacora"
    pond ||--o{ batch : "houses / aloja"
    pond ||--o{ log_event : "observes / observa"
    species ||--o{ feeding_table : "defines / define"
    species ||--o{ batch : "classifies / clasifica"
    batch ||--o{ biometry_record : "measures / mide"
    batch ||--o{ feeding_record : "consumes / consume"
    batch ||--o{ cost_record : "allocates / asigna"
    batch ||--o{ log_event : "references / referencia"

    farm {
        uuid id PK
        varchar name
        uuid owner_id
        text location
        timestamptz created_at
    }

    pond {
        uuid id PK
        uuid farm_id FK
        varchar code_name
        varchar pond_type
        numeric length_m
        numeric width_m
        numeric avg_depth_m
        numeric volume_m3
        boolean has_aeration
        numeric max_density_kg_m3
        boolean is_active
        timestamptz created_at
    }

    species {
        uuid id PK
        varchar common_name
        varchar scientific_name
        numeric expected_fcr
        numeric optimal_temp_min
        numeric optimal_temp_max
        numeric min_oxygen_mg_l
    }

    feeding_table {
        uuid id PK
        uuid species_id FK
        numeric min_weight_g
        numeric max_weight_g
        numeric biomass_percentage
        int daily_frequency
        numeric suggested_protein_pct
    }

    batch {
        uuid id PK
        uuid farm_id FK
        uuid pond_id FK
        uuid species_id FK
        varchar batch_code UK
        date stocking_date
        int initial_quantity
        numeric initial_avg_weight_g
        varchar status
        date estimated_harvest_date
        date actual_harvest_date
        timestamptz created_at
    }

    biometry_record {
        uuid id PK
        uuid batch_id FK
        date sampling_date
        int sampled_count
        numeric total_sample_weight_g
        numeric calculated_avg_weight_g
        int observed_mortality
        numeric estimated_biomass_kg
        text observations
        timestamptz created_at
    }

    feeding_record {
        uuid id PK
        uuid batch_id FK
        date feeding_date
        int ration_number
        time feeding_time
        varchar feed_brand_type
        numeric supplied_quantity_kg
        numeric cost_per_kg
        numeric water_temperature_c
        numeric dissolved_oxygen_mg_l
        timestamptz created_at
    }

    cost_record {
        uuid id PK
        uuid farm_id FK
        uuid batch_id FK
        date expense_date
        varchar category
        text description
        numeric total_amount
        timestamptz created_at
    }

    log_event {
        uuid id PK
        uuid farm_id FK
        uuid batch_id FK
        uuid pond_id FK
        timestamptz event_timestamp
        varchar event_type
        text raw_description
        text ai_diagnosis
        text suggested_protocol
        timestamptz created_at
    }
```

---

## 2. Table Summary & Cardinalities

| Entity (English) | Spanish Meaning | Primary Key | Foreign Keys | Relationship |
| :--- | :--- | :--- | :--- | :--- |
| **`farm`** | Granja | `id (UUID)` | None | 1 to N with `pond`, `batch`, `cost_record`, `log_event` |
| **`pond`** | Estanque | `id (UUID)` | `farm_id` | 1 to N with `batch` and `log_event` |
| **`species`** | Especie | `id (UUID)` | None | 1 to N with `feeding_table` and `batch` |
| **`feeding_table`** | Tabla de Alimentación | `id (UUID)` | `species_id` | N to 1 with `species` |
| **`batch`** | Lote Biológico | `id (UUID)` | `farm_id`, `pond_id`, `species_id` | 1 to N with biometry, feeding, costs, logs |
| **`biometry_record`**| Registro de Biometría | `id (UUID)` | `batch_id` | N to 1 with `batch` |
| **`feeding_record`** | Registro de Alimentación | `id (UUID)` | `batch_id` | N to 1 with `batch` |
| **`cost_record`** | Registro de Costos | `id (UUID)` | `farm_id`, `batch_id (nullable)` | N to 1 with `farm` and `batch` |
| **`log_event`** | Bitácora de Eventos | `id (UUID)` | `farm_id`, `batch_id (nullable)`, `pond_id (nullable)` | N to 1 with `farm`, `batch`, `pond` |
