package com.agro.modules.biometry.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.biometry.dto.BiometryResponse;
import com.agro.modules.biometry.dto.CreateBiometryRequest;
import com.agro.modules.biometry.service.BiometryService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(BiometryController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class BiometryControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BiometryService biometryService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /batches/{id}/biometries - 201 Created con FCR calculado (HU-05)")
    void recordBiometry_Returns201() throws Exception {
        UUID batchId = UUID.randomUUID();
        CreateBiometryRequest request = new CreateBiometryRequest(
                LocalDate.now(), 100, new BigDecimal("10000.00"), 200, "Muestreo");

        BiometryResponse response = new BiometryResponse(
                UUID.randomUUID(), batchId, "TIL-01", LocalDate.now(), 100,
                new BigDecimal("10000.00"), new BigDecimal("100.00"), 200,
                new BigDecimal("980.00"), 9800, new BigDecimal("930.00"),
                new BigDecimal("1200.00"), new BigDecimal("1.29"), "GREEN",
                new BigDecimal("1.50"), "Muestreo", OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(biometryService.recordBiometry(eq(batchId), any(), any())).thenReturn(response);

        mockMvc.perform(post("/batches/{batchId}/biometries", batchId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.accumulatedFcr").value(1.29))
                .andExpect(jsonPath("$.fcrStatus").value("GREEN"));
    }
}
