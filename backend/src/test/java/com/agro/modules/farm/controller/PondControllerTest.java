package com.agro.modules.farm.controller;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doNothing;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.common.exception.DuplicateResourceException;
import com.agro.common.exception.ResourceNotFoundException;
import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.farm.dto.CreatePondRequest;
import com.agro.modules.farm.dto.PondResponse;
import com.agro.modules.farm.dto.UpdatePondRequest;
import com.agro.modules.farm.service.PondService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(PondController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class PondControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private PondService pondService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /farms/{farmId}/ponds - Registra estanque y retorna 201 Created con métricas de aforo (HU-01)")
    void createPond_Returns201() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID pondId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        CreatePondRequest request = new CreatePondRequest(
                "T-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                true,
                null
        );

        PondResponse response = new PondResponse(
                pondId,
                farmId,
                "Granja Santa Clara",
                "T-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                new BigDecimal("300.00"),
                true,
                new BigDecimal("10.00"),
                new BigDecimal("3000.00"),
                true,
                OffsetDateTime.now()
        );

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(pondService.createPond(eq(farmId), eq(ownerId), any(CreatePondRequest.class))).thenReturn(response);

        mockMvc.perform(post("/farms/{farmId}/ponds", farmId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(pondId.toString()))
                .andExpect(jsonPath("$.codeName").value("T-01"))
                .andExpect(jsonPath("$.volumeM3").value(300.00))
                .andExpect(jsonPath("$.maxBiomassCapacityKg").value(3000.00));
    }

    @Test
    @DisplayName("POST /farms/{farmId}/ponds - Debe responder 400 Bad Request si la profundidad es nula")
    void createPond_MissingDepth_Returns400() throws Exception {
        UUID farmId = UUID.randomUUID();
        CreatePondRequest invalidRequest = new CreatePondRequest(
                "T-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                null, // Profundidad obligatoria faltante
                false,
                null
        );

        mockMvc.perform(post("/farms/{farmId}/ponds", farmId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(invalidRequest)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.avgDepthM").exists());
    }

    @Test
    @DisplayName("POST /farms/{farmId}/ponds - Debe responder 409 Conflict si el código está duplicado")
    void createPond_DuplicateCode_Returns409() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        CreatePondRequest request = new CreatePondRequest(
                "T-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                false,
                null
        );

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(pondService.createPond(eq(farmId), eq(ownerId), any(CreatePondRequest.class)))
                .thenThrow(new DuplicateResourceException("Estanque", "código", "T-01"));

        mockMvc.perform(post("/farms/{farmId}/ponds", farmId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isConflict())
                .andExpect(jsonPath("$.status").value(409));
    }

    @Test
    @DisplayName("GET /farms/{farmId}/ponds - Debe responder 200 OK con lista de estanques")
    void getPonds_Returns200() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        PondResponse p = new PondResponse(
                UUID.randomUUID(), farmId, "Farm", "T-1", "earthen",
                new BigDecimal("10"), new BigDecimal("10"), new BigDecimal("1"),
                new BigDecimal("100"), false, new BigDecimal("3"), new BigDecimal("300"),
                true, OffsetDateTime.now()
        );

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(pondService.getPondsByFarm(farmId, ownerId, null)).thenReturn(List.of(p));

        mockMvc.perform(get("/farms/{farmId}/ponds", farmId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].codeName").value("T-1"));
    }

    @Test
    @DisplayName("GET /farms/{farmId}/ponds/{pondId}/capacity - Consulta directa de aforo (HU-01)")
    void getPondCapacity_Returns200() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID pondId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        PondResponse response = new PondResponse(
                pondId, farmId, "Farm", "T-1", "earthen",
                new BigDecimal("20"), new BigDecimal("10"), new BigDecimal("1.5"),
                new BigDecimal("300.00"), true, new BigDecimal("10.00"), new BigDecimal("3000.00"),
                true, OffsetDateTime.now()
        );

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(pondService.getPondById(farmId, pondId, ownerId)).thenReturn(response);

        mockMvc.perform(get("/farms/{farmId}/ponds/{pondId}/capacity", farmId, pondId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.volumeM3").value(300.00))
                .andExpect(jsonPath("$.maxBiomassCapacityKg").value(3000.00));
    }

    @Test
    @DisplayName("PUT /farms/{farmId}/ponds/{pondId} - Actualiza estanque y responde 200 OK")
    void updatePond_Returns200() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID pondId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        UpdatePondRequest request = new UpdatePondRequest(
                "T-01-MOD",
                "concrete",
                new BigDecimal("25.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.80"),
                true,
                new BigDecimal("12.00"),
                true
        );

        PondResponse response = new PondResponse(
                pondId, farmId, "Farm", "T-01-MOD", "concrete",
                new BigDecimal("25.00"), new BigDecimal("10.00"), new BigDecimal("1.80"),
                new BigDecimal("450.00"), true, new BigDecimal("12.00"), new BigDecimal("5400.00"),
                true, OffsetDateTime.now()
        );

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(pondService.updatePond(eq(farmId), eq(pondId), eq(ownerId), any(UpdatePondRequest.class)))
                .thenReturn(response);

        mockMvc.perform(put("/farms/{farmId}/ponds/{pondId}", farmId, pondId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.codeName").value("T-01-MOD"))
                .andExpect(jsonPath("$.volumeM3").value(450.00));
    }

    @Test
    @DisplayName("DELETE /farms/{farmId}/ponds/{pondId} - Debe responder 204 No Content")
    void deletePond_Returns204() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID pondId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        doNothing().when(pondService).deletePond(farmId, pondId, ownerId);

        mockMvc.perform(delete("/farms/{farmId}/ponds/{pondId}", farmId, pondId))
                .andExpect(status().isNoContent());
    }
}
