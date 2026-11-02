package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.entities.Coupon;
import com.swiggy.foodapp.repositories.CouponRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/coupons")
public class CouponController {

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private com.swiggy.foodapp.services.CouponService couponService;

    @Autowired
    private com.swiggy.foodapp.repositories.RestaurantRepository restaurantRepository;

    @GetMapping
    public ResponseEntity<List<Coupon>> getAllActiveCoupons() {
        return ResponseEntity.ok(couponRepository.findByIsActiveTrue());
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Coupon>> getCouponsForRestaurant(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(couponRepository.findAvailableCouponsForRestaurant(restaurantId));
    }

    @PostMapping("/validate")
    public ResponseEntity<?> validateCoupon(
            @org.springframework.security.core.annotation.AuthenticationPrincipal com.swiggy.foodapp.entities.User user,
            @RequestParam String code,
            @RequestParam Long restaurantId,
            @RequestParam java.math.BigDecimal itemTotal) {
        com.swiggy.foodapp.entities.Restaurant r = restaurantRepository.findById(restaurantId).orElse(null);
        var result = couponService.validateAndCalculateDiscount(code, user, r, itemTotal);
        return ResponseEntity.ok(result);
    }
}
