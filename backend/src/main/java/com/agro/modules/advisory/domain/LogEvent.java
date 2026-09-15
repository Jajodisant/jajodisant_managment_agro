package com.agro.modules.advisory.domain;

import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.domain.Pond;
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

import java.time.OffsetDateTime;
import java.util.UUID;

/**
 * Entidad de Dominio: LogEvent (Bitácora de Campo y Registro de Incidencias)
 * 
 * Almacena observaciones cualitativas, anomalías biológicas o ambientales,
 * y sirve como contexto histórico para el motor de Asesoría con IA (RAG).
 */
@Entity
@Table(name = "log_event")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class LogEvent {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    private UUID id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "farm_id", nullable = false)
    private Farm farm;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "batch_id")
    private Batch batch;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "pond_id")
    private Pond pond;

    @Builder.Default
    @Column(name = "event_timestamp", nullable = false)
    private OffsetDateTime eventTimestamp = OffsetDateTime.now();

    /**
     * Tipo de evento: water_quality (calidad de agua), disease (sanidad/enfermedad), climate (clima), behavior (comportamiento).
     */
    @Column(name = "event_type", nullable = false, length = 50)
    private String eventType;

    /**
     * Descripción en lenguaje natural ingresada por el operario o técnico.
     */
    @Column(name = "raw_description", nullable = false, columnDefinition = "TEXT")
    private String rawDescription;

    /**
     * Diagnóstico preliminar sugerido por el modelo de IA basado en el contexto histórico.
     */
    @Column(name = "ai_diagnosis", columnDefinition = "TEXT")
    private String aiDiagnosis;

    /**
     * Protocolo zootécnico o sanitario de mitigación sugerido por el Asistente IA.
     */
    @Column(name = "suggested_protocol", columnDefinition = "TEXT")
    private String suggestedProtocol;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
