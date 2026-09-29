package com.agro.modules.feeding.dto;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.time.LocalTime;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.agro.modules.feeding.domain.FeedingRecord;

/**
 * DTO inmutable de salida para un registro de alimentación suministrada.
 */
public record FeedingRecordResponse(
    UUID id,
    UUID batchId,
    String batchCode,
    LocalDate feedingDate,
    Integer rationNumber,
    LocalTime feedingTime,
    String feedBrandType,
    BigDecimal suppliedQuantityKg,
    BigDecimal costPerKg,
    BigDecimal totalRationCost,
    BigDecimal waterTemperatureC,
    BigDecimal dissolvedOxygenMgL,
    OffsetDateTime createdAt
) {
    public static FeedingRecordResponse fromEntity(FeedingRecord f) {
        BigDecimal totalCost = BigDecimal.ZERO;
        if (f.getSuppliedQuantityKg() != null && f.getCostPerKg() != null) {
            totalCost = f.getSuppliedQuantityKg().multiply(f.getCostPerKg()).setScale(2, RoundingMode.HALF_UP);
        }

        return new FeedingRecordResponse(
            f.getId(),
            f.getBatch() != null ? f.getBatch().getId() : null,
            f.getBatch() != null ? f.getBatch().getBatchCode() : null,
            f.getFeedingDate(),
            f.getRationNumber(),
            f.getFeedingTime(),
            f.getFeedBrandType(),
            f.getSuppliedQuantityKg(),
            f.getCostPerKg(),
            totalCost,
            f.getWaterTemperatureC(),
            f.getDissolvedOxygenMgL(),
            f.getCreatedAt()
        );
    }
}
