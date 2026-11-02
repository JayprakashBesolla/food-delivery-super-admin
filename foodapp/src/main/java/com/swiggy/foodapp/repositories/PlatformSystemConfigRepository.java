package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.PlatformSystemConfig;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface PlatformSystemConfigRepository extends JpaRepository<PlatformSystemConfig, Long> {
}
