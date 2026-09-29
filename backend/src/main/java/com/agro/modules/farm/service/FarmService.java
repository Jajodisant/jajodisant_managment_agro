package com.agro.modules.farm.service;

import java.util.List;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.agro.common.exception.ResourceNotFoundException;
import com.agro.modules.farm.domain.Farm;
import com.agro.modules.farm.dto.CreateFarmRequest;
import com.agro.modules.farm.dto.FarmResponse;
import com.agro.modules.farm.dto.UpdateFarmRequest;
import com.agro.modules.farm.repository.FarmRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

/**
 * Servicio de aplicación para la gestión de Granjas (Unidades Productivas Raíz).
 * Garantiza el aislamiento multitenancy lógico mediante la validación obligatoria de ownerId.
 */
@Slf4j
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class FarmService {

    private final FarmRepository farmRepository;

    /**
     * Registra una nueva granja asociada al usuario autenticado.
     *
     * @param request Datos de creación de la granja.
     * @param ownerId Identificador del usuario propietario.
     * @return DTO con la información de la granja creada.
     */
    @Transactional
    public FarmResponse createFarm(CreateFarmRequest request, UUID ownerId) {
        log.info("Creando granja '{}' para el propietario {}", request.name(), ownerId);

        Farm farm = Farm.builder()
                .name(request.name().trim())
                .ownerId(ownerId)
                .location(request.location() != null ? request.location().trim() : null)
                .build();

        Farm saved = farmRepository.save(farm);
        log.info("Granja '{}' creada exitosamente con ID {}", saved.getName(), saved.getId());
        return FarmResponse.fromEntity(saved);
    }

    /**
     * Recupera todas las granjas que pertenecen a un usuario propietario.
     *
     * @param ownerId Identificador del usuario.
     * @return Lista de granjas del usuario.
     */
    public List<FarmResponse> getFarmsByOwner(UUID ownerId) {
        log.debug("Consultando granjas para el propietario {}", ownerId);
        return farmRepository.findByOwnerId(ownerId).stream()
                .map(FarmResponse::fromEntity)
                .toList();
    }

    /**
     * Obtiene una granja por su ID verificando la propiedad del usuario.
     *
     * @param farmId  Identificador único de la granja.
     * @param ownerId Identificador del usuario propietario.
     * @return DTO consolidado de la granja.
     * @throws ResourceNotFoundException si la granja no existe o no pertenece al usuario.
     */
    public FarmResponse getFarmById(UUID farmId, UUID ownerId) {
        Farm farm = findFarmEntity(farmId, ownerId);
        return FarmResponse.fromEntity(farm);
    }

    /**
     * Actualiza el nombre y ubicación de una granja existente.
     *
     * @param farmId  Identificador único de la granja.
     * @param ownerId Identificador del usuario propietario.
     * @param request Datos de actualización.
     * @return DTO de la granja actualizada.
     */
    @Transactional
    public FarmResponse updateFarm(UUID farmId, UUID ownerId, UpdateFarmRequest request) {
        log.info("Actualizando granja ID {} por propietario {}", farmId, ownerId);
        Farm farm = findFarmEntity(farmId, ownerId);

        farm.setName(request.name().trim());
        farm.setLocation(request.location() != null ? request.location().trim() : null);

        Farm updated = farmRepository.save(farm);
        return FarmResponse.fromEntity(updated);
    }

    /**
     * Elimina una granja y en cascada todos sus estanques asociados.
     *
     * @param farmId  Identificador de la granja.
     * @param ownerId Identificador del usuario propietario.
     */
    @Transactional
    public void deleteFarm(UUID farmId, UUID ownerId) {
        log.warn("Eliminando granja ID {} y sus componentes asociados", farmId);
        Farm farm = findFarmEntity(farmId, ownerId);
        farmRepository.delete(farm);
    }

    /**
     * Método auxiliar interno para buscar la entidad asegurando la propiedad del usuario.
     *
     * @param farmId  ID de la granja.
     * @param ownerId ID del propietario.
     * @return Entidad {@link Farm}.
     * @throws ResourceNotFoundException si no existe o no coincide el propietario.
     */
    public Farm findFarmEntity(UUID farmId, UUID ownerId) {
        return farmRepository.findByIdAndOwnerId(farmId, ownerId)
                .orElseThrow(() -> new ResourceNotFoundException("Granja", farmId));
    }
}
