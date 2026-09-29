package com.agro.modules.advisory.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.agro.modules.advisory.domain.VetConsultation;

/**
 * Repositorio JPA para auditoría y consulta de bitácoras clínicas veterinarias (HU-12).
 */
@Repository
public interface VetConsultationRepository extends JpaRepository<VetConsultation, UUID> {

    List<VetConsultation> findByFarmIdOrderByCreatedAtDesc(UUID farmId);

    List<VetConsultation> findByBatchIdOrderByCreatedAtDesc(UUID batchId);
}
