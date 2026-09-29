package com.agro.modules.finance.service;

import java.math.BigDecimal;
import java.util.Optional;
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

import com.agro.modules.biometry.domain.BiometryRecord;
import com.agro.modules.biometry.repository.BiometryRecordRepository;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.feeding.repository.FeedingRecordRepository;
import com.agro.modules.finance.dto.BatchFinancialSummaryResponse;
import com.agro.modules.finance.repository.CostRecordRepository;
import com.agro.modules.lot.domain.Batch;
import com.agro.modules.lot.service.BatchService;

@ExtendWith(MockitoExtension.class)
class CostServiceTest {

    @Mock
    private CostRecordRepository costRecordRepository;

    @Mock
    private FeedingRecordRepository feedingRecordRepository;

    @Mock
    private BiometryRecordRepository biometryRecordRepository;

    @Mock
    private FarmService farmService;

    @Mock
    private BatchService batchService;

    @InjectMocks
    private CostService costService;

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
        sampleBatch = Batch.builder().id(batchId).farm(sampleFarm).batchCode("TIL-2026-HU06").build();
    }

    @Test
    @DisplayName("HU-06 Escenario 1: Cálculo exacto de costo por kilo en tiempo real ($5,000 USD / 2,500 kg = 2.00 USD/kg)")
    void getBatchFinancialSummary_HU06_Scenario1_CostPerKg() {
        // Biomasa viva estimada = 2,500 kg
        BiometryRecord biometry = BiometryRecord.builder()
                .estimatedBiomassKg(new BigDecimal("2500.00"))
                .build();

        when(batchService.findBatchEntity(batchId)).thenReturn(sampleBatch);
        when(biometryRecordRepository.findTopByBatchIdOrderBySamplingDateDesc(batchId)).thenReturn(Optional.of(biometry));

        // Desglose de costos que suman exactamente $5,000 USD:
        // Alimento diario = $3,000
        when(feedingRecordRepository.sumTotalFeedCostByBatchId(batchId)).thenReturn(new BigDecimal("3000.00"));
        when(costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "feed")).thenReturn(BigDecimal.ZERO);
        // Alevines = $1,000
        when(costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "fingerlings")).thenReturn(new BigDecimal("1000.00"));
        // Mano de obra = $500
        when(costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "labor")).thenReturn(new BigDecimal("500.00"));
        // Energía = $300
        when(costRecordRepository.sumAmountByBatchIdAndCategory(batchId, "energy")).thenReturn(new BigDecimal("300.00"));
        // Total egresos registrados en cost_record = 1000 + 500 + 300 + 200 (otros) = $2,000
        when(costRecordRepository.sumTotalAmountByBatchId(batchId)).thenReturn(new BigDecimal("2000.00"));

        BatchFinancialSummaryResponse summary = costService.getBatchFinancialSummary(batchId, ownerId);

        assertThat(summary).isNotNull();
        assertThat(summary.currentBiomassKg()).isEqualByComparingTo(new BigDecimal("2500.00"));
        // Costo acumulado total: $3,000 (alimento) + $2,000 (otros rubros) = $5,000 USD
        assertThat(summary.totalCumulativeCost()).isEqualByComparingTo(new BigDecimal("5000.00"));
        // Costo por kilogramo producido: $5,000 / 2,500 = 2.00 USD/kg
        assertThat(summary.costPerKgProduced()).isEqualByComparingTo(new BigDecimal("2.00"));
    }
}
