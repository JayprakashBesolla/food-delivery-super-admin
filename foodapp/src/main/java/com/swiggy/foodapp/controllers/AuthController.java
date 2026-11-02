package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.auth.AuthDTOs.*;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.services.AuthService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    @Autowired
    private AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<?> register(@RequestBody RegisterRequest request) {
        try {
            AuthResponse response = authService.register(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/login")
    public ResponseEntity<?> login(@RequestBody LoginRequest request) {
        try {
            AuthResponse response = authService.login(request);
            return ResponseEntity.ok(response);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @GetMapping("/me")
    public ResponseEntity<?> getCurrentUser(@AuthenticationPrincipal User user) {
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "Not authenticated"));
        }
        return ResponseEntity.ok(Map.of(
                "id", user.getId(),
                "name", user.getName(),
                "email", user.getEmail(),
                "phone", user.getPhone(),
                "role", user.getRole()
        ));
    }

    @Autowired
    private com.swiggy.foodapp.services.OtpService otpService;

    @PostMapping("/send-otp")
    public ResponseEntity<?> sendOtp(@RequestBody Map<String, String> body) {
        try {
            String target = body.get("emailOrPhone");
            String otp = otpService.sendOtp(target);
            return ResponseEntity.ok(Map.of("message", "OTP sent successfully", "otp", otp));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-otp")
    public ResponseEntity<?> verifyOtp(@RequestBody Map<String, String> body) {
        String target = body.get("emailOrPhone");
        String otp = body.get("otp");
        boolean valid = otpService.verifyOtp(target, otp);
        if (valid) {
            return ResponseEntity.ok(Map.of("valid", true, "message", "OTP verified"));
        } else {
            return ResponseEntity.badRequest().body(Map.of("valid", false, "error", "Invalid or expired OTP"));
        }
    }

    @PostMapping("/reset-password")
    public ResponseEntity<?> resetPassword(@RequestBody Map<String, String> body) {
        try {
            String target = body.get("emailOrPhone");
            String otp = body.get("otp");
            String newPassword = body.get("newPassword");
            otpService.resetPassword(target, otp, newPassword);
            return ResponseEntity.ok(Map.of("message", "Password reset successfully. You can now login with your new password."));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
