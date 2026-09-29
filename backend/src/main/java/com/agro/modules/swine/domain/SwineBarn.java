package com.agro.modules.swine.domain;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.hibernate.annotations.CreationTimestamp;

import com.agro.modules.farm.domain.Farm;

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
 * Entidad de Dominio: SwineBarn (Galpón Porcícola / Nave de Producción)
 */
@Entity
@Table(name = "swine_barn")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SwineBarn {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @Column(name = "code_name", nullable = false, length = 50)
    private String codeName;

    @Builder.Default
    @Column(name = "barn_type", nullable = false, length = 50)
    private String barnType = "open_curtain";

    @Column(name = "length_m", precision = 8, scale = 2)
    private BigDecimal lengthM;

    @Column(name = "width_m", precision = 8, scale = 2)
    private BigDecimal widthM;

    @Column(name = "total_area_m2", precision = 10, scale = 2, insertable = false, updatable = false)
    private BigDecimal totalAreaM2;

    @Builder.Default
    @Column(name = "has_automatic_ventilation", nullable = false)
    private Boolean hasAutomaticVentilation = false;

    @Builder.Default
    @Column(name = "has_cooling_system", nullable = false)
    private Boolean hasCoolingSystem = false;

    @Builder.Default
    @Column(name = "is_active", nullable = false)
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
