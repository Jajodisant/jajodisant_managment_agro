package com.agro.modules.farm.service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.agro.common.exception.ResourceNotFoundException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.dto.CreateFarmRequest;
import com.agro.modules.farm.dto.FarmResponse;
import com.agro.modules.farm.dto.UpdateFarmRequest;
import com.agro.modules.farm.repository.FarmRepository;

@ExtendWith(MockitoExtension.class)
class FarmServiceTest {

    @Mock
    private FarmRepository farmRepository;

    @InjectMocks
    private FarmService farmService;

    private UUID ownerId;
    private UUID farmId;
    private Farm sampleFarm;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        sampleFarm = Farm.builder()
                .id(farmId)
                .name("Piscícola San Jerónimo")
                .ownerId(ownerId)
                .location("Vereda El Salado, Represa de Betania")
                .build();
    }

    @Test
    @DisplayName("Debe registrar exitosamente una nueva granja asociada al propietario")
    void createFarm_Success() {
        CreateFarmRequest request = new CreateFarmRequest("Piscícola San Jerónimo", "Vereda El Salado");
        when(farmRepository.save(any(Farm.class))).thenReturn(sampleFarm);

        FarmResponse response = farmService.createFarm(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(farmId);
        assertThat(response.name()).isEqualTo("Piscícola San Jerónimo");
        assertThat(response.ownerId()).isEqualTo(ownerId);
        verify(farmRepository).save(any(Farm.class));
    }

    @Test
    @DisplayName("Debe retornar las granjas asociadas al usuario propietario")
    void getFarmsByOwner_Success() {
        when(farmRepository.findByOwnerId(ownerId)).thenReturn(List.of(sampleFarm));

        List<FarmResponse> farms = farmService.getFarmsByOwner(ownerId);

        assertThat(farms).hasSize(1);
        assertThat(farms.getFirst().name()).isEqualTo("Piscícola San Jerónimo");
        verify(farmRepository).findByOwnerId(ownerId);
    }

    @Test
    @DisplayName("Debe obtener una granja por su ID y propietario")
    void getFarmById_Success() {
        when(farmRepository.findByIdAndOwnerId(farmId, ownerId)).thenReturn(Optional.of(sampleFarm));

        FarmResponse response = farmService.getFarmById(farmId, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.id()).isEqualTo(farmId);
        verify(farmRepository).findByIdAndOwnerId(farmId, ownerId);
    }

    @Test
    @DisplayName("Debe lanzar ResourceNotFoundException si la granja no existe o no pertenece al propietario")
    void getFarmById_NotFound() {
        when(farmRepository.findByIdAndOwnerId(farmId, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> farmService.getFarmById(farmId, ownerId))
                .isInstanceOf(ResourceNotFoundException.class)
                .hasMessageContaining("Granja no encontrado");
    }

    @Test
    @DisplayName("Debe actualizar nombre y ubicación de una granja existente")
    void updateFarm_Success() {
        UpdateFarmRequest request = new UpdateFarmRequest("Piscícola Actualizada", "Nueva Ubicación");
        when(farmRepository.findByIdAndOwnerId(farmId, ownerId)).thenReturn(Optional.of(sampleFarm));
        when(farmRepository.save(any(Farm.class))).thenReturn(sampleFarm);

        FarmResponse response = farmService.updateFarm(farmId, ownerId, request);

        assertThat(response).isNotNull();
        assertThat(sampleFarm.getName()).isEqualTo("Piscícola Actualizada");
        assertThat(sampleFarm.getLocation()).isEqualTo("Nueva Ubicación");
        verify(farmRepository).save(sampleFarm);
    }

    @Test
    @DisplayName("Debe eliminar una granja si existe y pertenece al usuario")
    void deleteFarm_Success() {
        when(farmRepository.findByIdAndOwnerId(farmId, ownerId)).thenReturn(Optional.of(sampleFarm));

        farmService.deleteFarm(farmId, ownerId);

        verify(farmRepository).delete(sampleFarm);
    }

    @Test
    @DisplayName("No debe eliminar granja si no pertenece al usuario autenticado")
    void deleteFarm_NotFound() {
        when(farmRepository.findByIdAndOwnerId(farmId, ownerId)).thenReturn(Optional.empty());

        assertThatThrownBy(() -> farmService.deleteFarm(farmId, ownerId))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(farmRepository, never()).delete(any());
    }
}
