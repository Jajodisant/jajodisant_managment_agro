package com.agro.modules.swine.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import static org.junit.jupiter.api.Assertions.assertThrows;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.agro.common.exception.DuplicateResourceException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.swine.domain.SwineBarn;
import com.agro.modules.swine.domain.SwinePen;
import com.agro.modules.swine.dto.CreateSwineBarnRequest;
import com.agro.modules.swine.dto.CreateSwinePenRequest;
import com.agro.modules.swine.dto.SwineBarnResponse;
import com.agro.modules.swine.dto.SwinePenResponse;
import com.agro.modules.swine.repository.SwineBarnRepository;
import com.agro.modules.swine.repository.SwinePenRepository;

@ExtendWith(MockitoExtension.class)
class SwineServiceTest {

    @Mock
    private SwineBarnRepository swineBarnRepository;

    @Mock
    private SwinePenRepository swinePenRepository;

    @Mock
    private FarmService farmService;

    @InjectMocks
    private SwineService swineService;

    private UUID ownerId;
    private UUID farmId;
    private UUID barnId;
    private Farm sampleFarm;
    private SwineBarn sampleBarn;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        barnId = UUID.randomUUID();

        sampleFarm = Farm.builder()
                .id(farmId)
                .name("Granja Agropecuaria La Cabaña")
                .ownerId(ownerId)
                .build();

        sampleBarn = SwineBarn.builder()
                .id(barnId)
                .farm(sampleFarm)
                .codeName("Galpón G-01")
                .barnType("open_curtain")
                .lengthM(new BigDecimal("50.00"))
                .widthM(new BigDecimal("12.00"))
                .hasAutomaticVentilation(true)
                .build();
    }

    @Test
    @DisplayName("Debe crear galpón porcícola exitosamente")
    void createBarn_Success() {
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(swineBarnRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Galpón G-01")).thenReturn(false);
        when(swineBarnRepository.save(any(SwineBarn.class))).thenReturn(sampleBarn);

        CreateSwineBarnRequest request = new CreateSwineBarnRequest(
                farmId, "Galpón G-01", "open_curtain", new BigDecimal("50.00"), new BigDecimal("12.00"), true, false);

        SwineBarnResponse response = swineService.createBarn(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.codeName()).isEqualTo("Galpón G-01");
        assertThat(response.farmId()).isEqualTo(farmId);
    }

    @Test
    @DisplayName("Debe lanzar excepción si el código de galpón ya existe en la granja")
    void createBarn_DuplicateThrowsException() {
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(swineBarnRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, "Galpón G-01")).thenReturn(true);

        CreateSwineBarnRequest request = new CreateSwineBarnRequest(
                farmId, "Galpón G-01", "open_curtain", new BigDecimal("50.00"), new BigDecimal("12.00"), true, false);

        assertThrows(DuplicateResourceException.class, () -> swineService.createBarn(request, ownerId));
    }

    @Test
    @DisplayName("Debe crear corral porcícola y computar aforo zootécnico según etapa de ceba (1.0 m2/cerdo)")
    void createPen_ComputesCapacityCorrectly() {
        when(swineBarnRepository.findById(barnId)).thenReturn(java.util.Optional.of(sampleBarn));
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(swinePenRepository.existsByBarnIdAndPenCodeIgnoreCase(barnId, "Corral C-01")).thenReturn(false);

        SwinePen savedPen = SwinePen.builder()
                .id(UUID.randomUUID())
                .barn(sampleBarn)
                .penCode("Corral C-01")
                .phase("ceba")
                .lengthM(new BigDecimal("5.00"))
                .widthM(new BigDecimal("4.00"))
                .drinkerType("nipple")
                .drinkerCount(2)
                .feederSpaces(4)
                .maxDensityM2PerPig(new BigDecimal("1.00"))
                .maxCapacityPigs(20) // 20 m2 / 1.0 = 20 cerdos
                .build();

        when(swinePenRepository.save(any(SwinePen.class))).thenReturn(savedPen);

        CreateSwinePenRequest request = new CreateSwinePenRequest(
                barnId, "Corral C-01", "ceba", new BigDecimal("5.00"), new BigDecimal("4.00"), "nipple", 2, 4);

        SwinePenResponse response = swineService.createPen(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.penCode()).isEqualTo("Corral C-01");
        assertThat(response.maxCapacityPigs()).isEqualTo(20);
        assertThat(response.maxDensityM2PerPig()).isEqualByComparingTo(new BigDecimal("1.00"));
    }

    @Test
    @DisplayName("Debe computar aforo zootécnico para etapa de precebo (0.35 m2/lechón)")
    void createPen_ComputesPreceboCapacity() {
        when(swineBarnRepository.findById(barnId)).thenReturn(java.util.Optional.of(sampleBarn));
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(swinePenRepository.existsByBarnIdAndPenCodeIgnoreCase(barnId, "Corral P-01")).thenReturn(false);

        // 14 m2 / 0.35 m2 = 40 lechones
        SwinePen savedPen = SwinePen.builder()
                .id(UUID.randomUUID())
                .barn(sampleBarn)
                .penCode("Corral P-01")
                .phase("precebo")
                .lengthM(new BigDecimal("7.00"))
                .widthM(new BigDecimal("2.00"))
                .maxDensityM2PerPig(new BigDecimal("0.35"))
                .maxCapacityPigs(40)
                .build();

        when(swinePenRepository.save(any(SwinePen.class))).thenReturn(savedPen);

        CreateSwinePenRequest request = new CreateSwinePenRequest(
                barnId, "Corral P-01", "precebo", new BigDecimal("7.00"), new BigDecimal("2.00"), "nipple", 2, 4);

        SwinePenResponse response = swineService.createPen(request, ownerId);

        assertThat(response.maxCapacityPigs()).isEqualTo(40);
        assertThat(response.maxDensityM2PerPig()).isEqualByComparingTo(new BigDecimal("0.35"));
    }
}
