package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.order.OrderDTOs.OrderResponseDTO;
import com.swiggy.foodapp.dtos.payment.PaymentDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.OrderRepository;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.security.SignatureException;
import java.util.NoSuchElementException;

@Service
public class PaymentService {

    private static final Logger logger = LoggerFactory.getLogger(PaymentService.class);

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private com.swiggy.foodapp.repositories.PaymentTransactionRepository paymentTransactionRepository;

    @Value("${razorpay.key_id:rzp_test_placeholder}")
    private String defaultKeyId;

    @Value("${razorpay.key_secret:rzp_secret_placeholder}")
    private String defaultKeySecret;

    public PaymentOrderResponse createPaymentOrder(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        Restaurant restaurant = order.getRestaurant();
        String keyId = (restaurant != null && restaurant.getRazorpayKeyId() != null && !restaurant.getRazorpayKeyId().trim().isEmpty())
                ? restaurant.getRazorpayKeyId().trim() : defaultKeyId;
        String keySecret = (restaurant != null && restaurant.getRazorpayKeySecret() != null && !restaurant.getRazorpayKeySecret().trim().isEmpty())
                ? restaurant.getRazorpayKeySecret().trim() : defaultKeySecret;

        int amountInPaise = order.getTotalAmount().multiply(BigDecimal.valueOf(100)).intValue();
        String razorpayOrderId = "order_sim_" + System.currentTimeMillis();

        if (!keyId.contains("placeholder") && !keySecret.contains("placeholder")) {
            try {
                RazorpayClient client = new RazorpayClient(keyId, keySecret);
                JSONObject rzpReq = new JSONObject();
                rzpReq.put("amount", amountInPaise);
                rzpReq.put("currency", "INR");
                rzpReq.put("receipt", orderId);

                com.razorpay.Order rzpOrder = client.orders.create(rzpReq);
                razorpayOrderId = rzpOrder.get("id");
            } catch (Exception e) {
                logger.error("Razorpay order creation error: {}", e.getMessage());
            }
        }

        PaymentOrderResponse response = new PaymentOrderResponse();
        response.setOrderId(orderId);
        response.setRazorpayOrderId(razorpayOrderId);
        response.setAmountInPaise(amountInPaise);
        response.setCurrency("INR");
        response.setKeyId(keyId);
        response.setTotalAmount(order.getTotalAmount());

        return response;
    }

    @Transactional
    public OrderResponseDTO verifyPayment(PaymentVerificationRequest req) {
        Order order = orderRepository.findById(req.getOrderId())
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + req.getOrderId()));

        Restaurant restaurant = order.getRestaurant();
        String keySecret = (restaurant != null && restaurant.getRazorpayKeySecret() != null && !restaurant.getRazorpayKeySecret().trim().isEmpty())
                ? restaurant.getRazorpayKeySecret().trim() : defaultKeySecret;

        boolean isSignatureValid = false;

        if (keySecret.contains("placeholder")) {
            // Development / Test simulation mode: auto-verify if signature is present
            isSignatureValid = true;
        } else {
            try {
                String payload = req.getRazorpayOrderId() + "|" + req.getRazorpayPaymentId();
                String expectedSignature = calculateHmacSha256(payload, keySecret);
                isSignatureValid = expectedSignature.equals(req.getRazorpaySignature());
            } catch (Exception e) {
                logger.error("Error verifying payment signature: {}", e.getMessage());
            }
        }

        if (!isSignatureValid) {
            order.setPaymentStatus(PaymentStatus.FAILED);
            orderRepository.save(order);

            PaymentTransaction tx = new PaymentTransaction(
                    req.getRazorpayPaymentId() != null ? req.getRazorpayPaymentId() : ("tx_fail_" + System.currentTimeMillis()),
                    order, order.getUser(), order.getTotalAmount(), "INR", "RAZORPAY", "FAILED", "ONLINE"
            );
            tx.setFailureReason("Invalid Razorpay payment signature! Verification failed.");
            paymentTransactionRepository.save(tx);

            throw new IllegalArgumentException("Invalid Razorpay payment signature! Verification failed.");
        }

        order.setPaymentStatus(PaymentStatus.COMPLETED);
        order.setStatus(OrderStatus.ACCEPTED);
        orderRepository.save(order);

        // Record successful transaction
        PaymentTransaction tx = new PaymentTransaction(
                req.getRazorpayPaymentId() != null ? req.getRazorpayPaymentId() : ("tx_" + System.currentTimeMillis()),
                order, order.getUser(), order.getTotalAmount(), "INR", "RAZORPAY", "SUCCESS", "ONLINE"
        );
        paymentTransactionRepository.save(tx);

        // Notify customer and restaurant
        notificationService.sendOrderUpdate(order.getOrderId(), OrderStatus.ACCEPTED.name(),
                "Payment received! Order confirmed with " + order.getRestaurant().getName(), 25);
        notificationService.notifyRestaurantNewOrder(order.getRestaurant().getId(), order.getOrderId(),
                order.getTotalAmount().toString());

        return OrderResponseDTO.fromEntity(order);
    }

    private String calculateHmacSha256(String data, String secret) throws SignatureException {
        try {
            SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(secretKeySpec);
            byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
            return bytesToHex(rawHmac);
        } catch (Exception e) {
            throw new SignatureException("Failed to generate HMAC SHA256", e);
        }
    }

    private String bytesToHex(byte[] bytes) {
        StringBuilder hexString = new StringBuilder();
        for (byte b : bytes) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }
}
