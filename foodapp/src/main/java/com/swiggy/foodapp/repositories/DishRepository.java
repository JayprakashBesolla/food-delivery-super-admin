package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.Dish;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DishRepository extends JpaRepository<Dish, Long> {
    List<Dish> findByRestaurant_Id(Long restaurantId);
    List<Dish> findByRestaurant_IdAndCategory_Id(Long restaurantId, Long categoryId);
    List<Dish> findByRestaurant_IdAndIsVegTrue(Long restaurantId);
    List<Dish> findByRestaurant_IdAndIsBestsellerTrue(Long restaurantId);

    @Query("SELECT d FROM Dish d JOIN FETCH d.restaurant r WHERE d.isAvailable = true AND r.status = 'ACTIVE' AND (" +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Dish> searchDishesAcrossRestaurants(@Param("query") String query);

    @Query("SELECT d FROM Dish d JOIN FETCH d.restaurant r WHERE d.isAvailable = true AND r.status = 'ACTIVE' AND r.businessSector = :sector AND (" +
           "LOWER(d.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.description) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(d.brand) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Dish> searchDishesBySector(@Param("query") String query, @Param("sector") com.swiggy.foodapp.entities.BusinessSector sector);
}
