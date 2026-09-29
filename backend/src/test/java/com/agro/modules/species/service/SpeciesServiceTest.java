package com.agro.modules.species.service;

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
import static org.mockito.ArgumentMatchers.any;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import org.mockito.junit.jupiter.MockitoExtension;

import com.agro.common.exception.BusinessRuleException;
import com.agro.common.exception.DuplicateResourceException;
import com.agro.modules.species.domain.FeedingTable;
import com.agro.modules.species.domain.Species;
import com.agro.modules.species.dto.CreateFeedingTableRequest;
import com.agro.modules.species.dto.CreateSpeciesRequest;
import com.agro.modules.species.dto.FeedingTableResponse;
import com.agro.modules.species.dto.SpeciesResponse;
import com.agro.modules.species.repository.FeedingTableRepository;
import com.agro.modules.species.repository.SpeciesRepository;

@ExtendWith(MockitoExtension.class)
class SpeciesServiceTest {

    @Mock
    private SpeciesRepository speciesRepository;

    @Mock
    private FeedingTableRepository feedingTableRepository;

    @InjectMocks
    private SpeciesService speciesService;

    private UUID speciesId;
    private Species tilapia;

    @BeforeEach
    void setUp() {
        speciesId = UUID.randomUUID();
        tilapia = Species.builder()
                .id(speciesId)
                .commonName("Tilapia Roja")
                .scientificName("Oreochromis sp.")
                .expectedFcr(new BigDecimal("1.30"))
                .build();
    }

    @Test
    @DisplayName("Debe registrar exitosamente una nueva especie en el catálogo")
    void createSpecies_Success() {
        CreateSpeciesRequest request = new CreateSpeciesRequest(
                "Trucha Arcoíris", "Oncorhynchus mykiss", new BigDecimal("1.15"),
                new BigDecimal("12.0"), new BigDecimal("16.0"), new BigDecimal("6.0"));

        when(speciesRepository.existsByCommonNameIgnoreCase("Trucha Arcoíris")).thenReturn(false);
        when(speciesRepository.save(any(Species.class))).thenAnswer(inv -> {
            Species s = inv.getArgument(0);
            s.setId(UUID.randomUUID());
            return s;
        });

        SpeciesResponse response = speciesService.createSpecies(request);

        assertThat(response).isNotNull();
        assertThat(response.commonName()).isEqualTo("Trucha Arcoíris");
        verify(speciesRepository).save(any(Species.class));
    }

    @Test
    @DisplayName("Debe lanzar DuplicateResourceException si el nombre común de especie ya existe")
    void createSpecies_DuplicateName_ThrowsException() {
        CreateSpeciesRequest request = new CreateSpeciesRequest(
                "Tilapia Roja", null, null, null, null, null);

        when(speciesRepository.existsByCommonNameIgnoreCase("Tilapia Roja")).thenReturn(true);

        assertThatThrownBy(() -> speciesService.createSpecies(request))
                .isInstanceOf(DuplicateResourceException.class);
    }

    @Test
    @DisplayName("Debe añadir un tramo válido a la tabla de alimentación")
    void addFeedingTable_Success() {
        CreateFeedingTableRequest request = new CreateFeedingTableRequest(
                new BigDecimal("50.00"), new BigDecimal("150.00"), new BigDecimal("3.50"), 3, new BigDecimal("32.0"));

        when(speciesRepository.findById(speciesId)).thenReturn(Optional.of(tilapia));
        when(feedingTableRepository.save(any(FeedingTable.class))).thenAnswer(inv -> {
            FeedingTable ft = inv.getArgument(0);
            ft.setId(UUID.randomUUID());
            return ft;
        });

        FeedingTableResponse response = speciesService.addFeedingTable(speciesId, request);

        assertThat(response).isNotNull();
        assertThat(response.biomassPercentage()).isEqualByComparingTo(new BigDecimal("3.50"));
        assertThat(response.dailyFrequency()).isEqualTo(3);
    }

    @Test
    @DisplayName("Debe lanzar BusinessRuleException si minWeightG >= maxWeightG")
    void addFeedingTable_InvalidWeightRange_ThrowsException() {
        CreateFeedingTableRequest request = new CreateFeedingTableRequest(
                new BigDecimal("100.00"), new BigDecimal("50.00"), new BigDecimal("3.00"), 2, null);

        when(speciesRepository.findById(speciesId)).thenReturn(Optional.of(tilapia));

        assertThatThrownBy(() -> speciesService.addFeedingTable(speciesId, request))
                .isInstanceOf(BusinessRuleException.class)
                .hasMessageContaining("menor que el peso máximo");
    }

    @Test
    @DisplayName("Debe recuperar la recomendación nutricional exacta para un peso dado")
    void getFeedingRecommendation_Success() {
        BigDecimal sampleWeight = new BigDecimal("120.00");
        FeedingTable ft = FeedingTable.builder()
                .species(tilapia)
                .minWeightG(new BigDecimal("50.00"))
                .maxWeightG(new BigDecimal("150.00"))
                .biomassPercentage(new BigDecimal("3.50"))
                .dailyFrequency(3)
                .build();

        when(feedingTableRepository.findNutritionByWeight(speciesId, sampleWeight)).thenReturn(Optional.of(ft));

        Optional<FeedingTable> result = speciesService.getFeedingRecommendation(speciesId, sampleWeight);

        assertThat(result).isPresent();
        assertThat(result.get().getBiomassPercentage()).isEqualByComparingTo(new BigDecimal("3.50"));
    }
}
