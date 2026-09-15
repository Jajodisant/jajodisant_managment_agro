package com.agro.modules.biometry.domain;

import com.agro.modules.lot.domain.Batch;
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
 * Entidad de Dominio: BiometryRecord (Muestreos Biométricos Periódicos)
 * 
 * Registra los datos de muestreo en campo (peso de muestra, número de peces y mortalidad observada)
 * para calcular la ganancia diaria de peso (GPD) y proyectar la biomasa viva total.
 */
@Entity
@Table(name = "biometry_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class BiometryRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Builder.Default
    @Column(name = "sampling_date", nullable = false)
    private LocalDate samplingDate = LocalDate.now();

    /**
     * Cantidad de ejemplares capturados en la red de muestreo.
     */
    @Column(name = "sampled_count", nullable = false)
    private Integer sampledCount;

    /**
     * Peso total de los ejemplares muestreados (en gramos).
     */
    @Column(name = "total_sample_weight_g", nullable = false, precision = 10, scale = 2)
    private BigDecimal totalSampleWeightG;

    /**
     * Peso promedio calculado automáticamente por PostgreSQL (STORED GENERATED).
     * total_sample_weight_g / sampled_count
     */
    @Column(name = "calculated_avg_weight_g", precision = 8, scale = 2, insertable = false, updatable = false)
    private BigDecimal calculatedAvgWeightG;

    /**
     * Peces muertos extraídos o contabilizados en el estanque durante el periodo.
     */
    @Builder.Default
    @Column(name = "observed_mortality", nullable = false)
    private Integer observedMortality = 0;

    /**
     * Biomasa total estimada en kilogramos: (población remanente * peso promedio) / 1000.
     */
    @Column(name = "estimated_biomass_kg", precision = 10, scale = 2)
    private BigDecimal estimatedBiomassKg;

    @Column(name = "observations", columnDefinition = "TEXT")
    private String observations;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
