package com.agro.modules.feeding.repository;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.agro.modules.feeding.domain.FeedingRecord;

/**
 * Repositorio Spring Data JPA para Registros de Alimentación (FeedingRecord).
 */
@Repository
public interface FeedingRecordRepository extends JpaRepository<FeedingRecord, UUID> {

    List<FeedingRecord> findByBatchIdOrderByFeedingDateDescFeedingTimeDesc(UUID batchId);

    List<FeedingRecord> findByBatchIdAndFeedingDate(UUID batchId, LocalDate feedingDate);

    @Query("SELECT COALESCE(SUM(f.suppliedQuantityKg), 0.0) FROM FeedingRecord f WHERE f.batch.id = :batchId")
    BigDecimal sumSuppliedQuantityByBatchId(@Param("batchId") UUID batchId);

    @Query("SELECT COALESCE(SUM(f.suppliedQuantityKg * f.costPerKg), 0.0) FROM FeedingRecord f WHERE f.batch.id = :batchId")
    BigDecimal sumTotalFeedCostByBatchId(@Param("batchId") UUID batchId);
}
