package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.RestaurantStaff;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RestaurantStaffRepository extends JpaRepository<RestaurantStaff, Long> {
    List<RestaurantStaff> findByRestaurant_Id(Long restaurantId);
    List<RestaurantStaff> findByRestaurant_IdAndIsActiveTrue(Long restaurantId);
}
