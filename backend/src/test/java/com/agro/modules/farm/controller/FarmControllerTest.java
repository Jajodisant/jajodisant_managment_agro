package com.agro.modules.farm.controller;

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

import com.agro.common.exception.ResourceNotFoundException;
import com.agro.config.CurrentUserProvider;
import com.agro.config.GlobalExceptionHandler;
import com.agro.config.SecurityConfig;
import com.agro.modules.farm.dto.CreateFarmRequest;
import com.agro.modules.farm.dto.FarmResponse;
import com.agro.modules.farm.dto.UpdateFarmRequest;
import com.agro.modules.farm.service.FarmService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(FarmController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class FarmControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private FarmService farmService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /farms - Debe responder 201 Created al registrar una granja válida")
    void createFarm_Returns201() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        CreateFarmRequest request = new CreateFarmRequest("Granja El Porvenir", "Neiva, Huila");
        FarmResponse response = new FarmResponse(farmId, "Granja El Porvenir", ownerId, "Neiva, Huila", 0, OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(farmService.createFarm(any(CreateFarmRequest.class), eq(ownerId))).thenReturn(response);

        mockMvc.perform(post("/farms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(header().exists("Location"))
                .andExpect(jsonPath("$.id").value(farmId.toString()))
                .andExpect(jsonPath("$.name").value("Granja El Porvenir"));
    }

    @Test
    @DisplayName("POST /farms - Debe responder 400 Bad Request cuando el nombre es en blanco")
    void createFarm_InvalidName_Returns400() throws Exception {
        CreateFarmRequest request = new CreateFarmRequest("", "Ubicación");

        mockMvc.perform(post("/farms")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isBadRequest())
                .andExpect(jsonPath("$.status").value(400))
                .andExpect(jsonPath("$.fieldErrors.name").exists());
    }

    @Test
    @DisplayName("GET /farms - Debe responder 200 OK con el listado de granjas")
    void getFarms_Returns200() throws Exception {
        UUID ownerId = UUID.randomUUID();
        FarmResponse farm = new FarmResponse(UUID.randomUUID(), "Granja 1", ownerId, "Loc", 2, OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(farmService.getFarmsByOwner(ownerId)).thenReturn(List.of(farm));

        mockMvc.perform(get("/farms"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1))
                .andExpect(jsonPath("$[0].name").value("Granja 1"));
    }

    @Test
    @DisplayName("GET /farms/{id} - Debe responder 404 Not Found si la granja no existe")
    void getFarmById_NotFound_Returns404() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(farmService.getFarmById(farmId, ownerId)).thenThrow(new ResourceNotFoundException("Granja", farmId));

        mockMvc.perform(get("/farms/{farmId}", farmId))
                .andExpect(status().isNotFound())
                .andExpect(jsonPath("$.status").value(404));
    }

    @Test
    @DisplayName("PUT /farms/{id} - Debe responder 200 OK al actualizar")
    void updateFarm_Returns200() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();
        UpdateFarmRequest request = new UpdateFarmRequest("Nombre Nuevo", "Nueva Loc");
        FarmResponse response = new FarmResponse(farmId, "Nombre Nuevo", ownerId, "Nueva Loc", 0, OffsetDateTime.now());

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        when(farmService.updateFarm(eq(farmId), eq(ownerId), any(UpdateFarmRequest.class))).thenReturn(response);

        mockMvc.perform(put("/farms/{farmId}", farmId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.name").value("Nombre Nuevo"));
    }

    @Test
    @DisplayName("DELETE /farms/{id} - Debe responder 204 No Content al eliminar")
    void deleteFarm_Returns204() throws Exception {
        UUID farmId = UUID.randomUUID();
        UUID ownerId = UUID.randomUUID();

        when(currentUserProvider.resolveUserId(any())).thenReturn(ownerId);
        doNothing().when(farmService).deleteFarm(farmId, ownerId);

        mockMvc.perform(delete("/farms/{farmId}", farmId))
                .andExpect(status().isNoContent());
    }
}
