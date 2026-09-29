package com.agro.modules.advisory.controller;

import java.math.BigDecimal;
import java.time.Instant;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.advisory.dto.DifferentialDiagnosisDto;
import com.agro.modules.advisory.dto.VetConsultationResponse;
import com.agro.modules.advisory.service.VetDiagnosisService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(VetConsultationController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class VetConsultationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private VetDiagnosisService vetDiagnosisService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /advisory/vet/consultations - 201 Created con dictamen clínico")
    void createConsultation_Returns201() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);

        VetConsultationResponse mockResponse = new VetConsultationResponse(
            UUID.randomUUID(),
            farmId,
            batchId,
            "LT-TIL-2026-01",
            "PISCICULTURA",
            "Peces nadando en espiral con ojos saltones y letargia severa",
            "Estreptococosis de los Peces",
            "CRITICAL",
            new BigDecimal("88.50"),
            "Cuarentena estricta del estanque",
            "Florfenicol oral",
            "Muestras de encéfalo y bazo a laboratorio ICA",
            List.of(new DifferentialDiagnosisDto("Estreptococosis", "Streptococcus agalactiae", 88.5, "Exoftalmia")),
            false,
            Instant.now()
        );

        when(vetDiagnosisService.createConsultation(any(), any())).thenReturn(mockResponse);

        String jsonPayload = """
            {
                "farmId": "%s",
                "batchId": "%s",
                "productionType": "PISCICULTURA",
                "symptomsDescription": "Peces nadando en espiral con ojos saltones y letargia severa"
            }
            """.formatted(farmId, batchId);

        mockMvc.perform(post("/advisory/vet/consultations")
                .contentType(MediaType.APPLICATION_JSON)
                .content(jsonPayload))
            .andExpect(status().isCreated())
            .andExpect(jsonPath("$.presumptiveDiagnosis").value("Estreptococosis de los Peces"))
            .andExpect(jsonPath("$.urgencyLevel").value("CRITICAL"))
            .andExpect(jsonPath("$.batchCode").value("LT-TIL-2026-01"))
            .andExpect(jsonPath("$.differentials[0].pathogen").value("Streptococcus agalactiae"));
    }

    @Test
    @DisplayName("GET /advisory/vet/consultations/farm/{farmId} - 200 OK con lista de consultas")
    void getConsultationsByFarm_Returns200() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);

        VetConsultationResponse item = new VetConsultationResponse(
            UUID.randomUUID(),
            farmId,
            null,
            null,
            "PORCICULTURA",
            "Cerdos con jadeo continuo en ceba",
            "Estrés Térmico y Golpe de Calor Porcino",
            "CRITICAL",
            new BigDecimal("91.00"),
            "Activar aspersores de techo",
            "Agua fresca y electrolitos",
            "Registro ITH",
            List.of(),
            false,
            Instant.now()
        );

        when(vetDiagnosisService.getConsultationsByFarm(farmId, ownerId)).thenReturn(List.of(item));

        mockMvc.perform(get("/advisory/vet/consultations/farm/{farmId}", farmId))
            .andExpect(status().isOk())
            .andExpect(jsonPath("$[0].presumptiveDiagnosis").value("Estrés Térmico y Golpe de Calor Porcino"))
            .andExpect(jsonPath("$[0].urgencyLevel").value("CRITICAL"));
    }
}
