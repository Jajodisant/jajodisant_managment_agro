package com.agro.modules.species.controller;

import java.math.BigDecimal;
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
import com.agro.modules.species.dto.CreateFeedingTableRequest;
import com.agro.modules.species.dto.CreateSpeciesRequest;
import com.agro.modules.species.dto.FeedingTableResponse;
import com.agro.modules.species.dto.SpeciesResponse;
import com.agro.modules.species.service.SpeciesService;
import com.fasterxml.jackson.databind.ObjectMapper;

@WebMvcTest(SpeciesController.class)
@Import({SecurityConfig.class, GlobalExceptionHandler.class, CurrentUserProvider.class})
@AutoConfigureMockMvc(addFilters = false)
class SpeciesControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SpeciesService speciesService;

    @MockBean
    private CurrentUserProvider currentUserProvider;

    @Test
    @DisplayName("POST /species - 201 Created al registrar especie")
    void createSpecies_Returns201() throws Exception {
        UUID id = UUID.randomUUID();
        CreateSpeciesRequest request = new CreateSpeciesRequest("Tilapia Roja", "Oreochromis sp.", new BigDecimal("1.30"), null, null, null);
        SpeciesResponse response = new SpeciesResponse(id, "Tilapia Roja", "Oreochromis sp.", new BigDecimal("1.30"), null, null, null, 0);

        when(speciesService.createSpecies(any())).thenReturn(response);

        mockMvc.perform(post("/species")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(id.toString()))
                .andExpect(jsonPath("$.commonName").value("Tilapia Roja"));
    }

    @Test
    @DisplayName("GET /species - 200 OK")
    void getAllSpecies_Returns200() throws Exception {
        SpeciesResponse s = new SpeciesResponse(UUID.randomUUID(), "Tilapia", "sp", new BigDecimal("1.30"), null, null, null, 0);
        when(speciesService.getAllSpecies()).thenReturn(List.of(s));

        mockMvc.perform(get("/species"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.length()").value(1));
    }

    @Test
    @DisplayName("POST /species/{id}/feeding-tables - 201 Created")
    void addFeedingTable_Returns201() throws Exception {
        UUID speciesId = UUID.randomUUID();
        CreateFeedingTableRequest request = new CreateFeedingTableRequest(
                new BigDecimal("50.00"), new BigDecimal("150.00"), new BigDecimal("3.50"), 3, new BigDecimal("32.0"));
        FeedingTableResponse response = new FeedingTableResponse(
                UUID.randomUUID(), speciesId, "Tilapia", new BigDecimal("50.00"),
                new BigDecimal("150.00"), new BigDecimal("3.50"), 3, new BigDecimal("32.0"));

        when(speciesService.addFeedingTable(eq(speciesId), any())).thenReturn(response);

        mockMvc.perform(post("/species/{speciesId}/feeding-tables", speciesId)
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.biomassPercentage").value(3.50));
    }
}
