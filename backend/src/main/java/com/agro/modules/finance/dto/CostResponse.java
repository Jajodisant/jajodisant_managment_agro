package com.agro.modules.finance.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.agro.modules.finance.domain.CostRecord;

/**
 * DTO inmutable de salida para un registro individual de costo.
 */
public record CostResponse(
    UUID id,
    UUID farmId,
    UUID batchId,
    String batchCode,
    LocalDate expenseDate,
    String category,
    String description,
    BigDecimal totalAmount,
    OffsetDateTime createdAt
) {
    public static CostResponse fromEntity(CostRecord c) {
        return new CostResponse(
            c.getId(),
            c.getFarm() != null ? c.getFarm().getId() : null,
            c.getBatch() != null ? c.getBatch().getId() : null,
            c.getBatch() != null ? c.getBatch().getBatchCode() : null,
            c.getExpenseDate(),
            c.getCategory(),
            c.getDescription(),
            c.getTotalAmount(),
            c.getCreatedAt()
        );
    }
}
