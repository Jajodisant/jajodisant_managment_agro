package com.agro.modules.biometry.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.agro.modules.biometry.domain.BiometryRecord;

/**
 * Repositorio Spring Data JPA para Muestreos Biométricos (BiometryRecord).
 */
@Repository
public interface BiometryRecordRepository extends JpaRepository<BiometryRecord, UUID> {

    List<BiometryRecord> findByBatchIdOrderBySamplingDateDesc(UUID batchId);

    Optional<BiometryRecord> findTopByBatchIdOrderBySamplingDateDesc(UUID batchId);

    @Query("SELECT COALESCE(SUM(b.observedMortality), 0) FROM BiometryRecord b WHERE b.batch.id = :batchId")
    int sumMortalityByBatchId(@Param("batchId") UUID batchId);
}
