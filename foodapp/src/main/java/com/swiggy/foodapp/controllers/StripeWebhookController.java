package com.swiggy.foodapp.controllers;

import com.stripe.model.Event;
import com.stripe.model.PaymentIntent;
import com.stripe.net.Webhook;
import com.swiggy.foodapp.entities.OrderStatus;
import com.swiggy.foodapp.entities.PaymentStatus;
import com.swiggy.foodapp.repositories.OrderRepository;
import com.swiggy.foodapp.repositories.PaymentTransactionRepository;
import com.swiggy.foodapp.services.NotificationService;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/payment/stripe")
public class StripeWebhookController {

    private static final Logger logger = LoggerFactory.getLogger(StripeWebhookController.class);

    @Value("${stripe.webhook_secret:whsec_placeholder}")
    private String webhookSecret;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @PostMapping("/webhook")
    public ResponseEntity<String> handleStripeWebhook(
            @RequestBody String payload,
            @RequestHeader(value = "Stripe-Signature", required = false) String sigHeader) {

        if (webhookSecret == null || webhookSecret.contains("placeholder") || sigHeader == null) {
            logger.info("Stripe Webhook received in test/simulated mode. Payload size: {}", payload.length());
            return ResponseEntity.ok("Received (Simulated Mode)");
        }

        Event event;
        try {
            event = Webhook.constructEvent(payload, sigHeader, webhookSecret);
        } catch (Exception e) {
            logger.error("Stripe webhook signature verification failed: {}", e.getMessage());
            return ResponseEntity.badRequest().body("Webhook verification error: " + e.getMessage());
        }

        switch (event.getType()) {
            case "payment_intent.succeeded":
                handlePaymentIntentSucceeded(event);
                break;
            case "payment_intent.payment_failed":
                handlePaymentIntentFailed(event);
                break;
            default:
                logger.info("Unhandled Stripe webhook event: {}", event.getType());
        }

        return ResponseEntity.ok("Handled");
    }

    private void handlePaymentIntentSucceeded(Event event) {
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof PaymentIntent intent) {
                String intentId = intent.getId();
                paymentTransactionRepository.findByTransactionReference(intentId).ifPresent(tx -> {
                    tx.setStatus("SUCCESS");
                    paymentTransactionRepository.save(tx);

                    if (tx.getOrder() != null) {
                        tx.getOrder().setPaymentStatus(PaymentStatus.COMPLETED);
                        tx.getOrder().setStatus(OrderStatus.ACCEPTED);
                        orderRepository.save(tx.getOrder());

                        notificationService.sendOrderUpdate(
                                tx.getOrder().getOrderId(),
                                OrderStatus.ACCEPTED.name(),
                                "Stripe payment succeeded! Order confirmed.",
                                25
                        );
                    }
                });
            }
        });
    }

    private void handlePaymentIntentFailed(Event event) {
        event.getDataObjectDeserializer().getObject().ifPresent(obj -> {
            if (obj instanceof PaymentIntent intent) {
                String intentId = intent.getId();
                paymentTransactionRepository.findByTransactionReference(intentId).ifPresent(tx -> {
                    tx.setStatus("FAILED");
                    tx.setFailureReason("Stripe payment_intent.payment_failed event received");
                    paymentTransactionRepository.save(tx);

                    if (tx.getOrder() != null) {
                        tx.getOrder().setPaymentStatus(PaymentStatus.FAILED);
                        orderRepository.save(tx.getOrder());
                    }
                });
            }
        });
    }
}
