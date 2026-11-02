package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.order.OrderDTOs.OrderResponseDTO;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.services.RiderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/rider")
public class RiderController {

    @Autowired
    private RiderService riderService;

    @GetMapping("/available-orders")
    public ResponseEntity<?> getAvailableOrders() {
        return ResponseEntity.ok(riderService.getAvailableOrders());
    }

    @PostMapping("/orders/{orderId}/accept")
    public ResponseEntity<?> acceptDelivery(
            @AuthenticationPrincipal User rider,
            @PathVariable String orderId) {
        if (rider == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            OrderResponseDTO dto = riderService.acceptDelivery(rider, orderId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    public static class LocationUpdateRequest {
        private Double latitude;
        private Double longitude;

        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
    }

    @PostMapping("/orders/{orderId}/location")
    public ResponseEntity<?> updateLocation(
            @AuthenticationPrincipal User rider,
            @PathVariable String orderId,
            @RequestBody LocationUpdateRequest req) {
        if (rider == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            riderService.updateLiveLocation(rider, orderId, req.getLatitude(), req.getLongitude());
            return ResponseEntity.ok(Map.of("status", "broadcasted"));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/orders/{orderId}/delivered")
    public ResponseEntity<?> markDelivered(
            @AuthenticationPrincipal User rider,
            @PathVariable String orderId) {
        if (rider == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            OrderResponseDTO dto = riderService.markDelivered(rider, orderId);
            return ResponseEntity.ok(dto);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
