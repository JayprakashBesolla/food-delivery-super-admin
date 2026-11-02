package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.Coupon;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CouponRepository extends JpaRepository<Coupon, Long> {
    Optional<Coupon> findByCodeIgnoreCaseAndIsActiveTrue(String code);

    @Query("SELECT c FROM Coupon c WHERE c.isActive = true AND (c.restaurant IS NULL OR c.restaurant.id = :restaurantId)")
    List<Coupon> findAvailableCouponsForRestaurant(@Param("restaurantId") Long restaurantId);

    List<Coupon> findByIsActiveTrue();
}
