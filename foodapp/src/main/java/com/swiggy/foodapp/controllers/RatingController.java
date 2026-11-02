package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ratings")
public class RatingController {

    @Autowired
    private RatingRepository ratingRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DishRepository dishRepository;

    public static class RatingSubmitRequest {
        private Long restaurantId;
        private Long dishId;
        private String orderId;
        private Integer score;
        private String review;

        public Long getRestaurantId() { return restaurantId; }
        public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
        public Long getDishId() { return dishId; }
        public void setDishId(Long dishId) { this.dishId = dishId; }
        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public Integer getScore() { return score; }
        public void setScore(Integer score) { this.score = score; }
        public String getReview() { return review; }
        public void setReview(String review) { this.review = review; }
    }

    @PostMapping
    public ResponseEntity<?> submitRating(@AuthenticationPrincipal User user, @RequestBody RatingSubmitRequest req) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        if (req.getScore() == null || req.getScore() < 1 || req.getScore() > 5) {
            return ResponseEntity.badRequest().body(Map.of("error", "Rating score must be between 1 and 5"));
        }

        Rating rating = new Rating();
        rating.setUser(user);
        rating.setScore(req.getScore());
        rating.setReview(req.getReview());
        rating.setOrderId(req.getOrderId());

        if (req.getRestaurantId() != null) {
            Restaurant r = restaurantRepository.findById(req.getRestaurantId()).orElse(null);
            if (r != null) {
                rating.setRestaurant(r);
                // Update average rating
                double newAvg = (r.getAvgRating() * r.getTotalRatings() + req.getScore()) / (r.getTotalRatings() + 1);
                r.setAvgRating(Math.round(newAvg * 10.0) / 10.0);
                r.setTotalRatings(r.getTotalRatings() + 1);
                restaurantRepository.save(r);
            }
        }

        if (req.getDishId() != null) {
            dishRepository.findById(req.getDishId()).ifPresent(rating::setDish);
        }

        Rating saved = ratingRepository.save(rating);
        return ResponseEntity.ok(saved);
    }

    @GetMapping("/restaurant/{restaurantId}")
    public ResponseEntity<List<Rating>> getRestaurantRatings(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(ratingRepository.findByRestaurant_IdOrderByCreatedAtDesc(restaurantId));
    }
}
