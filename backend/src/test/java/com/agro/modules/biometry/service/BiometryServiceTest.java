package com.agro.modules.biometry.service;

import java.math.BigDecimal;
import java.time.LocalDate;
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
import com.agro.modules.biometry.dto.BiometryResponse;
import com.agro.modules.biometry.dto.CreateBiometryRequest;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;

@ExtendWith(MockitoExtension.class)
class BiometryServiceTest {

    @Mock
    private BiometryRecordRepository biometryRecordRepository;

    @Mock
    private FeedingRecordRepository feedingRecordRepository;

    @Mock
    private BatchService batchService;

    @Mock
    private FarmService farmService;

    @InjectMocks
    private BiometryService biometryService;

    private UUID ownerId;
    private UUID farmId;
    private UUID batchId;
    private Farm sampleFarm;
    private Batch sampleBatch;

    @BeforeEach
    void setUp() {
        ownerId = UUID.randomUUID();
        farmId = UUID.randomUUID();
        batchId = UUID.randomUUID();

        sampleFarm = Farm.builder().id(farmId).name("Granja Piscícola").ownerId(ownerId).build();

        // Lote: 10,000 peces de 5g = 50 kg de biomasa inicial sembrada
        sampleBatch = Batch.builder()
                .id(batchId)
                .farm(sampleFarm)
                .batchCode("TIL-2026-HU05")
                .stockingDate(LocalDate.now().minusDays(45))
                .initialQuantity(10000)
                .initialAvgWeightG(new BigDecimal("5.00"))
                .build();
    }

    @Test
    @DisplayName("HU-05 Escenario 1: Cálculo automático de biomasa (980 kg), ganancia (930 kg) y FCR acumulado (1.29 con semáforo verde)")
    void recordBiometry_HU05_Scenario1_AutoCalculatesBiomassAndFcr() {
        // Muestreo: 100 peces pesados con 10,000g en total (promedio 100g) y 200 bajas de mortalidad
        CreateBiometryRequest request = new CreateBiometryRequest(
                LocalDate.now(),
                100,
                new BigDecimal("10000.00"),
                200,
                "Muestreo de engorde etapa 2"
        );

        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(biometryRecordRepository.sumMortalityByBatchId(batchId)).thenReturn(0); // Sin mortalidad previa
        // Alimento total consumido acumulado = 1,200 kg
        when(feedingRecordRepository.sumSuppliedQuantityByBatchId(batchId)).thenReturn(new BigDecimal("1200.00"));
        when(biometryRecordRepository.findTopByBatchIdOrderBySamplingDateDesc(batchId)).thenReturn(Optional.empty());

        when(biometryRecordRepository.save(any(BiometryRecord.class))).thenAnswer(inv -> {
            BiometryRecord b = inv.getArgument(0);
            b.setId(UUID.randomUUID());
            return b;
        });

        BiometryResponse response = biometryService.recordBiometry(batchId, ownerId, request);

        assertThat(response).isNotNull();
        // Promedio de peso calculado: 10000 / 100 = 100.00 g
        assertThat(response.calculatedAvgWeightG()).isEqualByComparingTo(new BigDecimal("100.00"));
        // Población remanente: 10,000 - 200 = 9,800 peces
        assertThat(response.remainingPopulation()).isEqualTo(9800);
        // Biomasa actual estimada: (9800 * 100) / 1000 = 980.00 kg
        assertThat(response.estimatedBiomassKg()).isEqualByComparingTo(new BigDecimal("980.00"));
        // Ganancia neta de biomasa ganada: 980 kg - 50 kg iniciales = 930.00 kg
        assertThat(response.netBiomassGainedKg()).isEqualByComparingTo(new BigDecimal("930.00"));
        // FCR acumulado: 1,200 kg alimento / 930 kg ganancia = 1.29
        assertThat(response.accumulatedFcr()).isEqualByComparingTo(new BigDecimal("1.29"));
        // Semáforo de eficiencia: <= 1.35 debe ser VERDE
        assertThat(response.fcrStatus()).isEqualTo("GREEN");

        verify(biometryRecordRepository).save(any(BiometryRecord.class));
    }

    @Test
    @DisplayName("HU-05: FCR superior a 1.60 debe activar alerta visual en ROJO (desperdicio o sobrealimentación)")
    void recordBiometry_HighFcr_TriggersRedAlert() {
        // Supongamos que consumieron 2,000 kg de alimento para la misma ganancia de 930 kg -> FCR = 2.15
        CreateBiometryRequest request = new CreateBiometryRequest(
                LocalDate.now(), 100, new BigDecimal("10000.00"), 200, "Muestreo con alta conversión");

        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(biometryRecordRepository.sumMortalityByBatchId(batchId)).thenReturn(0);
        when(feedingRecordRepository.sumSuppliedQuantityByBatchId(batchId)).thenReturn(new BigDecimal("2000.00"));
        when(biometryRecordRepository.findTopByBatchIdOrderBySamplingDateDesc(batchId)).thenReturn(Optional.empty());
        when(biometryRecordRepository.save(any(BiometryRecord.class))).thenAnswer(inv -> inv.getArgument(0));

        BiometryResponse response = biometryService.recordBiometry(batchId, ownerId, request);

        assertThat(response.accumulatedFcr()).isEqualByComparingTo(new BigDecimal("2.15"));
        assertThat(response.fcrStatus()).isEqualTo("RED");
    }
}
