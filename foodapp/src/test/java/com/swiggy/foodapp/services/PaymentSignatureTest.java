package com.swiggy.foodapp.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;

import static org.junit.jupiter.api.Assertions.*;

public class PaymentSignatureTest {

    private String calculateHmacSha256(String data, String secret) throws Exception {
        SecretKeySpec secretKeySpec = new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        Mac mac = Mac.getInstance("HmacSHA256");
        mac.init(secretKeySpec);
        byte[] rawHmac = mac.doFinal(data.getBytes(StandardCharsets.UTF_8));
        StringBuilder hexString = new StringBuilder();
        for (byte b : rawHmac) {
            String hex = Integer.toHexString(0xff & b);
            if (hex.length() == 1) hexString.append('0');
            hexString.append(hex);
        }
        return hexString.toString();
    }

    @Test
    @DisplayName("Should correctly calculate Razorpay HMAC-SHA256 signature")
    public void testHmacSha256Signature() throws Exception {
        String orderId = "order_DBJOWzybf0sJbb";
        String paymentId = "pay_29Ae07HAeyFtfc";
        String secret = "EnLsTekSampleSecretKey123";

        String payload = orderId + "|" + paymentId;
        String signature = calculateHmacSha256(payload, secret);

        assertNotNull(signature);
        assertEquals(64, signature.length(), "HMAC-SHA256 hex string must be 64 characters");

        // Verify repeatability
        String signature2 = calculateHmacSha256(payload, secret);
        assertEquals(signature, signature2);
    }

    @Test
    @DisplayName("Should detect tampered payment ID or fraudulent signature")
    public void testTamperedSignature() throws Exception {
        String orderId = "order_DBJOWzybf0sJbb";
        String legitimatePaymentId = "pay_29Ae07HAeyFtfc";
        String fraudulentPaymentId = "pay_HACKED9999999";
        String secret = "EnLsTekSampleSecretKey123";

        String legitSignature = calculateHmacSha256(orderId + "|" + legitimatePaymentId, secret);
        String fraudSignature = calculateHmacSha256(orderId + "|" + fraudulentPaymentId, secret);

        assertNotEquals(legitSignature, fraudSignature, "Signature must differ for different payment payloads");
    }
}

