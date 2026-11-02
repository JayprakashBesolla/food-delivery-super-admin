package com.swiggy.foodapp.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "settlement_records")
public class SettlementRecord {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "restaurant_id", nullable = false)
    private Restaurant restaurant;

    private BigDecimal grossSales = BigDecimal.ZERO;
    private BigDecimal platformCommissionPercentage = BigDecimal.valueOf(15.0); // 15% Swiggy commission
    private BigDecimal platformCommissionAmount = BigDecimal.ZERO;
    private BigDecimal taxDeducted = BigDecimal.ZERO; // TDS
    private BigDecimal netPayoutAmount = BigDecimal.ZERO;

    private String status = "PENDING"; // PENDING, PROCESSING, PAID, FAILED
    private String payoutProvider = "MANUAL_BANK"; // STRIPE, MANUAL_BANK, RAZORPAY_X
    private String stripeTransferId; // tr_...
    private String failureReason;
    private String utrNumber;

    private boolean requiresFourEyes = false; // High-value settlements (e.g. >= 50,000) require Maker-Checker
    private String makerEmployeeEmail;
    private String checkerManagerEmail;

    @Version
    private Long version = 0L; // Optimistic locking

    private LocalDateTime processedAt = LocalDateTime.now();
    private LocalDateTime paidAt;

    public SettlementRecord() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Restaurant getRestaurant() { return restaurant; }
    public void setRestaurant(Restaurant restaurant) { this.restaurant = restaurant; }

    public BigDecimal getGrossSales() { return grossSales; }
    public void setGrossSales(BigDecimal grossSales) { this.grossSales = grossSales; }

    public BigDecimal getPlatformCommissionPercentage() { return platformCommissionPercentage; }
    public void setPlatformCommissionPercentage(BigDecimal platformCommissionPercentage) { this.platformCommissionPercentage = platformCommissionPercentage; }

    public BigDecimal getPlatformCommissionAmount() { return platformCommissionAmount; }
    public void setPlatformCommissionAmount(BigDecimal platformCommissionAmount) { this.platformCommissionAmount = platformCommissionAmount; }

    public BigDecimal getTaxDeducted() { return taxDeducted; }
    public void setTaxDeducted(BigDecimal taxDeducted) { this.taxDeducted = taxDeducted; }

    public BigDecimal getNetPayoutAmount() { return netPayoutAmount; }
    public void setNetPayoutAmount(BigDecimal netPayoutAmount) { this.netPayoutAmount = netPayoutAmount; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getPayoutProvider() { return payoutProvider; }
    public void setPayoutProvider(String payoutProvider) { this.payoutProvider = payoutProvider; }

    public String getStripeTransferId() { return stripeTransferId; }
    public void setStripeTransferId(String stripeTransferId) { this.stripeTransferId = stripeTransferId; }

    public String getFailureReason() { return failureReason; }
    public void setFailureReason(String failureReason) { this.failureReason = failureReason; }

    public String getUtrNumber() { return utrNumber; }
    public void setUtrNumber(String utrNumber) { this.utrNumber = utrNumber; }

    public LocalDateTime getProcessedAt() { return processedAt; }
    public void setProcessedAt(LocalDateTime processedAt) { this.processedAt = processedAt; }

    public boolean isRequiresFourEyes() { return requiresFourEyes; }
    public void setRequiresFourEyes(boolean requiresFourEyes) { this.requiresFourEyes = requiresFourEyes; }

    public String getMakerEmployeeEmail() { return makerEmployeeEmail; }
    public void setMakerEmployeeEmail(String makerEmployeeEmail) { this.makerEmployeeEmail = makerEmployeeEmail; }

    public String getCheckerManagerEmail() { return checkerManagerEmail; }
    public void setCheckerManagerEmail(String checkerManagerEmail) { this.checkerManagerEmail = checkerManagerEmail; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public LocalDateTime getPaidAt() { return paidAt; }
    public void setPaidAt(LocalDateTime paidAt) { this.paidAt = paidAt; }
}
