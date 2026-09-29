package com.agro.modules.species.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.agro.modules.species.domain.FeedingTable;

/**
 * Repositorio Spring Data JPA para las Tablas Nutricionales y Curvas de Alimentación (FeedingTable).
 */
@Repository
public interface FeedingTableRepository extends JpaRepository<FeedingTable, UUID> {

    List<FeedingTable> findBySpeciesIdOrderByMinWeightGAsc(UUID speciesId);

    /**
     * Encuentra la recomendación nutricional exacta para un peso corporal específico.
     * min_weight_g <= weight < max_weight_g (o <= max_weight_g para el límite superior).
     */
    @Query("""
        SELECT ft FROM FeedingTable ft
        WHERE ft.species.id = :speciesId
          AND :weight >= ft.minWeightG
          AND :weight <= ft.maxWeightG
        ORDER BY ft.minWeightG DESC
        LIMIT 1
    """)
    Optional<FeedingTable> findNutritionByWeight(
            @Param("speciesId") UUID speciesId,
            @Param("weight") BigDecimal weight);
}
