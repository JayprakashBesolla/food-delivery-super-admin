package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.SettlementRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface SettlementRepository extends JpaRepository<SettlementRecord, Long> {
    List<SettlementRecord> findByRestaurant_IdOrderByProcessedAtDesc(Long restaurantId);
    List<SettlementRecord> findByStatus(String status);
    List<SettlementRecord> findByStatusOrderByProcessedAtDesc(String status);
    List<SettlementRecord> findAllByOrderByProcessedAtDesc();
    long countByStatus(String status);
}
