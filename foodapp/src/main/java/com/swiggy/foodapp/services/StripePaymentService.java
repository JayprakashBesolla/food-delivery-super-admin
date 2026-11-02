package com.swiggy.foodapp.services;

import com.stripe.Stripe;
import com.stripe.model.PaymentIntent;
import com.stripe.model.Refund;
import com.stripe.model.Transfer;
import com.stripe.param.PaymentIntentCreateParams;
import com.stripe.param.RefundCreateParams;
import com.stripe.param.TransferCreateParams;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.Map;

@Service
public class StripePaymentService {

    private static final Logger logger = LoggerFactory.getLogger(StripePaymentService.class);

    @Value("${stripe.api_key:sk_test_placeholder}")
    private String stripeApiKey;

    @Value("${stripe.currency:usd}")
    private String defaultCurrency;

    public Map<String, Object> createPaymentIntent(String orderId, BigDecimal amount, String currency) {
        String curr = (currency != null && !currency.trim().isEmpty()) ? currency.toLowerCase() : defaultCurrency;
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        if (stripeApiKey == null || stripeApiKey.contains("placeholder")) {
            // Simulated development mode
            String simulatedId = "pi_sim_" + System.currentTimeMillis();
            String simulatedClientSecret = simulatedId + "_secret_mock";
            logger.info("Stripe test simulation: created PaymentIntent {} for order {}", simulatedId, orderId);
            return Map.of(
                    "paymentIntentId", simulatedId,
                    "clientSecret", simulatedClientSecret,
                    "amount", amount,
                    "currency", curr,
                    "mode", "SIMULATED"
            );
        }

        try {
            Stripe.apiKey = stripeApiKey;
            PaymentIntentCreateParams params = PaymentIntentCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(curr)
                    .putMetadata("orderId", orderId)
                    .setAutomaticPaymentMethods(
                            PaymentIntentCreateParams.AutomaticPaymentMethods.builder().setEnabled(true).build()
                    )
                    .build();

            PaymentIntent intent = PaymentIntent.create(params);
            return Map.of(
                    "paymentIntentId", intent.getId(),
                    "clientSecret", intent.getClientSecret(),
                    "amount", amount,
                    "currency", curr,
                    "mode", "LIVE_STRIPE"
            );
        } catch (Exception e) {
            logger.error("Stripe PaymentIntent creation failed: {}", e.getMessage());
            throw new RuntimeException("Stripe error: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> processRefund(String paymentIntentOrChargeId, BigDecimal amount, String reason) {
        long amountInCents = (amount != null) ? amount.multiply(BigDecimal.valueOf(100)).longValue() : 0L;

        if (stripeApiKey == null || stripeApiKey.contains("placeholder") || paymentIntentOrChargeId.startsWith("pi_sim_")) {
            String simulatedRefundId = "re_sim_" + System.currentTimeMillis();
            logger.info("Stripe test simulation: refunded {} for intent {}", simulatedRefundId, paymentIntentOrChargeId);
            return Map.of(
                    "refundId", simulatedRefundId,
                    "status", "succeeded",
                    "amount", amount != null ? amount : BigDecimal.ZERO,
                    "mode", "SIMULATED"
            );
        }

        try {
            Stripe.apiKey = stripeApiKey;
            RefundCreateParams.Builder builder = RefundCreateParams.builder()
                    .setPaymentIntent(paymentIntentOrChargeId);
            if (amountInCents > 0) {
                builder.setAmount(amountInCents);
            }
            if (reason != null) {
                builder.putMetadata("reason", reason);
            }

            Refund refund = Refund.create(builder.build());
            return Map.of(
                    "refundId", refund.getId(),
                    "status", refund.getStatus(),
                    "amount", BigDecimal.valueOf(refund.getAmount()).divide(BigDecimal.valueOf(100)),
                    "mode", "LIVE_STRIPE"
            );
        } catch (Exception e) {
            logger.error("Stripe refund failed: {}", e.getMessage());
            throw new RuntimeException("Stripe refund error: " + e.getMessage(), e);
        }
    }

    public Map<String, Object> transferPayout(String destinationStripeAccountId, BigDecimal amount, String currency, String description) {
        String curr = (currency != null && !currency.trim().isEmpty()) ? currency.toLowerCase() : defaultCurrency;
        long amountInCents = amount.multiply(BigDecimal.valueOf(100)).longValue();

        if (stripeApiKey == null || stripeApiKey.contains("placeholder") || destinationStripeAccountId == null || destinationStripeAccountId.contains("placeholder")) {
            String simulatedTransferId = "tr_sim_" + System.currentTimeMillis();
            logger.info("Stripe test simulation: transferred {} to connected account {}", simulatedTransferId, destinationStripeAccountId);
            return Map.of(
                    "transferId", simulatedTransferId,
                    "destination", destinationStripeAccountId != null ? destinationStripeAccountId : "acct_sim_merchant",
                    "amount", amount,
                    "currency", curr,
                    "status", "PAID",
                    "mode", "SIMULATED"
            );
        }

        try {
            Stripe.apiKey = stripeApiKey;
            TransferCreateParams params = TransferCreateParams.builder()
                    .setAmount(amountInCents)
                    .setCurrency(curr)
                    .setDestination(destinationStripeAccountId)
                    .setDescription(description != null ? description : "Merchant Settlement Payout")
                    .build();

            Transfer transfer = Transfer.create(params);
            return Map.of(
                    "transferId", transfer.getId(),
                    "destination", transfer.getDestination(),
                    "amount", BigDecimal.valueOf(transfer.getAmount()).divide(BigDecimal.valueOf(100)),
                    "currency", transfer.getCurrency(),
                    "status", "PAID",
                    "mode", "LIVE_STRIPE"
            );
        } catch (Exception e) {
            logger.error("Stripe Connect transfer failed: {}", e.getMessage());
            throw new RuntimeException("Stripe payout error: " + e.getMessage(), e);
        }
    }
}
