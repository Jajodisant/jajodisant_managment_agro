package com.agro.modules.swine.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

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

/**
 * Entidad de Dominio: SwinePen (Corral Porcícola por Etapa Productiva HU-10)
 */
@Entity
@Table(name = "swine_pen")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwinePen {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "barn_id", nullable = false)
    private SwineBarn barn;

    @Column(name = "pen_code", nullable = false, length = 50)
    private String penCode;

    @Builder.Default
    @Column(name = "phase", nullable = false, length = 30)
    private String phase = "ceba"; // precebo, levante, ceba, maternidad, gestacion

    @Column(name = "length_m", nullable = false, precision = 8, scale = 2)
    private BigDecimal lengthM;

    @Column(name = "width_m", nullable = false, precision = 8, scale = 2)
    private BigDecimal widthM;

    @Column(name = "area_m2", precision = 8, scale = 2, insertable = false, updatable = false)
    private BigDecimal areaM2;

    @Builder.Default
    @Column(name = "drinker_type", nullable = false, length = 50)
    private String drinkerType = "nipple"; // nipple, bowl, trough

    @Builder.Default
    @Column(name = "drinker_count", nullable = false)
    private Integer drinkerCount = 2;

    @Builder.Default
    @Column(name = "feeder_spaces", nullable = false)
    private Integer feederSpaces = 4;

    @Builder.Default
    @Column(name = "max_density_m2_per_pig", nullable = false, precision = 4, scale = 2)
    private BigDecimal maxDensityM2PerPig = new BigDecimal("1.00");

    @Builder.Default
    @Column(name = "max_capacity_pigs", nullable = false)
    private Integer maxCapacityPigs = 20;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
