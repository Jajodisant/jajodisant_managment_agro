package com.agro.modules.lot.domain;

import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.domain.Pond;
import com.agro.modules.species.domain.Species;
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
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entidad de Dominio: Batch (Lote Biológico / Ciclo Productivo)
 * 
 * Representa la cohorte de organismos sembrados en una fecha dada,
 * cuyo crecimiento, consumo y rentabilidad son seguidos hasta la cosecha.
 */
@Entity
@Table(name = "batch")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Batch {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    /**
     * Estanque donde se aloja el lote.
     * Puede ser nulo temporalmente si el lote se encuentra cosechado o en transición.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pond_id")
    private Pond pond;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "species_id", nullable = false)
    private Species species;

    /**
     * Código identificador único del lote (ej. 'TIL-2026-001').
     */
    @Column(name = "batch_code", nullable = false, unique = true, length = 50)
    private String batchCode;

    @Column(name = "stocking_date", nullable = false)
    private LocalDate stockingDate;

    /**
     * Número de alevines o individuos sembrados inicialmente.
     */
    @Column(name = "initial_quantity", nullable = false)
    private Integer initialQuantity;

    /**
     * Peso promedio unitario al momento de la siembra (gramos).
     */
    @Column(name = "initial_avg_weight_g", nullable = false, precision = 8, scale = 2)
    private BigDecimal initialAvgWeightG;

    /**
     * Estado del lote: stocking (siembra), nursing (cría/alevinaje), growout (engorde), harvested (cosechado), cancelled (cancelado).
     */
    @Builder.Default
    @Column(name = "status", nullable = false, length = 30)
    private String status = "stocking";

    @Column(name = "estimated_harvest_date")
    private LocalDate estimatedHarvestDate;

    @Column(name = "actual_harvest_date")
    private LocalDate actualHarvestDate;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
