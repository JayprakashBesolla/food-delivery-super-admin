package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.OrderDispute;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderDisputeRepository extends JpaRepository<OrderDispute, Long> {
    List<OrderDispute> findByStatus(String status);
    List<OrderDispute> findByRestaurant_IdOrderByCreatedAtDesc(Long restaurantId);
    List<OrderDispute> findByUser_IdOrderByCreatedAtDesc(Long userId);
}
