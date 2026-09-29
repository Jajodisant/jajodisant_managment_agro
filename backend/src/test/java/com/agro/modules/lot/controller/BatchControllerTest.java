package com.agro.modules.lot.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.List;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.common.exception.BusinessRuleException;
import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.lot.dto.BatchResponse;
import com.agro.modules.lot.dto.CreateBatchRequest;
import com.agro.modules.lot.dto.UpdateBatchStatusRequest;
import com.agro.modules.lot.service.BatchService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(BatchController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class BatchControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private BatchService batchService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /batches - 201 Created al registrar siembra normal")
    void createBatch_Returns201() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID speciesId = UUID.randomUUID();
        UUID batchId = UUID.randomUUID();
        CreateBatchRequest request = new CreateBatchRequest(
                farmId, null, speciesId, "TIL-01", LocalDate.now(), 1000, new BigDecimal("5.00"), null, null, false);
        BatchResponse response = new BatchResponse(
                batchId, farmId, "Farm", null, null, speciesId, "Tilapia",
                "TIL-01", LocalDate.now(), 1000, new BigDecimal("5.00"), new BigDecimal("5.00"),
                "stocking", null, null, false, BigDecimal.ZERO, OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(batchService.createBatch(any(), any())).thenReturn(response);

        mockMvc.perform(post("/batches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(batchId.toString()))
                .andExpect(jsonPath("$.batchCode").value("TIL-01"));
    }

    @Test
    @DisplayName("POST /batches - 422 Unprocessable Entity en alerta preventiva de sobrecupo (HU-02)")
    void createBatch_OvercrowdingPreventiveAlert_Returns422() throws Exception {
        CreateBatchRequest request = new CreateBatchRequest(
                UUID.randomUUID(), UUID.randomUUID(), UUID.randomUUID(), "TIL-02",
                LocalDate.now(), 5000, new BigDecimal("5.00"), null, null, false);

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(batchService.createBatch(any(), any()))
                .thenThrow(new BusinessRuleException("Alerta preventiva de sobrepoblación (HU-02)"));

        mockMvc.perform(post("/batches")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isUnprocessableEntity())
                .andExpect(jsonPath("$.status").value(422));
    }

    @Test
    @DisplayName("PATCH /batches/{id}/status - 200 OK")
    void updateBatchStatus_Returns200() throws Exception {
        UUID batchId = UUID.randomUUID();
        UpdateBatchStatusRequest request = new UpdateBatchStatusRequest("growout", null);
        BatchResponse response = new BatchResponse(
                batchId, UUID.randomUUID(), "Farm", null, null, UUID.randomUUID(), "Tilapia",
                "TIL-01", LocalDate.now(), 1000, new BigDecimal("5.00"), new BigDecimal("5.00"),
                "growout", null, null, false, BigDecimal.ZERO, OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(batchService.updateBatchStatus(eq(batchId), any(), any())).thenReturn(response);

        mockMvc.perform(patch("/batches/{batchId}/status", batchId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.status").value("growout"));
    }
}
