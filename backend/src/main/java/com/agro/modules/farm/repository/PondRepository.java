package com.agro.modules.farm.repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.agro.modules.farm.domain.Pond;

/**
 * Repositorio Spring Data JPA para la entidad Pond (Estanque / Unidad de Cultivo).
 * Maneja consultas operativas de campo y validaciones de unicidad de infraestructura.
 */
@Repository
public interface PondRepository extends JpaRepository<Pond, UUID> {

    /**
     * Obtiene todos los estanques asociados a una granja (activos e inactivos).
     * Utilizado para vistas administrativas y configuración de infraestructura.
     *
     * @param farmId Identificador UUID de la granja.
     * @return Lista de todos los estanques de la granja.
     */
    List<Pond> findByFarmId(UUID farmId);

    /**
     * Obtiene únicamente los estanques operativos de una granja.
     * Excluye estanques en mantenimiento, secado o encalado sanitario.
     *
     * @param farmId Identificador UUID de la granja.
     * @return Lista de estanques activos disponibles para cultivo.
     */
    List<Pond> findByFarmIdAndIsActiveTrue(UUID farmId);

    /**
     * Busca un estanque específico asegurando que pertenezca a la granja indicada.
     *
     * @param id Identificador UUID del estanque.
     * @param farmId Identificador UUID de la granja.
     * @return Optional con el estanque si existe y pertenece a la granja.
     */
    Optional<Pond> findByIdAndFarmId(UUID id, UUID farmId);

    /**
     * Valida si ya existe un estanque con el mismo nombre o código en la granja,
     * ignorando mayúsculas y minúsculas (ej: 't-01' vs 'T-01').
     *
     * @param farmId Identificador UUID de la granja.
     * @param codeName Código o nombre del estanque a verificar.
     * @return true si ya existe un estanque con ese código en la granja.
     */
    boolean existsByFarmIdAndCodeNameIgnoreCase(UUID farmId, String codeName);
}
