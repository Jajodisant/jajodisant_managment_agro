package com.agro.modules.swine.dto;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

import com.agro.modules.swine.domain.SwineBarn;

public record SwineBarnResponse(
    UUID id,
    UUID farmId,
    String codeName,
    String barnType,
    BigDecimal lengthM,
    BigDecimal widthM,
    BigDecimal totalAreaM2,
    Boolean hasAutomaticVentilation,
    Boolean hasCoolingSystem,
    Boolean isActive,
    OffsetDateTime createdAt
) {
    public static SwineBarnResponse fromEntity(SwineBarn barn) {
        BigDecimal area = barn.getTotalAreaM2() != null ? barn.getTotalAreaM2() :
            (barn.getLengthM() != null && barn.getWidthM() != null ? barn.getLengthM().multiply(barn.getWidthM()) : BigDecimal.ZERO);

        return new SwineBarnResponse(
            barn.getId(),
            barn.getFarm().getId(),
            barn.getCodeName(),
            barn.getBarnType(),
            barn.getLengthM(),
            barn.getWidthM(),
            area,
            barn.getHasAutomaticVentilation(),
            barn.getHasCoolingSystem(),
            barn.getIsActive(),
            barn.getCreatedAt()
        );
    }
}
