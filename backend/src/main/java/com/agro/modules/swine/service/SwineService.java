package com.agro.modules.swine.service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.common.exception.DuplicateResourceException;
import com.agro.common.exception.ResourceNotFoundException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.service.FarmService;
import com.agro.modules.swine.domain.SwineBarn;
import com.agro.modules.swine.domain.SwinePen;
import com.agro.modules.swine.dto.CreateSwineBarnRequest;
import com.agro.modules.swine.dto.CreateSwinePenRequest;
import com.agro.modules.swine.dto.SwineBarnResponse;
import com.agro.modules.swine.dto.SwinePenResponse;
import com.agro.modules.swine.repository.SwineBarnRepository;
import com.agro.modules.swine.repository.SwinePenRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de negocio para la gestión de infraestructura porcícola (Galpones, Corrales y Aforo HU-10).
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class SwineService {

    private final SwineBarnRepository swineBarnRepository;
    private final SwinePenRepository swinePenRepository;
    private final FarmService farmService;

    @Transactional
    public SwineBarnResponse createBarn(CreateSwineBarnRequest request, UUID ownerId) {
        log.info("Creando galpón porcícola '{}' en granja ID {}", request.codeName(), request.farmId());

        Farm farm = farmService.findFarmEntity(request.farmId(), ownerId);

        String code = request.codeName().trim();
        if (swineBarnRepository.existsByFarmIdAndCodeNameIgnoreCase(farm.getId(), code)) {
            throw new DuplicateResourceException("Galpón Porcícola", "código", code);
        }

        SwineBarn barn = SwineBarn.builder()
                .farm(farm)
                .codeName(code)
                .barnType(request.barnType() != null ? request.barnType().trim().toLowerCase(Locale.ROOT) : "open_curtain")
                .lengthM(request.lengthM())
                .widthM(request.widthM())
                .hasAutomaticVentilation(Boolean.TRUE.equals(request.hasAutomaticVentilation()))
                .hasCoolingSystem(Boolean.TRUE.equals(request.hasCoolingSystem()))
                .build();

        SwineBarn saved = swineBarnRepository.save(barn);
        return SwineBarnResponse.fromEntity(saved);
    }

    public List<SwineBarnResponse> getBarnsByFarm(UUID farmId, UUID ownerId) {
        farmService.findFarmEntity(farmId, ownerId);
        return swineBarnRepository.findByFarmIdOrderByCodeNameAsc(farmId).stream()
                .map(SwineBarnResponse::fromEntity)
                .toList();
    }

    @Transactional
    public SwinePenResponse createPen(CreateSwinePenRequest request, UUID ownerId) {
        log.info("Creando corral porcícola '{}' en galpón ID {}", request.penCode(), request.barnId());

        SwineBarn barn = findBarnEntity(request.barnId());
        farmService.findFarmEntity(barn.getFarm().getId(), ownerId);

        String code = request.penCode().trim();
        if (swinePenRepository.existsByBarnIdAndPenCodeIgnoreCase(barn.getId(), code)) {
            throw new DuplicateResourceException("Corral Porcícola", "código", code);
        }

        String phase = request.phase() != null ? request.phase().trim().toLowerCase(Locale.ROOT) : "ceba";
        BigDecimal density = determineDensityByPhase(phase);

        BigDecimal area = request.lengthM().multiply(request.widthM()).setScale(2, RoundingMode.HALF_UP);
        int maxCapacity = Math.max(1, area.divide(density, 0, RoundingMode.FLOOR).intValue());

        SwinePen pen = SwinePen.builder()
                .barn(barn)
                .penCode(code)
                .phase(phase)
                .lengthM(request.lengthM())
                .widthM(request.widthM())
                .drinkerType(request.drinkerType() != null ? request.drinkerType().trim().toLowerCase(Locale.ROOT) : "nipple")
                .drinkerCount(request.drinkerCount() != null ? request.drinkerCount() : 2)
                .feederSpaces(request.feederSpaces() != null ? request.feederSpaces() : 4)
                .maxDensityM2PerPig(density)
                .maxCapacityPigs(maxCapacity)
                .build();

        SwinePen saved = swinePenRepository.save(pen);
        return SwinePenResponse.fromEntity(saved);
    }

    public List<SwinePenResponse> getPensByBarn(UUID barnId, UUID ownerId) {
        SwineBarn barn = findBarnEntity(barnId);
        farmService.findFarmEntity(barn.getFarm().getId(), ownerId);

        return swinePenRepository.findByBarnIdOrderByPenCodeAsc(barnId).stream()
                .map(SwinePenResponse::fromEntity)
                .toList();
    }

    public SwineBarn findBarnEntity(UUID barnId) {
        return swineBarnRepository.findById(barnId)
                .orElseThrow(() -> new ResourceNotFoundException("Galpón Porcícola", barnId));
    }

    public SwinePen findPenEntity(UUID penId) {
        return swinePenRepository.findById(penId)
                .orElseThrow(() -> new ResourceNotFoundException("Corral Porcícola", penId));
    }

    private BigDecimal determineDensityByPhase(String phase) {
        return switch (phase) {
            case "precebo" -> new BigDecimal("0.35"); // 0.35 m2 por lechón
            case "levante" -> new BigDecimal("0.65"); // 0.65 m2 por cerdo
            case "maternidad" -> new BigDecimal("4.50"); // 4.5 m2 por cerda con lechones
            case "gestacion" -> new BigDecimal("2.25"); // 2.25 m2 por cerda gestante
            default -> new BigDecimal("1.00"); // 1.0 m2 por cerdo en ceba/finalización
        };
    }
}
