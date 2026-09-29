package com.agro.modules.advisory.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import org.springframework.test.web.servlet.MockMvc;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.advisory.dto.HarvestOptimizationResponse;
import com.agro.modules.advisory.service.HarvestOptimizationService;

@WebMvcTest(HarvestOptimizationController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class HarvestOptimizationControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private HarvestOptimizationService harvestOptimizationService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("GET /advisory/harvest-optimization/{batchId} - 200 OK con evaluación")
    void getBatchHarvestOptimization_Returns200() throws Exception {
        UUID batchId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);

        HarvestOptimizationResponse response = new HarvestOptimizationResponse(
                batchId,
                "TIL-2026-001",
                "Tilapia Roja",
                new BigDecimal("510.00"),
                new BigDecimal("500.00"),
                new BigDecimal("2450.00"),
                4800,
                145L,
                new BigDecimal("1.35"),
                new BigDecimal("1.75"),
                new BigDecimal("4500.00"),
                new BigDecimal("7875.00"),
                new BigDecimal("12000.00"),
                new BigDecimal("4125.00"),
                new BigDecimal("13.44"),
                new BigDecimal("55440.00"),
                "OPTIMAL_HARVEST",
                "Talla Comercial Óptima Alcanzada",
                "Programar cosecha esta semana.",
                LocalDate.now().plusDays(3),
                false
        );

        when(harvestOptimizationService.evaluateHarvestOptimization(eq(batchId), any(), eq(ownerId)))
                .thenReturn(response);

        mockMvc.perform(get("/advisory/harvest-optimization/" + batchId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.batchCode").value("TIL-2026-001"))
                .andExpect(jsonPath("$.harvestStatus").value("OPTIMAL_HARVEST"))
                .andExpect(jsonPath("$.isPastOptimalPoint").value(false))
                .andExpect(jsonPath("$.currentAvgWeightG").value(510.00));
    }

    @Test
    @DisplayName("GET /advisory/harvest-optimization/farm/{farmId} - 200 OK con lista de lotes")
    void getFarmHarvestOptimizations_Returns200() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);

        HarvestOptimizationResponse response = new HarvestOptimizationResponse(
                UUID.randomUUID(),
                "TIL-2026-001",
                "Tilapia Roja",
                new BigDecimal("480.00"),
                new BigDecimal("500.00"),
                new BigDecimal("2300.00"),
                4800,
                140L,
                new BigDecimal("1.32"),
                new BigDecimal("1.55"),
                new BigDecimal("4500.00"),
                new BigDecimal("6975.00"),
                new BigDecimal("12000.00"),
                new BigDecimal("5025.00"),
                new BigDecimal("13.44"),
                new BigDecimal("67536.00"),
                "APPROACHING_HARVEST",
                "Lote en Fase de Acabado Final",
                "Coordinar venta en próximos 10 días.",
                LocalDate.now().plusDays(10),
                false
        );

        when(harvestOptimizationService.evaluateFarmHarvestOptimizations(eq(farmId), any(), eq(ownerId)))
                .thenReturn(List.of(response));

        mockMvc.perform(get("/advisory/harvest-optimization/farm/" + farmId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].harvestStatus").value("APPROACHING_HARVEST"));
    }
}
