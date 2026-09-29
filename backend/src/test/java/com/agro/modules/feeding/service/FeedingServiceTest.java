package com.agro.modules.feeding.service;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.assertj.core.api.Assertions.assertThat;
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

import com.agro.modules.biometry.domain.BiometryRecord;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.domain.FeedingRecord;
import com.agro.modules.feeding.dto.BatchFeedingSyncRequest;
import com.agro.modules.feeding.dto.CreateFeedingRecordRequest;
import com.agro.modules.feeding.dto.DailyFeedingPlanResponse;
import com.agro.modules.feeding.dto.FeedingRecordResponse;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;
import com.agro.modules.species.domain.FeedingTable;
import com.agro.modules.species.domain.Species;
import com.agro.modules.species.repository.FeedingTableRepository;

@ExtendWith(MockitoExtension.class)
class FeedingServiceTest {

    @Mock
    private FeedingRecordRepository feedingRecordRepository;

    @Mock
    private BiometryRecordRepository biometryRecordRepository;

    @Mock
    private FeedingTableRepository feedingTableRepository;

    @Mock
    private BatchService batchService;

    @Mock
    private FarmService farmService;

    @InjectMocks
    private FeedingService feedingService;

    private UUID ownerId;
    private UUID farmId;
    private UUID batchId;
    private UUID speciesId;
    private Farm sampleFarm;
    private Species sampleSpecies;
    private Batch sampleBatch;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        batchId = UUID.randomUUID();
        speciesId = UUID.randomUUID();

        sampleFarm = Farm.builder().id(farmId).name("Granja Piscícola").ownerId(ownerId).build();
        sampleSpecies = Species.builder().id(speciesId).commonName("Tilapia Roja").build();

        sampleBatch = Batch.builder()
                .id(batchId)
                .farm(sampleFarm)
                .species(sampleSpecies)
                .batchCode("TIL-2026-HU03")
                .initialQuantity(10000)
                .initialAvgWeightG(new BigDecimal("10.00"))
                .build();
    }

    @Test
    @DisplayName("HU-03 Escenario 1: Cálculo automático de ración diaria (1,000 kg de biomasa al 3.0% = 30 kg, 2 raciones de 15 kg)")
    void calculateDailyFeedingPlan_HU03_Scenario1_AutoCalculatesQuota() {
        // Último muestreo: pez promedio 150g, biomasa 1,000 kg
        BiometryRecord latestBiometry = BiometryRecord.builder()
                .batch(sampleBatch)
                .calculatedAvgWeightG(new BigDecimal("150.00"))
                .estimatedBiomassKg(new BigDecimal("1000.00"))
                .build();

        // Tabla técnica para 150g: 3.0% de biomasa al día y 2 raciones
        FeedingTable feedingRule = FeedingTable.builder()
                .species(sampleSpecies)
                .minWeightG(new BigDecimal("100.00"))
                .maxWeightG(new BigDecimal("200.00"))
                .biomassPercentage(new BigDecimal("3.00"))
                .dailyFrequency(2)
                .suggestedProteinPct(new BigDecimal("32.0"))
                .build();

        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(biometryRecordRepository.findTopByBatchIdOrderBySamplingDateDesc(batchId)).thenReturn(Optional.of(latestBiometry));
        when(feedingTableRepository.findNutritionByWeight(speciesId, new BigDecimal("150.00"))).thenReturn(Optional.of(feedingRule));

        DailyFeedingPlanResponse plan = feedingService.calculateDailyFeedingPlan(batchId, ownerId);

        assertThat(plan).isNotNull();
        assertThat(plan.currentBiomassKg()).isEqualByComparingTo(new BigDecimal("1000.00"));
        assertThat(plan.recommendedBiomassPercentage()).isEqualByComparingTo(new BigDecimal("3.00"));
        // Cuota diaria total = 1,000 * 3% = 30.00 kg
        assertThat(plan.totalDailyQuotaKg()).isEqualByComparingTo(new BigDecimal("30.00"));
        // 2 raciones
        assertThat(plan.dailyFrequency()).isEqualTo(2);
        // Cada ración = 15.00 kg
        assertThat(plan.rationQuotaKg()).isEqualByComparingTo(new BigDecimal("15.00"));
        // Horarios sugeridos
        assertThat(plan.suggestedHours()).containsExactly("09:00", "15:00");
    }

    @Test
    @DisplayName("HU-04: Registro individual y sincronización en bloque de raciones suministradas offline")
    void syncBatchFeeding_HU04_OfflineSync() {
        CreateFeedingRecordRequest r1 = new CreateFeedingRecordRequest(
                LocalDate.now(), 1, LocalTime.of(9, 0), "Italcol 32%",
                new BigDecimal("15.00"), new BigDecimal("1.20"),
                new BigDecimal("28.0"), new BigDecimal("5.5"));

        CreateFeedingRecordRequest r2 = new CreateFeedingRecordRequest(
                LocalDate.now(), 2, LocalTime.of(15, 0), "Italcol 32%",
                new BigDecimal("15.00"), new BigDecimal("1.20"),
                new BigDecimal("28.5"), new BigDecimal("6.0"));

        BatchFeedingSyncRequest syncRequest = new BatchFeedingSyncRequest(List.of(r1, r2));

        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(feedingRecordRepository.save(any(FeedingRecord.class))).thenAnswer(inv -> {
            FeedingRecord f = inv.getArgument(0);
            f.setId(UUID.randomUUID());
            return f;
        });

        List<FeedingRecordResponse> synced = feedingService.syncBatchFeeding(batchId, ownerId, syncRequest);

        assertThat(synced).hasSize(2);
        assertThat(synced.getFirst().suppliedQuantityKg()).isEqualByComparingTo(new BigDecimal("15.00"));
        assertThat(synced.getFirst().totalRationCost()).isEqualByComparingTo(new BigDecimal("18.00")); // 15 * 1.20 = 18.00
        verify(feedingRecordRepository, org.mockito.Mockito.times(2)).save(any(FeedingRecord.class));
    }
}
