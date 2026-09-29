package com.agro.modules.lot.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.agro.modules.lot.domain.Batch;

/**
 * Repositorio Spring Data JPA para la entidad Batch (Lotes Biológicos / Cohortes Piscícolas).
 */
@Repository
public interface BatchRepository extends JpaRepository<Batch, UUID> {

    List<Batch> findByFarmId(UUID farmId);

    List<Batch> findByPondId(UUID pondId);

    Optional<Batch> findByBatchCodeIgnoreCase(String batchCode);

    boolean existsByBatchCodeIgnoreCase(String batchCode);

    List<Batch> findByFarmIdAndStatusIn(UUID farmId, List<String> statuses);
}
