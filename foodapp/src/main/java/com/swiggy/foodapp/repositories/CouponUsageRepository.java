package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.CouponUsage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CouponUsageRepository extends JpaRepository<CouponUsage, Long> {
    long countByCoupon_IdAndUser_Id(Long couponId, Long userId);
    long countByCoupon_Id(Long couponId);
}
