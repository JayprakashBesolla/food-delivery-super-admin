package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.order.OrderDTOs.*;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.services.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    @Autowired
    private OrderService orderService;

    @PostMapping("/place")
    public ResponseEntity<?> placeOrder(@AuthenticationPrincipal User user, @RequestBody PlaceOrderRequest req) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            OrderResponseDTO response = orderService.placeOrder(user, req);
            return ResponseEntity.status(HttpStatus.CREATED).body(response);
        } catch (IllegalStateException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR).body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/user")
    public ResponseEntity<?> getUserOrders(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(orderService.getUserOrders(user));
    }

    @GetMapping("/{orderId}")
    public ResponseEntity<?> getOrderById(@AuthenticationPrincipal User user, @PathVariable String orderId) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            return ResponseEntity.ok(orderService.getOrderById(orderId, user));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @PostMapping("/{orderId}/cancel")
    public ResponseEntity<?> cancelOrder(
            @AuthenticationPrincipal User user,
            @PathVariable String orderId,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            String reason = body.getOrDefault("reason", "Changed my mind");
            String result = orderService.requestCancelOrder(orderId, reason, user);
            return ResponseEntity.ok(Map.of("message", result));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/{orderId}/dispute")
    public ResponseEntity<?> raiseDispute(
            @AuthenticationPrincipal User user,
            @PathVariable String orderId,
            @RequestBody Map<String, String> body) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            String reason = body.get("reason");
            String details = body.get("details");
            String evidenceImageUrl = body.get("evidenceImageUrl");
            return ResponseEntity.status(HttpStatus.CREATED).body(
                    orderService.raiseDispute(orderId, reason, details, evidenceImageUrl, user)
            );
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
