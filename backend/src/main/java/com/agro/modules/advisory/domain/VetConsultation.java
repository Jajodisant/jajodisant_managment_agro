package com.agro.modules.advisory.domain;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.UUID;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Entidad de persistencia para Consultas y Diagnósticos Clínicos Veterinarios Asistidos (HU-12).
 */
@Entity
@Table(name = "vet_consultation")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class VetConsultation {

    @Id
    @GeneratedValue(strategy = GenerationType.AUTO)
    private UUID id;

    @Column(name = "farm_id", nullable = false)
    private UUID farmId;

    @Column(name = "batch_id")
    private UUID batchId;

    @Column(name = "production_type", nullable = false, length = 30)
    private String productionType;

    @Column(name = "symptoms_description", nullable = false, columnDefinition = "TEXT")
    private String symptomsDescription;

    @Column(name = "presumptive_diagnosis", nullable = false, length = 250)
    private String presumptiveDiagnosis;

    @Column(name = "urgency_level", nullable = false, length = 30)
    private String urgencyLevel;

    @Column(name = "confidence_percentage", nullable = false, precision = 5, scale = 2)
    private BigDecimal confidencePercentage;

    @Column(name = "biosecurity_protocol", nullable = false, columnDefinition = "TEXT")
    private String biosecurityProtocol;

    @Column(name = "treatment_recommendation", nullable = false, columnDefinition = "TEXT")
    private String treatmentRecommendation;

    @Column(name = "sampling_instructions", columnDefinition = "TEXT")
    private String samplingInstructions;

    @Column(name = "differential_diagnoses", columnDefinition = "TEXT")
    private String differentialDiagnoses;

    @Column(name = "veterinarian_reviewed", nullable = false)
    @Builder.Default
    private Boolean veterinarianReviewed = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    @Builder.Default
    private Instant createdAt = Instant.now();
}
