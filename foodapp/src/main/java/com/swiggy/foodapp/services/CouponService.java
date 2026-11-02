package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.Coupon;
import com.swiggy.foodapp.entities.CouponUsage;
import com.swiggy.foodapp.entities.Restaurant;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.repositories.CouponRepository;
import com.swiggy.foodapp.repositories.CouponUsageRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.Map;
import java.util.Optional;

@Service
public class CouponService {

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private CouponUsageRepository couponUsageRepository;

    public Map<String, Object> validateAndCalculateDiscount(String code, User user, Restaurant restaurant, BigDecimal itemTotal) {
        if (code == null || code.trim().isEmpty()) {
            return Map.of("valid", false, "message", "Coupon code is empty", "discount", BigDecimal.ZERO);
        }

        Optional<Coupon> couponOpt = couponRepository.findByCodeIgnoreCaseAndIsActiveTrue(code.trim());
        if (couponOpt.isEmpty()) {
            return Map.of("valid", false, "message", "Invalid or expired coupon code", "discount", BigDecimal.ZERO);
        }

        Coupon coupon = couponOpt.get();

        if (coupon.getValidUntil() != null && coupon.getValidUntil().isBefore(LocalDate.now())) {
            return Map.of("valid", false, "message", "This coupon has expired", "discount", BigDecimal.ZERO);
        }

        if (coupon.getRestaurant() != null && restaurant != null &&
                !coupon.getRestaurant().getId().equals(restaurant.getId())) {
            return Map.of("valid", false, "message", "Coupon only valid at " + coupon.getRestaurant().getName(), "discount", BigDecimal.ZERO);
        }

        if (itemTotal.compareTo(coupon.getMinOrderAmount()) < 0) {
            return Map.of("valid", false,
                    "message", "Add ₹" + coupon.getMinOrderAmount().subtract(itemTotal) + " more to apply this coupon (Min order: ₹" + coupon.getMinOrderAmount() + ")",
                    "discount", BigDecimal.ZERO);
        }

        if (user != null) {
            long userUsage = couponUsageRepository.countByCoupon_IdAndUser_Id(coupon.getId(), user.getId());
            if (coupon.getUsageLimitPerUser() != null && userUsage >= coupon.getUsageLimitPerUser()) {
                return Map.of("valid", false, "message", "You have already reached the maximum usage limit for this coupon", "discount", BigDecimal.ZERO);
            }
        }

        long totalUsage = couponUsageRepository.countByCoupon_Id(coupon.getId());
        if (coupon.getTotalUsageLimit() != null && totalUsage >= coupon.getTotalUsageLimit()) {
            return Map.of("valid", false, "message", "Coupon maximum usage limit has been reached across the platform", "discount", BigDecimal.ZERO);
        }

        BigDecimal discount = BigDecimal.ZERO;
        if (coupon.getFlatDiscountAmount() != null && coupon.getFlatDiscountAmount().compareTo(BigDecimal.ZERO) > 0) {
            discount = coupon.getFlatDiscountAmount();
        } else if (coupon.getDiscountPercentage() != null) {
            BigDecimal calculated = itemTotal.multiply(coupon.getDiscountPercentage()).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            if (coupon.getMaxDiscountAmount() != null && calculated.compareTo(coupon.getMaxDiscountAmount()) > 0) {
                discount = coupon.getMaxDiscountAmount();
            } else {
                discount = calculated;
            }
        }

        return Map.of(
                "valid", true,
                "coupon", coupon,
                "discount", discount,
                "message", "Coupon '" + coupon.getCode() + "' applied! You saved ₹" + discount
        );
    }

    @Transactional
    public void recordCouponUsage(Coupon coupon, User user, String orderId, BigDecimal discountAmount) {
        CouponUsage usage = new CouponUsage(coupon, user, orderId, discountAmount);
        couponUsageRepository.save(usage);
    }
}
