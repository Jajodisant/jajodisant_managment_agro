package com.agro.modules.species.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.UUID;

/**
 * Entidad de Dominio: FeedingTable (Curvas y Tablas de Alimentación Técnica)
 * 
 * Modela la recomendación nutricional por rango de peso corporal:
 * porcentaje de biomasa diario en alimento, frecuencia de raciones y proteína requerida.
 */
@Entity
@Table(name = "feeding_table")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedingTable {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id", nullable = false)
    private Species species;

    @Column(name = "min_weight_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal minWeightG;

    @Column(name = "max_weight_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal maxWeightG;

    /**
     * Porcentaje de biomasa viva que debe suministrarse como ración diaria total (ej. 3.5%).
     */
    @Column(name = "biomass_percentage", nullable = false, precision = 4, scale = 2)
    private BigDecimal biomassPercentage;

    /**
     * Frecuencia diaria de alimentación (cuántas raciones al día: 2, 3, 4...).
     */
    @Column(name = "daily_frequency", nullable = false)
    private Integer dailyFrequency;

    /**
     * Porcentaje de proteína bruta sugerido en el concentrado comercial (ej. 32.0%).
     */
    @Column(name = "suggested_protein_pct", precision = 4, scale = 1)
    private BigDecimal suggestedProteinPct;
}
