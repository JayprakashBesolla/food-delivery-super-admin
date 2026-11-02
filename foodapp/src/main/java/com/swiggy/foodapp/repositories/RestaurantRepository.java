package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.Restaurant;
import com.swiggy.foodapp.entities.RestaurantStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface RestaurantRepository extends JpaRepository<Restaurant, Long> {
    Optional<Restaurant> findBySlug(String slug);
    List<Restaurant> findByStatus(RestaurantStatus status);
    long countByStatus(RestaurantStatus status);

    @Query("SELECT r FROM Restaurant r WHERE r.status = 'ACTIVE' AND (" +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.cuisines) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.area) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Restaurant> searchRestaurants(@Param("query") String query);

    List<Restaurant> findByCityIgnoreCaseAndStatus(String city, RestaurantStatus status);

    List<Restaurant> findByBusinessSectorAndStatus(com.swiggy.foodapp.entities.BusinessSector businessSector, RestaurantStatus status);

    List<Restaurant> findByCityIgnoreCaseAndBusinessSectorAndStatus(String city, com.swiggy.foodapp.entities.BusinessSector businessSector, RestaurantStatus status);

    long countByBusinessSector(com.swiggy.foodapp.entities.BusinessSector businessSector);

    long countByBusinessSectorAndStatus(com.swiggy.foodapp.entities.BusinessSector businessSector, RestaurantStatus status);

    @Query("SELECT r FROM Restaurant r WHERE r.status = 'ACTIVE' AND r.businessSector = :sector AND (" +
           "LOWER(r.name) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.cuisines) LIKE LOWER(CONCAT('%', :query, '%')) OR " +
           "LOWER(r.area) LIKE LOWER(CONCAT('%', :query, '%')))")
    List<Restaurant> searchRestaurantsBySector(@Param("query") String query, @Param("sector") com.swiggy.foodapp.entities.BusinessSector sector);
}
