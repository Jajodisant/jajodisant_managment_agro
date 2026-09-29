package com.agro.modules.species.repository;

import java.util.Optional;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.agro.modules.species.domain.Species;

/**
 * Repositorio Spring Data JPA para el catálogo zootécnico de Especies (Species).
 */
@Repository
public interface SpeciesRepository extends JpaRepository<Species, UUID> {

    Optional<Species> findByCommonNameIgnoreCase(String commonName);

    boolean existsByCommonNameIgnoreCase(String commonName);
}
