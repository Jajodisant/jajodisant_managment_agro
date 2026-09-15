package com.agro.modules.species.domain;

import jakarta.persistence.CascadeType;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.OneToMany;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;

/**
 * Entidad de Dominio: Species (Catálogo de Especies Acuícolas)
 * 
 * Define las características zootécnicas y parámetros de confort de cada especie
 * (ej. Tilapia Roja, Trucha Arcoíris, Cachama).
 */
@Entity
@Table(name = "species")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Species {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @Column(name = "common_name", nullable = false, length = 100)
    private String commonName;

    @Column(name = "scientific_name", length = 100)
    private String scientificName;

    /**
     * Factor de Conversión Alimenticia esperado bajo condiciones estándar de cultivo (ej. 1.30).
     */
    @Builder.Default
    @Column(name = "expected_fcr", precision = 4, scale = 2)
    private BigDecimal expectedFcr = new BigDecimal("1.30");

    @Builder.Default
    @Column(name = "optimal_temp_min", precision = 4, scale = 1)
    private BigDecimal optimalTempMin = new BigDecimal("26.0");

    @Builder.Default
    @Column(name = "optimal_temp_max", precision = 4, scale = 1)
    private BigDecimal optimalTempMax = new BigDecimal("30.0");

    @Builder.Default
    @Column(name = "min_oxygen_mg_l", precision = 4, scale = 1)
    private BigDecimal minOxygenMgL = new BigDecimal("4.0");

    /**
     * Tablas nutricionales y curvas de alimentación asociadas a esta especie.
     */
    @OneToMany(mappedBy = "species", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<FeedingTable> feedingTables = new ArrayList<>();
}
