package com.agro.modules.farm.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.agro.common.exception.DuplicateResourceException;
import com.agro.common.exception.ResourceNotFoundException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.domain.Pond;
import com.agro.modules.farm.dto.CreatePondRequest;
import com.agro.modules.farm.dto.PondResponse;
import com.agro.modules.farm.dto.UpdatePondRequest;
import com.agro.modules.farm.repository.PondRepository;

@ExtendWith(MockitoExtension.class)
class PondServiceTest {

    @Mock
    private PondRepository pondRepository;

    @Mock
    private FarmService farmService;

    @InjectMocks
    private PondService pondService;

    private UUID ownerId;
    private UUID farmId;
    private Farm testFarm;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        testFarm = Farm.builder()
                .id(farmId)
                .name("Acuícola Los Llanos")
                .ownerId(ownerId)
                .build();
    }

    @Test
    @DisplayName("HU-01 Escenario 1: Cálculo automático de volumen cúbico (20m x 10m x 1.5m = 300 m³)")
    void createPond_HU01_Scenario1_AutoCalculatesVolume() {
        CreatePondRequest request = new CreatePondRequest(
                "Estanque T-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                false,
                null // Sin densidad especificada
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Estanque T-01")).thenReturn(false);

        // Simulamos el guardado retornando la entidad persistida
        when(pondRepository.save(any(Pond.class))).thenAnswer(invocation -> {
            Pond p = invocation.getArgument(0);
            return Pond.builder()
                    .id(UUID.randomUUID())
                    .farm(testFarm)
                    .codeName(p.getCodeName())
                    .pondType(p.getPondType())
                    .lengthM(p.getLengthM())
                    .widthM(p.getWidthM())
                    .avgDepthM(p.getAvgDepthM())
                    .hasAeration(p.isHasAeration())
                    .maxDensityKgM3(p.getMaxDensityKgM3())
                    .isActive(true)
                    .build();
        });

        PondResponse response = pondService.createPond(farmId, ownerId, request);

        assertThat(response).isNotNull();
        assertThat(response.codeName()).isEqualTo("Estanque T-01");
        // Escenario 1: Volumen = 20 * 10 * 1.5 = 300.00 m³
        assertThat(response.volumeM3()).isEqualByComparingTo(new BigDecimal("300.00"));
    }

    @Test
    @DisplayName("HU-01 Escenario 2: Asignación de densidad superior (10 kg/m³) cuando tiene aireación mecánica")
    void createPond_HU01_Scenario2_WithAeration_SuggestsHighDensity() {
        CreatePondRequest request = new CreatePondRequest(
                "Tanque Aireado A-01",
                "geomembrane",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                true, // Con aireación mecánica activada
                null  // Densidad no provista -> debe sugerir valor superior
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Tanque Aireado A-01")).thenReturn(false);

        ArgumentCaptor<Pond> pondCaptor = ArgumentCaptor.forClass(Pond.class);
        when(pondRepository.save(pondCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        PondResponse response = pondService.createPond(farmId, ownerId, request);

        Pond capturedPond = pondCaptor.getValue();
        // Densidad debe sugerirse a 10.00 kg/m³
        assertThat(capturedPond.getMaxDensityKgM3()).isEqualByComparingTo(PondService.AERATED_MAX_DENSITY_KG_M3);
        assertThat(response.maxDensityKgM3()).isEqualByComparingTo(new BigDecimal("10.00"));
        // Capacidad máxima de biomasa = 300 m³ * 10 kg/m³ = 3000 kg
        assertThat(response.maxBiomassCapacityKg()).isEqualByComparingTo(new BigDecimal("3000.00"));
    }

    @Test
    @DisplayName("HU-01 Escenario 2: Asignación de densidad estándar (3 kg/m³) cuando NO tiene aireación")
    void createPond_HU01_Scenario2_WithoutAeration_SuggestsStandardDensity() {
        CreatePondRequest request = new CreatePondRequest(
                "Estanque Rústico R-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                false, // Sin aireación mecánica
                null   // Densidad no provista -> debe asignar valor estándar
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Estanque Rústico R-01")).thenReturn(false);

        ArgumentCaptor<Pond> pondCaptor = ArgumentCaptor.forClass(Pond.class);
        when(pondRepository.save(pondCaptor.capture())).thenAnswer(inv -> inv.getArgument(0));

        PondResponse response = pondService.createPond(farmId, ownerId, request);

        Pond capturedPond = pondCaptor.getValue();
        // Densidad estándar para estanques convencionales
        assertThat(capturedPond.getMaxDensityKgM3()).isEqualByComparingTo(PondService.NON_AERATED_MAX_DENSITY_KG_M3);
        assertThat(response.maxDensityKgM3()).isEqualByComparingTo(new BigDecimal("3.00"));
        // Capacidad máxima de biomasa = 300 m³ * 3 kg/m³ = 900 kg
        assertThat(response.maxBiomassCapacityKg()).isEqualByComparingTo(new BigDecimal("900.00"));
    }

    @Test
    @DisplayName("Debe respetar la densidad personalizada provista explícitamente por el usuario")
    void createPond_CustomDensity_Respected() {
        CreatePondRequest request = new CreatePondRequest(
                "Tanque Intensivo",
                "concrete",
                new BigDecimal("10.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.00"),
                true,
                new BigDecimal("15.50") // Densidad personalizada
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Tanque Intensivo")).thenReturn(false);

        when(pondRepository.save(any(Pond.class))).thenAnswer(inv -> inv.getArgument(0));

        PondResponse response = pondService.createPond(farmId, ownerId, request);

        assertThat(response.maxDensityKgM3()).isEqualByComparingTo(new BigDecimal("15.50"));
        // Volumen = 100 m³, Capacidad = 100 * 15.50 = 1550 kg
        assertThat(response.volumeM3()).isEqualByComparingTo(new BigDecimal("100.00"));
        assertThat(response.maxBiomassCapacityKg()).isEqualByComparingTo(new BigDecimal("1550.00"));
    }

    @Test
    @DisplayName("Debe lanzar DuplicateResourceException si ya existe un estanque con el mismo código en la granja")
    void createPond_DuplicateCode_ThrowsException() {
        CreatePondRequest request = new CreatePondRequest(
                "Estanque T-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                false,
                null
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Estanque T-01")).thenReturn(true);

        assertThatThrownBy(() -> pondService.createPond(farmId, ownerId, request))
                .isInstanceOf(DuplicateResourceException.class)
                .hasMessageContaining("Ya existe un Estanque con código 'Estanque T-01'");

        verify(pondRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe lanzar ResourceNotFoundException si la granja no existe al crear estanque")
    void createPond_FarmNotFound_ThrowsException() {
        CreatePondRequest request = new CreatePondRequest(
                "Estanque T-01",
                "earthen",
                new BigDecimal("20.00"),
                new BigDecimal("10.00"),
                new BigDecimal("1.50"),
                false,
                null
        );

        when(farmService.findFarmEntity(farmId, ownerId))
                .thenThrow(new ResourceNotFoundException("Granja", farmId));

        assertThatThrownBy(() -> pondService.createPond(farmId, ownerId, request))
                .isInstanceOf(ResourceNotFoundException.class);

        verify(pondRepository, never()).save(any());
    }

    @Test
    @DisplayName("Debe filtrar estanques activos cuando onlyActive es true")
    void getPondsByFarm_OnlyActiveFilter() {
        Pond activePond = Pond.builder().id(UUID.randomUUID()).farm(testFarm).codeName("P-1").isActive(true).build();
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.findByFarmIdAndIsActiveTrue(farmId)).thenReturn(List.of(activePond));

        List<PondResponse> result = pondService.getPondsByFarm(farmId, ownerId, true);

        assertThat(result).hasSize(1);
        assertThat(result.getFirst().codeName()).isEqualTo("P-1");
        verify(pondRepository).findByFarmIdAndIsActiveTrue(farmId);
        verify(pondRepository, never()).findByFarmId(farmId);
    }

    @Test
    @DisplayName("Debe actualizar dimensiones y aforo de un estanque existente")
    void updatePond_Success() {
        UUID pondId = UUID.randomUUID();
        Pond existingPond = Pond.builder()
                .id(pondId)
                .farm(testFarm)
                .codeName("Pond Antiguo")
                .lengthM(new BigDecimal("10.00"))
                .widthM(new BigDecimal("10.00"))
                .avgDepthM(new BigDecimal("1.00"))
                .maxDensityKgM3(new BigDecimal("3.00"))
                .hasAeration(false)
                .isActive(true)
                .build();

        UpdatePondRequest request = new UpdatePondRequest(
                "Pond Renovado",
                "geomembrane",
                new BigDecimal("20.00"),
                new BigDecimal("15.00"),
                new BigDecimal("2.00"),
                true,
                new BigDecimal("8.00"),
                true
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.findByIdAndFarmId(pondId, farmId)).thenReturn(Optional.of(existingPond));
        when(pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Pond Renovado")).thenReturn(false);
        when(pondRepository.save(any(Pond.class))).thenAnswer(inv -> inv.getArgument(0));

        PondResponse updated = pondService.updatePond(farmId, pondId, ownerId, request);

        assertThat(updated.codeName()).isEqualTo("Pond Renovado");
        assertThat(updated.volumeM3()).isEqualByComparingTo(new BigDecimal("600.00")); // 20 * 15 * 2 = 600
        assertThat(updated.maxBiomassCapacityKg()).isEqualByComparingTo(new BigDecimal("4800.00")); // 600 * 8 = 4800
        assertThat(updated.hasAeration()).isTrue();
    }

    @Test
    @DisplayName("Debe eliminar un estanque correctamente")
    void deletePond_Success() {
        UUID pondId = UUID.randomUUID();
        Pond existingPond = Pond.builder().id(pondId).farm(testFarm).codeName("Pond Para Borrar").build();

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(testFarm);
        when(pondRepository.findByIdAndFarmId(pondId, farmId)).thenReturn(Optional.of(existingPond));

        pondService.deletePond(farmId, pondId, ownerId);

        verify(pondRepository).delete(existingPond);
    }
}
