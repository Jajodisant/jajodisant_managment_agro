package com.agro.modules.swine.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.agro.modules.swine.domain.SwineBarn;

@Repository
public interface SwineBarnRepository extends JpaRepository<SwineBarn, UUID> {
    List<SwineBarn> findByFarmIdOrderByCodeNameAsc(UUID farmId);
    boolean existsByFarmIdAndCodeNameIgnoreCase(UUID farmId, String codeName);
}
