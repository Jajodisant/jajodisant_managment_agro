package com.agro.modules.feeding.controller;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
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
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.feeding.dto.BatchFeedingSyncRequest;
import com.agro.modules.feeding.dto.CreateFeedingRecordRequest;
import com.agro.modules.feeding.dto.DailyFeedingPlanResponse;
import com.agro.modules.feeding.dto.FeedingRecordResponse;
import com.agro.modules.feeding.service.FeedingService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(FeedingController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class FeedingControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FeedingService feedingService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("GET /batches/{id}/feeding/plan - 200 OK con cálculo de cuota diaria (HU-03)")
    void getDailyFeedingPlan_Returns200() throws Exception {
        UUID batchId = UUID.randomUUID();
        DailyFeedingPlanResponse plan = new DailyFeedingPlanResponse(
                batchId, "TIL-01", "Tilapia Roja", new BigDecimal("150.00"),
                new BigDecimal("1000.00"), new BigDecimal("3.00"), new BigDecimal("30.00"),
                2, new BigDecimal("15.00"), List.of("09:00", "15:00"), new BigDecimal("32.0"));

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(feedingService.calculateDailyFeedingPlan(eq(batchId), any())).thenReturn(plan);

        mockMvc.perform(get("/batches/{batchId}/feeding/plan", batchId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalDailyQuotaKg").value(30.00))
                .andExpect(jsonPath("$.rationQuotaKg").value(15.00))
                .andExpect(jsonPath("$.dailyFrequency").value(2));
    }

    @Test
    @DisplayName("POST /batches/{id}/feeding/batch-sync - 200 OK sincronización offline (HU-04)")
    void syncBatchFeeding_Returns200() throws Exception {
        UUID batchId = UUID.randomUUID();
        CreateFeedingRecordRequest r = new CreateFeedingRecordRequest(
                LocalDate.now(), 1, LocalTime.of(9, 0), "Italcol 32%",
                new BigDecimal("15.00"), new BigDecimal("1.20"), null, null);
        BatchFeedingSyncRequest request = new BatchFeedingSyncRequest(List.of(r));

        FeedingRecordResponse resp = new FeedingRecordResponse(
                UUID.randomUUID(), batchId, "TIL-01", LocalDate.now(), 1,
                LocalTime.of(9, 0), "Italcol 32%", new BigDecimal("15.00"),
                new BigDecimal("1.20"), new BigDecimal("18.00"), null, null, OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(UUID.randomUUID());
        when(feedingService.syncBatchFeeding(eq(batchId), any(), any())).thenReturn(List.of(resp));

        mockMvc.perform(post("/batches/{batchId}/feeding/batch-sync", batchId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].totalRationCost").value(18.00));
    }
}
