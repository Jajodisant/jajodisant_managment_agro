package com.agro.modules.finance.controller;

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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.finance.dto.BatchFinancialSummaryResponse;
import com.agro.modules.finance.dto.CostResponse;
import com.agro.modules.finance.dto.CreateCostRequest;
import com.agro.modules.finance.service.CostService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(CostController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class CostControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private CostService costService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /costs - 201 Created al registrar costo")
    void recordCost_Returns201() throws Exception {
        UUID farmId = UUID.randomUUID();
        CreateCostRequest request = new CreateCostRequest(
                farmId, null, LocalDate.now(), "feed", "Concentrado 32%", new BigDecimal("450.00"));
        CostResponse response = new CostResponse(
                UUID.randomUUID(), farmId, null, null, LocalDate.now(), "feed", "Concentrado 32%",
                new BigDecimal("450.00"), OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(costService.recordCost(any(), any())).thenReturn(response);

        mockMvc.perform(post("/costs")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.category").value("feed"))
                .andExpect(jsonPath("$.totalAmount").value(450.00));
    }

    @Test
    @DisplayName("GET /costs/batch/{id}/summary - 200 OK con costo por kg (HU-06)")
    void getBatchFinancialSummary_Returns200() throws Exception {
        UUID batchId = UUID.randomUUID();
        BatchFinancialSummaryResponse summary = new BatchFinancialSummaryResponse(
                batchId, "TIL-01", new BigDecimal("2500.00"), new BigDecimal("3000.00"),
                new BigDecimal("1000.00"), new BigDecimal("500.00"), new BigDecimal("300.00"),
                new BigDecimal("200.00"), new BigDecimal("5000.00"), new BigDecimal("2.00"));

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(costService.getBatchFinancialSummary(eq(batchId), any())).thenReturn(summary);

        mockMvc.perform(get("/costs/batch/{batchId}/summary", batchId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.currentBiomassKg").value(2500.00))
                .andExpect(jsonPath("$.totalCumulativeCost").value(5000.00))
                .andExpect(jsonPath("$.costPerKgProduced").value(2.00));
    }
}
