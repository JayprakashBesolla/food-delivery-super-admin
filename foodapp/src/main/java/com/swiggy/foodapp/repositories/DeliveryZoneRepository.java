package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.DeliveryZone;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DeliveryZoneRepository extends JpaRepository<DeliveryZone, Long> {
    List<DeliveryZone> findByCityIgnoreCaseAndIsActiveTrue(String city);
    List<DeliveryZone> findByIsActiveTrue();
}
