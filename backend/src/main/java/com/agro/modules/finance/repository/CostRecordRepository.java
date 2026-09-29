package com.agro.modules.finance.repository;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import com.agro.modules.finance.domain.CostRecord;

/**
 * Repositorio Spring Data JPA para el control de Costos y Egresos (CostRecord).
 */
@Repository
public interface CostRecordRepository extends JpaRepository<CostRecord, UUID> {

    List<CostRecord> findByFarmIdOrderByExpenseDateDesc(UUID farmId);

    List<CostRecord> findByBatchIdOrderByExpenseDateDesc(UUID batchId);

    @Query("SELECT COALESCE(SUM(c.totalAmount), 0.0) FROM CostRecord c WHERE c.batch.id = :batchId")
    BigDecimal sumTotalAmountByBatchId(@Param("batchId") UUID batchId);

    @Query("SELECT COALESCE(SUM(c.totalAmount), 0.0) FROM CostRecord c WHERE c.batch.id = :batchId AND c.category = :category")
    BigDecimal sumAmountByBatchIdAndCategory(@Param("batchId") UUID batchId, @Param("category") String category);
}
