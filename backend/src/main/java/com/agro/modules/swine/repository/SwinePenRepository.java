package com.agro.modules.swine.repository;

import java.util.List;
import java.util.UUID;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import com.agro.modules.swine.domain.SwinePen;

@Repository
public interface SwinePenRepository extends JpaRepository<SwinePen, UUID> {
    List<SwinePen> findByBarnIdOrderByPenCodeAsc(UUID barnId);
    boolean existsByBarnIdAndPenCodeIgnoreCase(UUID barnId, String penCode);
}
