package com.agro.modules.feeding.domain;

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
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entidad de Dominio: FeedingRecord (Registro de Alimentación Diaria)
 * 
 * Almacena cada ración de concentrado suministrada en campo, su costo unitario
 * y las condiciones físico-químicas del agua al momento del suministro.
 */
@Entity
@Table(name = "feeding_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FeedingRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id", nullable = false)
    private Batch batch;

    @Builder.Default
    @Column(name = "feeding_date", nullable = false)
    private LocalDate feedingDate = LocalDate.now();

    /**
     * Número de turno de la ración en el día (1: primera de la mañana, 2: mediodía, etc.).
     */
    @Builder.Default
    @Column(name = "ration_number", nullable = false)
    private Integer rationNumber = 1;

    @Column(name = "feeding_time", nullable = false)
    private LocalTime feedingTime;

    /**
     * Marca o tipo de concentrado (ej: "Italcol 32% Extruido 4mm").
     */
    @Column(name = "feed_brand_type", nullable = false, length = 100)
    private String feedBrandType;

    /**
     * Kilogramos de concentrado arrojados al agua en esta ración.
     */
    @Column(name = "supplied_quantity_kg", nullable = false, precision = 8, scale = 2)
    private BigDecimal suppliedQuantityKg;

    /**
     * Costo unitario por kilogramo de alimento al momento del suministro ($/kg).
     * Permite calcular en tiempo real el costo directo acumulado de alimentación.
     */
    @Column(name = "cost_per_kg", nullable = false, precision = 10, scale = 2)
    private BigDecimal costPerKg;

    /**
     * Temperatura del agua (°C). Influye directamente en la tasa metabólica del pez.
     */
    @Column(name = "water_temperature_c", precision = 4, scale = 1)
    private BigDecimal waterTemperatureC;

    /**
     * Oxígeno disuelto (mg/L). Si cae por debajo del límite crítico (ej. < 3 mg/L), se debe suspender la comida.
     */
    @Column(name = "dissolved_oxygen_mg_l", precision = 4, scale = 1)
    private BigDecimal dissolvedOxygenMgL;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
