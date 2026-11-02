package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.DishVariant;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishVariantRepository extends JpaRepository<DishVariant, Long> {
    List<DishVariant> findByDish_Id(Long dishId);
}
