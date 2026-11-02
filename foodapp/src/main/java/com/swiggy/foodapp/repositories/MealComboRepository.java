package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.MealCombo;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface MealComboRepository extends JpaRepository<MealCombo, Long> {
    List<MealCombo> findByRestaurant_IdAndIsActiveTrue(Long restaurantId);
}
