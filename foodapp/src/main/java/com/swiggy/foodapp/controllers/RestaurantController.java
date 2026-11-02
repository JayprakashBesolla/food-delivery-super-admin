package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.services.RestaurantService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/restaurants")
public class RestaurantController {

    @Autowired
    private RestaurantService restaurantService;

    @GetMapping
    public ResponseEntity<?> getAllRestaurants(
            @RequestParam(required = false) String city,
            @RequestParam(required = false) String cuisine,
            @RequestParam(required = false) Boolean isVeg,
            @RequestParam(required = false) Double minRating,
            @RequestParam(required = false) String sortBy,
            @RequestParam(required = false) com.swiggy.foodapp.entities.BusinessSector sector) {
        return ResponseEntity.ok(restaurantService.getRestaurants(city, cuisine, isVeg, minRating, sortBy, sector));
    }

    @GetMapping("/{id}")
    public ResponseEntity<?> getRestaurantById(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(restaurantService.getRestaurantById(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/slug/{slug}")
    public ResponseEntity<?> getRestaurantBySlug(@PathVariable String slug) {
        try {
            return ResponseEntity.ok(restaurantService.getRestaurantBySlug(slug));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }

    @GetMapping("/{id}/menu")
    public ResponseEntity<?> getRestaurantMenu(@PathVariable Long id) {
        try {
            return ResponseEntity.ok(restaurantService.getRestaurantMenu(id));
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
