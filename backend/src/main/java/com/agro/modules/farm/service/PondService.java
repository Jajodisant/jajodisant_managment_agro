package com.agro.modules.farm.service;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.common.exception.DuplicateResourceException;
import com.agro.common.exception.ResourceNotFoundException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.domain.Pond;
import com.agro.modules.farm.dto.CreatePondRequest;
import com.agro.modules.farm.dto.PondResponse;
import com.agro.modules.farm.dto.UpdatePondRequest;
import com.agro.modules.farm.repository.PondRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de lógica de negocio para la gestión y parametrización de Estanques (Pond).
 * Implementa las reglas zootécnicas de la Historia de Usuario HU-01:
 * - Escenario 1: Cálculo de volumen hidráulico útil (m³).
 * - Escenario 2: Asignación y sugerencia de densidad zootécnica límite según presencia de aireación mecánica.
 * - Validación de unicidad de código de estanque dentro de la misma granja.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class PondService {

    /**
     * Densidad zootécnica sugerida por defecto para estanques con aireación mecánica (10.00 kg/m³).
     */
    public static final BigDecimal AERATED_MAX_DENSITY_KG_M3 = new BigDecimal("10.00");

    /**
     * Densidad zootécnica sugerida por defecto para estanques convencionales sin aireación mecánica (3.00 kg/m³).
     */
    public static final BigDecimal NON_AERATED_MAX_DENSITY_KG_M3 = new BigDecimal("3.00");

    private final PondRepository pondRepository;
    private final FarmService farmService;

    /**
     * Registra un nuevo estanque en una granja cumpliendo HU-01.
     *
     * @param farmId  Identificador único de la granja contenedora.
     * @param ownerId Identificador del usuario propietario.
     * @param request Datos técnicos y dimensionales del estanque.
     * @return DTO consolidado con volumen y capacidad máxima de biomasa calculada.
     */
    @Transactional
    public PondResponse createPond(UUID farmId, UUID ownerId, CreatePondRequest request) {
        log.info("Creando estanque '{}' para la granja ID {}", request.codeName(), farmId);

        // 1. Validar existencia y propiedad de la granja
        Farm farm = farmService.findFarmEntity(farmId, ownerId);

        // 2. Validar que el código del estanque no esté duplicado en esta granja
        String trimmedCode = request.codeName().trim();
        if (pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, trimmedCode)) {
            throw new DuplicateResourceException("Estanque", "código", trimmedCode);
        }

        // 3. Aplicar regla de negocio HU-01 (Escenario 2): Densidad sugerida según aireación si no se especificó
        BigDecimal effectiveDensity = request.maxDensityKgM3();
        if (effectiveDensity == null) {
            effectiveDensity = request.hasAeration() ? AERATED_MAX_DENSITY_KG_M3 : NON_AERATED_MAX_DENSITY_KG_M3;
            log.debug("Densidad no provista. Asignando valor técnico sugerido: {} kg/m³ (aireación={})",
                    effectiveDensity, request.hasAeration());
        }

        // 4. Tipo de estanque por defecto si no viene indicado
        String pondType = (request.pondType() != null && !request.pondType().isBlank())
                ? request.pondType().trim().toLowerCase()
                : "earthen";

        Pond pond = Pond.builder()
                .farm(farm)
                .codeName(trimmedCode)
                .pondType(pondType)
                .lengthM(request.lengthM())
                .widthM(request.widthM())
                .avgDepthM(request.avgDepthM())
                .hasAeration(request.hasAeration())
                .maxDensityKgM3(effectiveDensity)
                .isActive(true)
                .build();

        Pond saved = pondRepository.save(pond);
        log.info("Estanque '{}' guardado con éxito. ID: {}", saved.getCodeName(), saved.getId());
        return PondResponse.fromEntity(saved);
    }

    /**
     * Consulta los estanques registrados en una granja, con opción de filtrar solo los activos.
     *
     * @param farmId     Identificador de la granja.
     * @param ownerId    Identificador del propietario.
     * @param onlyActive Si es true, retorna únicamente estanques operativos en producción.
     * @return Lista de estanques parametrizados.
     */
    public List<PondResponse> getPondsByFarm(UUID farmId, UUID ownerId, Boolean onlyActive) {
        log.debug("Consultando estanques de la granja {} (onlyActive={})", farmId, onlyActive);
        farmService.findFarmEntity(farmId, ownerId); // Asegura existencia y pertenencia

        List<Pond> ponds = Boolean.TRUE.equals(onlyActive)
                ? pondRepository.findByFarmIdAndIsActiveTrue(farmId)
                : pondRepository.findByFarmId(farmId);

        return ponds.stream()
                .map(PondResponse::fromEntity)
                .toList();
    }

    /**
     * Obtiene el detalle técnico y aforo de un estanque específico.
     *
     * @param farmId  Identificador de la granja.
     * @param pondId  Identificador del estanque.
     * @param ownerId Identificador del usuario propietario.
     * @return DTO consolidado con métricas calculadas.
     */
    public PondResponse getPondById(UUID farmId, UUID pondId, UUID ownerId) {
        farmService.findFarmEntity(farmId, ownerId);
        Pond pond = findPondEntity(farmId, pondId);
        return PondResponse.fromEntity(pond);
    }

    /**
     * Actualiza la infraestructura y parámetros de aforo de un estanque.
     *
     * @param farmId  Identificador de la granja.
     * @param pondId  Identificador del estanque a modificar.
     * @param ownerId Identificador del usuario propietario.
     * @param request Nuevos parámetros dimensionales y de densidad.
     * @return DTO del estanque actualizado con recálculo de volumen y biomasa máxima.
     */
    @Transactional
    public PondResponse updatePond(UUID farmId, UUID pondId, UUID ownerId, UpdatePondRequest request) {
        log.info("Actualizando estanque ID {} de la granja {}", pondId, farmId);
        farmService.findFarmEntity(farmId, ownerId);
        Pond pond = findPondEntity(farmId, pondId);

        String newCode = request.codeName().trim();
        // Validar unicidad si el código cambia
        if (!pond.getCodeName().equalsIgnoreCase(newCode)
                && pondRepository.existsByFarmIdAndCodeNameIgnoreCase(farmId, newCode)) {
            throw new DuplicateResourceException("Estanque", "código", newCode);
        }

        pond.setCodeName(newCode);
        if (request.pondType() != null && !request.pondType().isBlank()) {
            pond.setPondType(request.pondType().trim().toLowerCase());
        }
        pond.setLengthM(request.lengthM());
        pond.setWidthM(request.widthM());
        pond.setAvgDepthM(request.avgDepthM());
        pond.setHasAeration(request.hasAeration());
        pond.setMaxDensityKgM3(request.maxDensityKgM3());
        pond.setActive(request.isActive());

        Pond updated = pondRepository.save(pond);
        return PondResponse.fromEntity(updated);
    }

    /**
     * Elimina un estanque de la granja.
     *
     * @param farmId  Identificador de la granja.
     * @param pondId  Identificador del estanque.
     * @param ownerId Identificador del usuario propietario.
     */
    @Transactional
    public void deletePond(UUID farmId, UUID pondId, UUID ownerId) {
        log.warn("Eliminando estanque ID {} de la granja {}", pondId, farmId);
        farmService.findFarmEntity(farmId, ownerId);
        Pond pond = findPondEntity(farmId, pondId);
        pondRepository.delete(pond);
    }

    /**
     * Búsqueda interna de estanque validando correspondencia con su granja.
     *
     * @param farmId ID de la granja.
     * @param pondId ID del estanque.
     * @return Entidad {@link Pond}.
     * @throws ResourceNotFoundException si el estanque no existe en dicha granja.
     */
    public Pond findPondEntity(UUID farmId, UUID pondId) {
        return pondRepository.findByIdAndFarmId(pondId, farmId)
                .orElseThrow(() -> new ResourceNotFoundException("Estanque", pondId));
    }
}
