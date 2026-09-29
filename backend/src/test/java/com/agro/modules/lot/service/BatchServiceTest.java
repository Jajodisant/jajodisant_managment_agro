package com.agro.modules.lot.service;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.agro.common.exception.BusinessRuleException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.domain.Pond;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.farm.service.PondService;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.dto.BatchResponse;
import com.agro.modules.lot.dto.CreateBatchRequest;
import com.agro.modules.lot.repository.BatchRepository;
import com.agro.modules.species.domain.Species;
import com.agro.modules.species.service.SpeciesService;

@ExtendWith(MockitoExtension.class)
class BatchServiceTest {

    @Mock
    private BatchRepository batchRepository;

    @Mock
    private FarmService farmService;

    @Mock
    private PondService pondService;

    @Mock
    private SpeciesService speciesService;

    @InjectMocks
    private BatchService batchService;

    private UUID ownerId;
    private UUID farmId;
    private UUID pondId;
    private UUID speciesId;
    private Farm sampleFarm;
    private Pond samplePond;
    private Species sampleSpecies;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        pondId = UUID.randomUUID();
        speciesId = UUID.randomUUID();

        sampleFarm = Farm.builder().id(farmId).name("Granja Piscícola").ownerId(ownerId).build();

        // Estanque: 10m x 10m x 1m = 100 m³, max density = 3.0 kg/m³ -> Capacidad técnica máxima = 300 kg (600 peces de 500g)
        samplePond = Pond.builder()
                .id(pondId)
                .farm(sampleFarm)
                .codeName("Tanque 1")
                .lengthM(new BigDecimal("10.00"))
                .widthM(new BigDecimal("10.00"))
                .avgDepthM(new BigDecimal("1.00"))
                .maxDensityKgM3(new BigDecimal("3.00"))
                .isActive(true)
                .build();

        sampleSpecies = Species.builder().id(speciesId).commonName("Tilapia").build();
    }

    @Test
    @DisplayName("HU-02 Escenario 1: Debe lanzar BusinessRuleException preventiva si la siembra excede la capacidad del estanque sin confirmación")
    void createBatch_HU02_OvercrowdingPreventiveAlert() {
        // Intento de sembrar 1,500 peces a 500g cosecha = 750 kg. Capacidad estanque = 300 kg -> Sobrecupo del 150%
        CreateBatchRequest request = new CreateBatchRequest(
                farmId, pondId, speciesId, "TIL-2026-001", LocalDate.now(),
                1500, new BigDecimal("5.00"), new BigDecimal("500.00"),
                LocalDate.now().plusMonths(6), false // forceStocking = false
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(batchRepository.existsByBatchCodeIgnoreCase("TIL-2026-001")).thenReturn(false);
        when(speciesService.findSpeciesEntity(speciesId)).thenReturn(sampleSpecies);
        when(pondService.findPondEntity(farmId, pondId)).thenReturn(samplePond);

        assertThatThrownBy(() -> batchService.createBatch(request, ownerId))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("Alerta preventiva de sobrepoblación (HU-02)")
                .hasMessageContaining("supera la capacidad técnica máxima");
    }

    @Test
    @DisplayName("HU-02: Debe permitir la siembra con advertencia si forceStocking es true")
    void createBatch_HU02_ForceStocking_AllowedWithWarning() {
        CreateBatchRequest request = new CreateBatchRequest(
                farmId, pondId, speciesId, "TIL-2026-002", LocalDate.now(),
                1500, new BigDecimal("5.00"), new BigDecimal("500.00"),
                LocalDate.now().plusMonths(6), true // forceStocking = true (confirmación consciente)
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(batchRepository.existsByBatchCodeIgnoreCase("TIL-2026-002")).thenReturn(false);
        when(speciesService.findSpeciesEntity(speciesId)).thenReturn(sampleSpecies);
        when(pondService.findPondEntity(farmId, pondId)).thenReturn(samplePond);

        when(batchRepository.save(any(Batch.class))).thenAnswer(inv -> {
            Batch b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        BatchResponse response = batchService.createBatch(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.overcrowdingWarning()).isTrue();
        assertThat(response.overcrowdingPercentage()).isGreaterThan(BigDecimal.ZERO);
        verify(batchRepository).save(any(Batch.class));
    }

    @Test
    @DisplayName("Debe sembrar exitosamente sin advertencia cuando la carga está dentro de los límites técnicos")
    void createBatch_NormalCapacity_Success() {
        // 500 peces a 500g = 250 kg <= 300 kg capacidad estanque
        CreateBatchRequest request = new CreateBatchRequest(
                farmId, pondId, speciesId, "TIL-2026-003", LocalDate.now(),
                500, new BigDecimal("5.00"), new BigDecimal("500.00"),
                LocalDate.now().plusMonths(6), false
        );

        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);
        when(batchRepository.existsByBatchCodeIgnoreCase("TIL-2026-003")).thenReturn(false);
        when(speciesService.findSpeciesEntity(speciesId)).thenReturn(sampleSpecies);
        when(pondService.findPondEntity(farmId, pondId)).thenReturn(samplePond);

        when(batchRepository.save(any(Batch.class))).thenAnswer(inv -> {
            Batch b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        BatchResponse response = batchService.createBatch(request, ownerId);

        assertThat(response).isNotNull();
        assertThat(response.overcrowdingWarning()).isFalse();
    }
}
