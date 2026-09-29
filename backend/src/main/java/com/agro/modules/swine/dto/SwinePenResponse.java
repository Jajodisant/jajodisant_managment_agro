package com.agro.modules.swine.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.agro.modules.swine.domain.SwinePen;

public record SwinePenResponse(
    UUID id,
    UUID barnId,
    String penCode,
    String phase,
    BigDecimal lengthM,
    BigDecimal widthM,
    BigDecimal areaM2,
    String drinkerType,
    Integer drinkerCount,
    Integer feederSpaces,
    BigDecimal maxDensityM2PerPig,
    Integer maxCapacityPigs,
    Boolean isActive,
    OffsetDateTime createdAt
) {
    public static SwinePenResponse fromEntity(SwinePen pen) {
        BigDecimal area = pen.getAreaM2() != null ? pen.getAreaM2() :
            (pen.getLengthM() != null && pen.getWidthM() != null ? pen.getLengthM().multiply(pen.getWidthM()) : BigDecimal.ZERO);

        return new SwinePenResponse(
            pen.getId(),
            pen.getBarn().getId(),
            pen.getPenCode(),
            pen.getPhase(),
            pen.getLengthM(),
            pen.getWidthM(),
            area,
            pen.getDrinkerType(),
            pen.getDrinkerCount(),
            pen.getFeederSpaces(),
            pen.getMaxDensityM2PerPig(),
            pen.getMaxCapacityPigs(),
            pen.getIsActive(),
            pen.getCreatedAt()
        );
    }
}
