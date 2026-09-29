package com.agro.modules.advisory.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Collections;
import java.util.List;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.agro.modules.advisory.dto.HarvestOptimizationResponse;
import com.agro.modules.biometry.domain.BiometryRecord;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.finance.repository.CostRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;
import com.agro.modules.species.domain.Species;

@ExtendWith(MockitoExtension.class)
class HarvestOptimizationServiceTest {

    @Mock
    private BatchService batchService;

    @Mock
    private FarmService farmService;

    @Mock
    private BiometryRecordRepository biometryRecordRepository;

    @Mock
    private FeedingRecordRepository feedingRecordRepository;

    @Mock
    private CostRecordRepository costRecordRepository;

    @InjectMocks
    private HarvestOptimizationService harvestOptimizationService;

    private UUID ownerId;
    private UUID farmId;
    private UUID batchId;
    private Farm sampleFarm;
    private Batch sampleBatch;
    private Species tilapiaSpecies;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        batchId = UUID.randomUUID();

        sampleFarm = Farm.builder()
                .id(farmId)
                .name("Piscícola San Jerónimo")
                .ownerId(ownerId)
                .build();

        tilapiaSpecies = Species.builder()
                .id(UUID.randomUUID())
                .commonName("Tilapia Roja")
                .expectedFcr(new BigDecimal("1.30"))
                .build();

        sampleBatch = Batch.builder()
                .id(batchId)
                .farm(sampleFarm)
                .species(tilapiaSpecies)
                .batchCode("TIL-2026-001")
                .stockingDate(LocalDate.now().minusDays(150))
                .initialQuantity(5000)
                .initialAvgWeightG(new BigDecimal("10.00"))
                .status("growout")
                .build();
    }

    @Test
    @DisplayName("Debe recomendar cosecha óptima cuando el peso supera la meta comercial de 500g")
    void shouldRecommendOptimalHarvestWhenTargetWeightReached() {
        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);

        BiometryRecord biometry = BiometryRecord.builder()
                .id(UUID.randomUUID())
                .batch(sampleBatch)
                .samplingDate(LocalDate.now())
                .sampledCount(30)
                .totalSampleWeightG(new BigDecimal("15600.00")) // 520 g promedio
                .calculatedAvgWeightG(new BigDecimal("520.00"))
                .estimatedBiomassKg(new BigDecimal("2500.00"))
                .observedMortality(100)
                .build();

        when(biometryRecordRepository.findByBatchIdOrderBySamplingDateDesc(batchId))
                .thenReturn(List.of(biometry));
        when(biometryRecordRepository.sumMortalityByBatchId(batchId)).thenReturn(100);
        when(feedingRecordRepository.sumSuppliedQuantityByBatchId(batchId))
                .thenReturn(new BigDecimal("3500.00"));
        when(feedingRecordRepository.sumTotalFeedCostByBatchId(batchId))
                .thenReturn(new BigDecimal("15750000.00")); // 4500 COP/kg

        HarvestOptimizationResponse response = harvestOptimizationService.evaluateHarvestOptimization(
                batchId,
                new BigDecimal("12000.00"),
                ownerId
        );

        assertThat(response).isNotNull();
        assertThat(response.batchCode()).isEqualTo("TIL-2026-001");
        assertThat(response.currentAvgWeightG()).isGreaterThanOrEqualTo(new BigDecimal("500.00"));
        assertThat(response.harvestStatus()).isEqualTo("OPTIMAL_HARVEST");
        assertThat(response.isPastOptimalPoint()).isFalse();
        assertThat(response.marketPricePerKg()).isEqualTo(new BigDecimal("12000.00"));
    }

    @Test
    @DisplayName("Debe indicar fase de crecimiento cuando el peso está aún lejos del peso de cosecha")
    void shouldIndicateGrowthPhaseWhenWeightIsLow() {
        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);

        BiometryRecord biometry = BiometryRecord.builder()
                .id(UUID.randomUUID())
                .batch(sampleBatch)
                .samplingDate(LocalDate.now())
                .sampledCount(30)
                .totalSampleWeightG(new BigDecimal("6000.00")) // 200 g promedio
                .calculatedAvgWeightG(new BigDecimal("200.00"))
                .estimatedBiomassKg(new BigDecimal("980.00"))
                .observedMortality(50)
                .build();

        when(biometryRecordRepository.findByBatchIdOrderBySamplingDateDesc(batchId))
                .thenReturn(List.of(biometry));
        when(biometryRecordRepository.sumMortalityByBatchId(batchId)).thenReturn(50);
        when(feedingRecordRepository.sumSuppliedQuantityByBatchId(batchId))
                .thenReturn(new BigDecimal("1200.00"));
        when(feedingRecordRepository.sumTotalFeedCostByBatchId(batchId))
                .thenReturn(new BigDecimal("5400000.00"));

        HarvestOptimizationResponse response = harvestOptimizationService.evaluateHarvestOptimization(
                batchId,
                new BigDecimal("12000.00"),
                ownerId
        );

        assertThat(response).isNotNull();
        assertThat(response.harvestStatus()).isEqualTo("GROWTH_PHASE");
        assertThat(response.marginalProfitPerKgGain()).isGreaterThan(BigDecimal.ZERO);
    }

    @Test
    @DisplayName("Debe alertar punto de inflexión biológico sobrepasado si el costo marginal excede el precio de venta")
    void shouldAlertInflexionPointWhenFeedCostExceedsMarketPrice() {
        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(farmService.findFarmEntity(farmId, ownerId)).thenReturn(sampleFarm);

        BiometryRecord biometry = BiometryRecord.builder()
                .id(UUID.randomUUID())
                .batch(sampleBatch)
                .samplingDate(LocalDate.now())
                .sampledCount(30)
                .totalSampleWeightG(new BigDecimal("18000.00")) // 600 g promedio (sobrealimentado)
                .calculatedAvgWeightG(new BigDecimal("600.00"))
                .estimatedBiomassKg(new BigDecimal("2800.00"))
                .observedMortality(100)
                .build();

        when(biometryRecordRepository.findByBatchIdOrderBySamplingDateDesc(batchId))
                .thenReturn(List.of(biometry));
        when(biometryRecordRepository.sumMortalityByBatchId(batchId)).thenReturn(100);
        // Concentrado carísimo o conversión degradada
        when(feedingRecordRepository.sumSuppliedQuantityByBatchId(batchId))
                .thenReturn(new BigDecimal("6000.00"));
        when(feedingRecordRepository.sumTotalFeedCostByBatchId(batchId))
                .thenReturn(new BigDecimal("36000000.00")); // 6000 COP/kg

        HarvestOptimizationResponse response = harvestOptimizationService.evaluateHarvestOptimization(
                batchId,
                new BigDecimal("8000.00"), // Precio de mercado bajo
                ownerId
        );

        assertThat(response).isNotNull();
        assertThat(response.harvestStatus()).isEqualTo("OPTIMAL_HARVEST");
        assertThat(response.isPastOptimalPoint()).isTrue();
        assertThat(response.marginalCostPerKgGain()).isGreaterThan(new BigDecimal("8000.00"));
    }
}
