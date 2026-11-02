package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.order.OrderDTOs.OrderResponseDTO;
import com.swiggy.foodapp.dtos.payment.PaymentDTOs.*;
import com.swiggy.foodapp.services.PaymentService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Autowired
    private PaymentService paymentService;

    @PostMapping("/create-order")
    public ResponseEntity<?> createPaymentOrder(@RequestParam String orderId) {
        try {
            PaymentOrderResponse response = paymentService.createPaymentOrder(orderId);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/verify-payment")
    public ResponseEntity<?> verifyPayment(@RequestBody PaymentVerificationRequest req) {
        try {
            OrderResponseDTO verifiedOrder = paymentService.verifyPayment(req);
            return ResponseEntity.ok(verifiedOrder);
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        } catch (Exception e) {
            return ResponseEntity.internalServerError().body(Map.of("error", e.getMessage()));
        }
    }

    @PostMapping("/webhook")
    public ResponseEntity<?> handleRazorpayWebhook(@RequestBody String payload, @RequestHeader(value = "X-Razorpay-Signature", required = false) String signature) {
        // Acknowledge webhook
        return ResponseEntity.ok(Map.of("status", "received"));
    }
}
