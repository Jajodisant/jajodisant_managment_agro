package com.agro.modules.finance.domain;

import com.agro.modules.farm.domain.Farm;
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
 * Entidad de Dominio: CostRecord (Control de Costos Directos e Indirectos)
 * 
 * Permite registrar egresos atribuibles a un lote específico (ej. compra de alevines)
 * o costos operativos globales de la granja (ej. recibo de energía, jornales generales).
 */
@Entity
@Table(name = "cost_record")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CostRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    /**
     * Lote específico al que se imputa el gasto.
     * Opcional: Si es nulo, representa un gasto indirecto o estructural de la granja.
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @Builder.Default
    @Column(name = "expense_date", nullable = false)
    private LocalDate expenseDate = LocalDate.now();

    /**
     * Categoría del egreso: fingerlings, feed, labor, energy, chemicals, maintenance.
     */
    @Column(name = "category", nullable = false, length = 50)
    private String category;

    @Column(name = "description", nullable = false, columnDefinition = "TEXT")
    private String description;

    /**
     * Monto monetario total del gasto.
     */
    @Column(name = "total_amount", nullable = false, precision = 12, scale = 2)
    private BigDecimal totalAmount;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
