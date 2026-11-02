package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.StoreBranch;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface StoreBranchRepository extends JpaRepository<StoreBranch, Long> {
    List<StoreBranch> findByRestaurant_Id(Long restaurantId);
    List<StoreBranch> findByRestaurant_IdAndIsActiveTrue(Long restaurantId);
}
