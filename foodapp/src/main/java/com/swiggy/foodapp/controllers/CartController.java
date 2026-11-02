package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.cart.CartDTOs.*;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.exceptions.RestaurantConflictException;
import com.swiggy.foodapp.services.CartService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/cart")
public class CartController {

    @Autowired
    private CartService cartService;

    @GetMapping
    public ResponseEntity<?> getCart(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(cartService.getCartResponse(user));
    }

    @PostMapping("/add")
    public ResponseEntity<?> addToCart(@AuthenticationPrincipal User user, @RequestBody AddToCartRequest req) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            CartResponseDTO response = cartService.addToCart(user, req);
            return ResponseEntity.ok(response);
        } catch (RestaurantConflictException e) {
            return ResponseEntity.status(HttpStatus.CONFLICT).body(Map.of(
                    "conflict", true,
                    "message", e.getMessage(),
                    "existingRestaurantId", e.getExistingRestaurantId(),
                    "existingRestaurantName", e.getExistingRestaurantName(),
                    "newRestaurantId", e.getNewRestaurantId(),
                    "newRestaurantName", e.getNewRestaurantName()
            ));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PutMapping("/items/{itemId}")
    public ResponseEntity<?> updateItemQuantity(
            @AuthenticationPrincipal User user,
            @PathVariable Long itemId,
            @RequestBody UpdateCartItemRequest req) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            return ResponseEntity.ok(cartService.updateItemQuantity(user, itemId, req.getQuantity()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/items/{itemId}")
    public ResponseEntity<?> removeItem(@AuthenticationPrincipal User user, @PathVariable Long itemId) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        try {
            return ResponseEntity.ok(cartService.updateItemQuantity(user, itemId, 0));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @DeleteMapping("/clear")
    public ResponseEntity<?> clearCart(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(cartService.clearCart(user));
    }
}
