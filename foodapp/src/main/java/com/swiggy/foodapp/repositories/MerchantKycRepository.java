package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.MerchantKycRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface MerchantKycRepository extends JpaRepository<MerchantKycRecord, Long> {
    Optional<MerchantKycRecord> findByRestaurant_Id(Long restaurantId);
    java.util.List<MerchantKycRecord> findByRestaurant_IdOrderBySubmittedAtDesc(Long restaurantId);
    java.util.List<MerchantKycRecord> findByStatus(String status);
}
