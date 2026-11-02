package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.restaurant.RestaurantDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @GetMapping("/stats")
    public ResponseEntity<?> getPlatformOverview() {
        long totalRestaurants = restaurantRepository.count();
        long totalUsers = userRepository.count();
        long totalOrders = orderRepository.count();

        List<Order> orders = orderRepository.findAll();
        BigDecimal platformGmv = BigDecimal.ZERO;
        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.DELIVERED) {
                platformGmv = platformGmv.add(o.getTotalAmount());
            }
        }

        return ResponseEntity.ok(Map.of(
                "totalRestaurants", totalRestaurants,
                "totalUsers", totalUsers,
                "totalOrders", totalOrders,
                "platformGMV", platformGmv
        ));
    }

    @GetMapping("/restaurants")
    public ResponseEntity<List<Restaurant>> getAllRestaurants() {
        return ResponseEntity.ok(restaurantRepository.findAll());
    }

    @PostMapping("/restaurants")
    public ResponseEntity<?> createRestaurant(@RequestBody CreateRestaurantRequest req) {
        Restaurant r = new Restaurant();
        r.setName(req.getName());
        r.setSlug(req.getName().toLowerCase().replaceAll("[^a-z0-9]", "-") + "-" + System.currentTimeMillis() % 10000);
        r.setDescription(req.getDescription());
        r.setCuisines(req.getCuisines());
        r.setPhone(req.getPhone());
        r.setEmail(req.getEmail());
        r.setAddress(req.getAddress());
        r.setArea(req.getArea() != null ? req.getArea() : "City Center");
        r.setCity(req.getCity() != null ? req.getCity() : "Hyderabad");
        r.setPincode(req.getPincode());
        r.setCostForTwo(req.getCostForTwo() != null ? req.getCostForTwo() : BigDecimal.valueOf(350.0));
        r.setPureVeg(req.isPureVeg());
        r.setStatus(RestaurantStatus.ACTIVE);
        r.setCreatedAt(LocalDateTime.now());

        Restaurant saved = restaurantRepository.save(r);
        return ResponseEntity.status(HttpStatus.CREATED).body(RestaurantDetailDTO.fromEntity(saved));
    }

    @PatchMapping("/restaurants/{id}/status")
    public ResponseEntity<?> updateRestaurantStatus(
            @PathVariable Long id,
            @RequestParam RestaurantStatus status) {
        Restaurant r = restaurantRepository.findById(id).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();

        r.setStatus(status);
        restaurantRepository.save(r);
        return ResponseEntity.ok(Map.of("message", "Restaurant status updated to " + status));
    }

    // --- Admin KYC Review ---
    @Autowired
    private com.swiggy.foodapp.repositories.MerchantKycRepository merchantKycRepository;

    @GetMapping("/kyc/pending")
    public ResponseEntity<?> getPendingKyc() {
        return ResponseEntity.ok(merchantKycRepository.findAll());
    }

    @PatchMapping("/kyc/{kycId}/verify")
    public ResponseEntity<?> verifyKyc(
            @PathVariable Long kycId,
            @RequestParam boolean approved,
            @RequestParam(required = false) String reason) {
        MerchantKycRecord kyc = merchantKycRepository.findById(kycId).orElse(null);
        if (kyc == null) return ResponseEntity.notFound().build();

        if (approved) {
            kyc.setStatus("VERIFIED");
            kyc.setVerifiedAt(LocalDateTime.now());
            kyc.getRestaurant().setStatus(RestaurantStatus.ACTIVE);
            restaurantRepository.save(kyc.getRestaurant());
        } else {
            kyc.setStatus("REJECTED");
            kyc.setRejectionReason(reason);
        }

        return ResponseEntity.ok(merchantKycRepository.save(kyc));
    }

    // --- Admin Settlements Calculation & Payout ---
    @Autowired
    private com.swiggy.foodapp.services.SettlementService settlementService;

    @Autowired
    private com.swiggy.foodapp.repositories.SettlementRepository settlementRepository;

    @PostMapping("/settlements/calculate/{restaurantId}")
    public ResponseEntity<?> calculateSettlement(
            @PathVariable Long restaurantId,
            @RequestParam(required = false, defaultValue = "15.0") BigDecimal commissionPercentage) {
        try {
            return ResponseEntity.ok(settlementService.calculateSettlement(restaurantId, commissionPercentage));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/settlements/{restaurantId}")
    public ResponseEntity<?> getSettlements(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(settlementRepository.findByRestaurant_IdOrderByProcessedAtDesc(restaurantId));
    }

    @PatchMapping("/settlements/{settlementId}/pay")
    public ResponseEntity<?> markSettlementPaid(
            @PathVariable Long settlementId,
            @RequestParam String utrNumber) {
        try {
            return ResponseEntity.ok(settlementService.markPaid(settlementId, utrNumber));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
