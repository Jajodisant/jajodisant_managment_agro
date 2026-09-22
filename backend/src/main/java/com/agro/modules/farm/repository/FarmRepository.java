package com.agro.modules.farm.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.agro.modules.farm.domain.Farm;

/**
 * Repositorio Spring Data JPA para la entidad Farm (Granja).
 * Gestiona el acceso a datos y el aislamiento por usuario propietario (ownerId).
 */
@Repository
public interface FarmRepository extends JpaRepository<Farm, UUID> {

    /**
     * Recupera todas las granjas que pertenecen a un usuario específico.
     * Garantiza el aislamiento de datos (tenancy lógico).
     *
     * @param ownerId Identificador UUID del usuario autenticado.
     * @return Lista de granjas asociadas al productor.
     */
    List<Farm> findByOwnerId(UUID ownerId);

    /**
     * Busca una granja por su ID asegurando que pertenezca al usuario indicado.
     * Previene accesos no autorizados mediante manipulación de IDs (IDOR).
     *
     * @param id Identificador UUID de la granja.
     * @param ownerId Identificador UUID del usuario autenticado.
     * @return Optional con la granja si existe y pertenece al usuario.
     */
    Optional<Farm> findByIdAndOwnerId(UUID id, UUID ownerId);

    /**
     * Verifica la existencia de una granja ligada a un propietario.
     *
     * @param id Identificador UUID de la granja.
     * @param ownerId Identificador UUID del usuario autenticado.
     * @return true si la granja existe y pertenece al usuario, false en caso contrario.
     */
    boolean existsByIdAndOwnerId(UUID id, UUID ownerId);
}
