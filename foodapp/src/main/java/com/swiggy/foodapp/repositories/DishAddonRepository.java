package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.DishAddon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishAddonRepository extends JpaRepository<DishAddon, Long> {
    List<DishAddon> findByDish_Id(Long dishId);
}
