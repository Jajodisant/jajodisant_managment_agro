package com.agro.modules.species.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.boot.context.event.ApplicationReadyEvent;
import org.springframework.context.event.EventListener;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.common.exception.BusinessRuleException;
import com.agro.common.exception.DuplicateResourceException;
import com.agro.common.exception.ResourceNotFoundException;
import com.agro.modules.species.domain.FeedingTable;
import com.agro.modules.species.domain.Species;
import com.agro.modules.species.dto.CreateFeedingTableRequest;
import com.agro.modules.species.dto.CreateSpeciesRequest;
import com.agro.modules.species.dto.FeedingTableResponse;
import com.agro.modules.species.dto.SpeciesResponse;
import com.agro.modules.species.repository.FeedingTableRepository;
import com.agro.modules.species.repository.SpeciesRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de negocio para el catálogo zootécnico de especies y curvas de alimentación.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SpeciesService {

    private final SpeciesRepository speciesRepository;
    private final FeedingTableRepository feedingTableRepository;

    /**
     * Inicializa especies piscícolas comerciales de referencia al arrancar si el catálogo está vacío.
     */
    @EventListener(ApplicationReadyEvent.class)
    @Transactional
    public void seedDefaultCommercialSpecies() {
        if (speciesRepository.count() > 0) {
            return;
        }

        log.info("Poblando catálogo base de especies piscícolas comerciales...");

        // 1. Tilapia Roja
        Species tilapia = Species.builder()
                .commonName("Tilapia Roja")
                .scientificName("Oreochromis sp.")
                .expectedFcr(new BigDecimal("1.30"))
                .optimalTempMin(new BigDecimal("26.0"))
                .optimalTempMax(new BigDecimal("30.0"))
                .minOxygenMgL(new BigDecimal("4.0"))
                .build();
        Species savedTilapia = speciesRepository.save(tilapia);

        addFeedingTableDirect(savedTilapia, "0.50", "10.00", "8.00", 6, "40.0");
        addFeedingTableDirect(savedTilapia, "10.01", "50.00", "5.00", 4, "36.0");
        addFeedingTableDirect(savedTilapia, "50.01", "150.00", "3.50", 3, "32.0");
        addFeedingTableDirect(savedTilapia, "150.01", "350.00", "2.50", 2, "28.0");
        addFeedingTableDirect(savedTilapia, "350.01", "1500.00", "1.80", 2, "24.0");

        // 2. Trucha Arcoíris
        Species trucha = Species.builder()
                .commonName("Trucha Arcoíris")
                .scientificName("Oncorhynchus mykiss")
                .expectedFcr(new BigDecimal("1.15"))
                .optimalTempMin(new BigDecimal("12.0"))
                .optimalTempMax(new BigDecimal("16.0"))
                .minOxygenMgL(new BigDecimal("6.0"))
                .build();
        Species savedTrucha = speciesRepository.save(trucha);
        addFeedingTableDirect(savedTrucha, "1.00", "20.00", "6.00", 5, "45.0");
        addFeedingTableDirect(savedTrucha, "20.01", "100.00", "3.20", 3, "40.0");
        addFeedingTableDirect(savedTrucha, "100.01", "500.00", "1.90", 2, "38.0");

        // 3. Cachama Blanca
        Species cachama = Species.builder()
                .commonName("Cachama Blanca")
                .scientificName("Piaractus brachypomus")
                .expectedFcr(new BigDecimal("1.40"))
                .optimalTempMin(new BigDecimal("25.0"))
                .optimalTempMax(new BigDecimal("29.0"))
                .minOxygenMgL(new BigDecimal("3.5"))
                .build();
        Species savedCachama = speciesRepository.save(cachama);
        addFeedingTableDirect(savedCachama, "1.00", "30.00", "7.00", 4, "38.0");
        addFeedingTableDirect(savedCachama, "30.01", "200.00", "4.00", 3, "30.0");
        addFeedingTableDirect(savedCachama, "200.01", "1200.00", "2.00", 2, "24.0");

        log.info("Catálogo zootécnico inicial poblado con éxito.");
    }

    private void addFeedingTableDirect(Species species, String min, String max, String pct, int freq, String prot) {
        FeedingTable ft = FeedingTable.builder()
                .species(species)
                .minWeightG(new BigDecimal(min))
                .maxWeightG(new BigDecimal(max))
                .biomassPercentage(new BigDecimal(pct))
                .dailyFrequency(freq)
                .suggestedProteinPct(new BigDecimal(prot))
                .build();
        feedingTableRepository.save(ft);
    }

    @Transactional
    public SpeciesResponse createSpecies(CreateSpeciesRequest request) {
        String trimmedName = request.commonName().trim();
        if (speciesRepository.existsByCommonNameIgnoreCase(trimmedName)) {
            throw new DuplicateResourceException("Especie", "nombre común", trimmedName);
        }

        Species species = Species.builder()
                .commonName(trimmedName)
                .scientificName(request.scientificName() != null ? request.scientificName().trim() : null)
                .expectedFcr(request.expectedFcr() != null ? request.expectedFcr() : new BigDecimal("1.30"))
                .optimalTempMin(request.optimalTempMin() != null ? request.optimalTempMin() : new BigDecimal("26.0"))
                .optimalTempMax(request.optimalTempMax() != null ? request.optimalTempMax() : new BigDecimal("30.0"))
                .minOxygenMgL(request.minOxygenMgL() != null ? request.minOxygenMgL() : new BigDecimal("4.0"))
                .build();

        Species saved = speciesRepository.save(species);
        return SpeciesResponse.fromEntity(saved);
    }

    public List<SpeciesResponse> getAllSpecies() {
        return speciesRepository.findAll().stream()
                .map(SpeciesResponse::fromEntity)
                .toList();
    }

    public SpeciesResponse getSpeciesById(UUID id) {
        Species species = findSpeciesEntity(id);
        return SpeciesResponse.fromEntity(species);
    }

    @Transactional
    public FeedingTableResponse addFeedingTable(UUID speciesId, CreateFeedingTableRequest request) {
        Species species = findSpeciesEntity(speciesId);

        if (request.minWeightG().compareTo(request.maxWeightG()) >= 0) {
            throw new BusinessRuleException("El peso mínimo debe ser estrictamente menor que el peso máximo");
        }

        FeedingTable ft = FeedingTable.builder()
                .species(species)
                .minWeightG(request.minWeightG())
                .maxWeightG(request.maxWeightG())
                .biomassPercentage(request.biomassPercentage())
                .dailyFrequency(request.dailyFrequency())
                .suggestedProteinPct(request.suggestedProteinPct())
                .build();

        FeedingTable saved = feedingTableRepository.save(ft);
        return FeedingTableResponse.fromEntity(saved);
    }

    public List<FeedingTableResponse> getFeedingTablesBySpecies(UUID speciesId) {
        findSpeciesEntity(speciesId);
        return feedingTableRepository.findBySpeciesIdOrderByMinWeightGAsc(speciesId).stream()
                .map(FeedingTableResponse::fromEntity)
                .toList();
    }

    public Optional<FeedingTable> getFeedingRecommendation(UUID speciesId, BigDecimal weightG) {
        return feedingTableRepository.findNutritionByWeight(speciesId, weightG);
    }

    public Species findSpeciesEntity(UUID id) {
        return speciesRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Especie", id));
    }
}
