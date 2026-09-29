package com.agro.modules.swine.controller;

import java.math.BigDecimal;
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
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.swine.dto.CreateSwineBarnRequest;
import com.agro.modules.swine.dto.CreateSwinePenRequest;
import com.agro.modules.swine.dto.SwineBarnResponse;
import com.agro.modules.swine.dto.SwinePenResponse;
import com.agro.modules.swine.service.SwineService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(SwineController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class SwineControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SwineService swineService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /swine/barns - 201 Created al crear galpón porcícola")
    void createBarn_Returns201() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID barnId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);

        CreateSwineBarnRequest request = new CreateSwineBarnRequest(
                farmId, "Galpón G-01", "open_curtain", new BigDecimal("50.00"), new BigDecimal("12.00"), true, false);

        SwineBarnResponse response = new SwineBarnResponse(
                barnId, farmId, "Galpón G-01", "open_curtain", new BigDecimal("50.00"), new BigDecimal("12.00"),
                new BigDecimal("600.00"), true, false, true, OffsetDateTime.now());

        when(swineService.createBarn(any(), eq(ownerId))).thenReturn(response);

        mockMvc.perform(post("/swine/barns")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.codeName").value("Galpón G-01"))
                .andExpect(jsonPath("$.totalAreaM2").value(600.00));
    }

    @Test
    @DisplayName("POST /swine/pens - 201 Created al crear corral porcícola")
    void createPen_Returns201() throws Exception {
        UUID barnId = UUID.randomUUID();
        UUID penId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);

        CreateSwinePenRequest request = new CreateSwinePenRequest(
                barnId, "Corral C-01", "ceba", new BigDecimal("5.00"), new BigDecimal("4.00"), "nipple", 2, 4);

        SwinePenResponse response = new SwinePenResponse(
                penId, barnId, "Corral C-01", "ceba", new BigDecimal("5.00"), new BigDecimal("4.00"),
                new BigDecimal("20.00"), "nipple", 2, 4, new BigDecimal("1.00"), 20, true, OffsetDateTime.now());

        when(swineService.createPen(any(), eq(ownerId))).thenReturn(response);

        mockMvc.perform(post("/swine/pens")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.penCode").value("Corral C-01"))
                .andExpect(jsonPath("$.maxCapacityPigs").value(20));
    }

    @Test
    @DisplayName("GET /swine/barns/farm/{farmId} - 200 OK con lista de galpones")
    void getBarnsByFarm_Returns200() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);

        SwineBarnResponse response = new SwineBarnResponse(
                UUID.randomUUID(), farmId, "Galpón G-01", "open_curtain", new BigDecimal("50.00"), new BigDecimal("12.00"),
                new BigDecimal("600.00"), true, false, true, OffsetDateTime.now());

        when(swineService.getBarnsByFarm(eq(farmId), eq(ownerId))).thenReturn(List.of(response));

        mockMvc.perform(get("/swine/barns/farm/" + farmId))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codeName").value("Galpón G-01"));
    }
}
