package com.swiggy.foodapp.dtos.payment;

import java.math.BigDecimal;

public class PaymentDTOs {

    public static class PaymentVerificationRequest {
        private String orderId;
        private String razorpayOrderId;
        private String razorpayPaymentId;
        private String razorpaySignature;

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
        public String getRazorpayPaymentId() { return razorpayPaymentId; }
        public void setRazorpayPaymentId(String razorpayPaymentId) { this.razorpayPaymentId = razorpayPaymentId; }
        public String getRazorpaySignature() { return razorpaySignature; }
        public void setRazorpaySignature(String razorpaySignature) { this.razorpaySignature = razorpaySignature; }
    }

    public static class PaymentOrderResponse {
        private String orderId;
        private String razorpayOrderId;
        private Integer amountInPaise;
        private String currency;
        private String keyId;
        private BigDecimal totalAmount;

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public String getRazorpayOrderId() { return razorpayOrderId; }
        public void setRazorpayOrderId(String razorpayOrderId) { this.razorpayOrderId = razorpayOrderId; }
        public Integer getAmountInPaise() { return amountInPaise; }
        public void setAmountInPaise(Integer amountInPaise) { this.amountInPaise = amountInPaise; }
        public String getCurrency() { return currency; }
        public void setCurrency(String currency) { this.currency = currency; }
        public String getKeyId() { return keyId; }
        public void setKeyId(String keyId) { this.keyId = keyId; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
    }
}
