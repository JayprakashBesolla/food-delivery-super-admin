package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.entities.LoyaltyAccount;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.services.LoyaltyService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/loyalty")
public class LoyaltyController {

    @Autowired
    private LoyaltyService loyaltyService;

    @GetMapping("/balance")
    public ResponseEntity<?> getBalance(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        LoyaltyAccount account = loyaltyService.getOrCreateAccount(user);
        return ResponseEntity.ok(Map.of(
                "pointsBalance", account.getPointsBalance(),
                "lifetimeEarned", account.getLifetimeEarned(),
                "lifetimeRedeemed", account.getLifetimeRedeemed(),
                "rupeeEquivalent", account.getPointsBalance()
        ));
    }
}
