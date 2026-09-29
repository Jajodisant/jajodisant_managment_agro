package com.agro.modules.advisory.service;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.Spy;
import org.mockito.junit.jupiter.MockitoExtension;

import com.agro.modules.advisory.domain.VetConsultation;
import com.agro.modules.advisory.dto.VetConsultationRequest;
import com.agro.modules.advisory.dto.VetConsultationResponse;
import com.agro.modules.advisory.repository.VetConsultationRepository;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.repository.BatchRepository;
import com.fasterxml.jackson.databind.ObjectMapper;

@ExtendWith(MockitoExtension.class)
class VetDiagnosisServiceTest {

    @Mock
    private VetConsultationRepository vetConsultationRepository;

    @Mock
    private FarmService farmService;

    @Mock
    private BatchRepository batchRepository;

    @Spy
    private ObjectMapper objectMapper = new ObjectMapper();

    @InjectMocks
    private VetDiagnosisService vetDiagnosisService;

    private UUID ownerId;
    private UUID farmId;
    private UUID batchId;
    private Farm sampleFarm;
    private Batch sampleBatch;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        batchId = UUID.randomUUID();

        sampleFarm = Farm.builder()
            .id(farmId)
            .name("Granja Experimental Agro")
            .ownerId(ownerId)
            .location("Meta, Colombia")
            .build();

        sampleBatch = Batch.builder()
            .id(batchId)
            .farm(sampleFarm)
            .batchCode("LT-TIL-2026-01")
            .build();
    }

    @Test
    @DisplayName("HU-12: Diagnóstico certero de Estreptococosis en Tilapias por signos neurológicos y oculares")
    void createConsultation_FishStreptococcus_Success() {
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(batchRepository.findById(batchId)).thenReturn(Optional.of(sampleBatch));
        when(vetConsultationRepository.save(any(VetConsultation.class))).thenAnswer(invocation -> {
            VetConsultation entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        VetConsultationRequest request = new VetConsultationRequest(
            farmId,
            batchId,
            "PISCICULTURA",
            "Tilapias nadando en circulo o espiral con ojos saltones y exoftalmia severa, presentan opacidad corneal y hemorragia en base de aleta."
        );

        VetConsultationResponse response = vetDiagnosisService.createConsultation(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.presumptiveDiagnosis()).isEqualTo("Estreptococosis de los Peces");
        assertThat(response.urgencyLevel()).isEqualTo("CRITICAL");
        assertThat(response.confidencePercentage()).isGreaterThan(new BigDecimal("75.00"));
        assertThat(response.biosecurityProtocol()).contains("Cuarentena");
        assertThat(response.treatmentRecommendation()).contains("Florfenicol");
        assertThat(response.treatmentRecommendation()).contains("21 días");
        assertThat(response.samplingInstructions()).contains("ICA");
        assertThat(response.differentials()).isNotEmpty();

        verify(vetConsultationRepository).save(any(VetConsultation.class));
    }

    @Test
    @DisplayName("HU-12: Diagnóstico certero de Erisipela Porcina por lesiones romboidales en diamante y fiebre")
    void createConsultation_SwineErysipelas_Success() {
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(batchRepository.findById(batchId)).thenReturn(Optional.of(sampleBatch));
        when(vetConsultationRepository.save(any(VetConsultation.class))).thenAnswer(invocation -> {
            VetConsultation entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        VetConsultationRequest request = new VetConsultationRequest(
            farmId,
            batchId,
            "PORCICULTURA",
            "Cerdos con fiebre alta, postrados y con lesiones en la piel en forma de diamante y rombo rojizo con artritis y cojera."
        );

        VetConsultationResponse response = vetDiagnosisService.createConsultation(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.presumptiveDiagnosis()).isEqualTo("Erisipela Porcina / Mal Rojo");
        assertThat(response.urgencyLevel()).isEqualTo("HIGH");
        assertThat(response.treatmentRecommendation()).contains("Penicilina");
        assertThat(response.biosecurityProtocol()).contains("enfermería");

        verify(vetConsultationRepository).save(any(VetConsultation.class));
    }

    @Test
    @DisplayName("HU-12: Diagnóstico de Hipoxia Aguda en Peces por boqueo matutino")
    void createConsultation_FishHypoxia_Success() {
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(vetConsultationRepository.save(any(VetConsultation.class))).thenAnswer(invocation -> {
            VetConsultation entity = invocation.getArgument(0);
            entity.setId(UUID.randomUUID());
            return entity;
        });

        VetConsultationRequest request = new VetConsultationRequest(
            farmId,
            null,
            "PISCICULTURA",
            "Peces boqueando en la superficie del estanque en horas de la madrugada, falta de oxigeno severa y boca abierta."
        );

        VetConsultationResponse response = vetDiagnosisService.createConsultation(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.presumptiveDiagnosis()).isEqualTo("Hipoxia Severa / Anoxia por Colapso de Oxígeno Disuelto");
        assertThat(response.urgencyLevel()).isEqualTo("CRITICAL");
        assertThat(response.biosecurityProtocol()).contains("AIREACIÓN MECÁNICA");
    }

    @Test
    @DisplayName("HU-12: Consulta de historial veterinario por granja")
    void getConsultationsByFarm_Success() {
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        VetConsultation entity = VetConsultation.builder()
            .id(UUID.randomUUID())
            .farmId(farmId)
            .productionType("PISCICULTURA")
            .symptomsDescription("Puntos blancos en aletas")
            .presumptiveDiagnosis("Ictioftiriasis / Enfermedad del Punto Blanco")
            .urgencyLevel("MODERATE")
            .confidencePercentage(new BigDecimal("82.00"))
            .biosecurityProtocol("Sal marina")
            .treatmentRecommendation("Baño de sal")
            .differentialDiagnoses("[]")
            .createdAt(Instant.now())
            .build();

        when(vetConsultationRepository.findByFarmIdOrderByCreatedAtDesc(farmId))
            .thenReturn(List.of(entity));

        List<VetConsultationResponse> results = vetDiagnosisService.getConsultationsByFarm(farmId, ownerId);

        assertThat(results).hasSize(1);
        assertThat(results.get(0).presumptiveDiagnosis()).isEqualTo("Ictioftiriasis / Enfermedad del Punto Blanco");
    }
}
