package com.swiggy.foodapp.dtos.superadmin;

import com.swiggy.foodapp.entities.BusinessSector;
import com.swiggy.foodapp.entities.RestaurantStatus;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Map;

public class SuperAdminDTOs {

    // --- 1. Executive Platform Cockpit ---
    public static class PlatformCockpitDTO {
        private BigDecimal platformGmv;
        private BigDecimal platformCommissionRevenue;
        private long totalRestaurants;
        private long activeRestaurants;
        private long totalCustomers;
        private long totalRiders;
        private long totalOrders;
        private long activeOrders;
        private long deliveredOrders;
        private long openDisputes;
        private BigDecimal totalRefundsIssued;
        private BigDecimal totalSettlementsPaid;
        private Map<String, Long> ordersByCity;
        private Map<String, Long> ordersBySector;
        private Map<String, BigDecimal> revenueBySector;
        private long ordersLast60Mins;

        public BigDecimal getPlatformGmv() { return platformGmv; }
        public void setPlatformGmv(BigDecimal platformGmv) { this.platformGmv = platformGmv; }
        public BigDecimal getPlatformCommissionRevenue() { return platformCommissionRevenue; }
        public void setPlatformCommissionRevenue(BigDecimal platformCommissionRevenue) { this.platformCommissionRevenue = platformCommissionRevenue; }
        public long getTotalRestaurants() { return totalRestaurants; }
        public void setTotalRestaurants(long totalRestaurants) { this.totalRestaurants = totalRestaurants; }
        public long getActiveRestaurants() { return activeRestaurants; }
        public void setActiveRestaurants(long activeRestaurants) { this.activeRestaurants = activeRestaurants; }
        public long getTotalCustomers() { return totalCustomers; }
        public void setTotalCustomers(long totalCustomers) { this.totalCustomers = totalCustomers; }
        public long getTotalRiders() { return totalRiders; }
        public void setTotalRiders(long totalRiders) { this.totalRiders = totalRiders; }
        public long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
        public long getActiveOrders() { return activeOrders; }
        public void setActiveOrders(long activeOrders) { this.activeOrders = activeOrders; }
        public long getDeliveredOrders() { return deliveredOrders; }
        public void setDeliveredOrders(long deliveredOrders) { this.deliveredOrders = deliveredOrders; }
        public long getOpenDisputes() { return openDisputes; }
        public void setOpenDisputes(long openDisputes) { this.openDisputes = openDisputes; }
        public BigDecimal getTotalRefundsIssued() { return totalRefundsIssued; }
        public void setTotalRefundsIssued(BigDecimal totalRefundsIssued) { this.totalRefundsIssued = totalRefundsIssued; }
        public BigDecimal getTotalSettlementsPaid() { return totalSettlementsPaid; }
        public void setTotalSettlementsPaid(BigDecimal totalSettlementsPaid) { this.totalSettlementsPaid = totalSettlementsPaid; }
        public Map<String, Long> getOrdersByCity() { return ordersByCity; }
        public void setOrdersByCity(Map<String, Long> ordersByCity) { this.ordersByCity = ordersByCity; }
        public Map<String, Long> getOrdersBySector() { return ordersBySector; }
        public void setOrdersBySector(Map<String, Long> ordersBySector) { this.ordersBySector = ordersBySector; }
        public Map<String, BigDecimal> getRevenueBySector() { return revenueBySector; }
        public void setRevenueBySector(Map<String, BigDecimal> revenueBySector) { this.revenueBySector = revenueBySector; }
        public long getOrdersLast60Mins() { return ordersLast60Mins; }
        public void setOrdersLast60Mins(long ordersLast60Mins) { this.ordersLast60Mins = ordersLast60Mins; }
    }

    // --- 2. Restaurant 360 Details DTO ---
    public static class RestaurantDetailSuperAdminDTO {
        private Long id;
        private String name;
        private String slug;
        private BusinessSector businessSector;
        private RestaurantStatus status;
        private String email;
        private String phone;
        private String address;
        private String city;
        private BigDecimal commissionRate;
        private String stripeAccountId;
        private String fssaiNumber;
        private String gstin;
        private String panNumber;
        private String bankAccountNumber;
        private String bankIfscCode;
        private Double avgRating;
        private long totalOrders;
        private BigDecimal lifetimeSales;
        private int branchCount;
        private int staffCount;
        private LocalDateTime createdAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getSlug() { return slug; }
        public void setSlug(String slug) { this.slug = slug; }
        public BusinessSector getBusinessSector() { return businessSector; }
        public void setBusinessSector(BusinessSector businessSector) { this.businessSector = businessSector; }
        public RestaurantStatus getStatus() { return status; }
        public void setStatus(RestaurantStatus status) { this.status = status; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public BigDecimal getCommissionRate() { return commissionRate; }
        public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }
        public String getStripeAccountId() { return stripeAccountId; }
        public void setStripeAccountId(String stripeAccountId) { this.stripeAccountId = stripeAccountId; }
        public String getFssaiNumber() { return fssaiNumber; }
        public void setFssaiNumber(String fssaiNumber) { this.fssaiNumber = fssaiNumber; }
        public String getGstin() { return gstin; }
        public void setGstin(String gstin) { this.gstin = gstin; }
        public String getPanNumber() { return panNumber; }
        public void setPanNumber(String panNumber) { this.panNumber = panNumber; }
        public String getBankAccountNumber() { return bankAccountNumber; }
        public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }
        public String getBankIfscCode() { return bankIfscCode; }
        public void setBankIfscCode(String bankIfscCode) { this.bankIfscCode = bankIfscCode; }
        public Double getAvgRating() { return avgRating; }
        public void setAvgRating(Double avgRating) { this.avgRating = avgRating; }
        public long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
        public BigDecimal getLifetimeSales() { return lifetimeSales; }
        public void setLifetimeSales(BigDecimal lifetimeSales) { this.lifetimeSales = lifetimeSales; }
        public int getBranchCount() { return branchCount; }
        public void setBranchCount(int branchCount) { this.branchCount = branchCount; }
        public int getStaffCount() { return staffCount; }
        public void setStaffCount(int staffCount) { this.staffCount = staffCount; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
    }

    // --- 3. Payment Refund Request ---
    public static class RefundExecutionRequest {
        private BigDecimal amount;
        private String reason;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // --- 4. Settlement Payout Request ---
    public static class PayoutExecutionRequest {
        private String provider; // STRIPE, MANUAL_BANK, RAZORPAY_X
        private String utrNumber;
        private String notes;

        public String getProvider() { return provider; }
        public void setProvider(String provider) { this.provider = provider; }
        public String getUtrNumber() { return utrNumber; }
        public void setUtrNumber(String utrNumber) { this.utrNumber = utrNumber; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    // --- 5. Customer Overview & Wallet DTOs ---
    public static class CustomerAdminDTO {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private boolean isBlocked;
        private BigDecimal walletBalance;
        private Integer loyaltyPoints;
        private long totalOrders;
        private BigDecimal totalSpent;
        private LocalDateTime joinedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public boolean isBlocked() { return isBlocked; }
        public void setBlocked(boolean blocked) { isBlocked = blocked; }
        public BigDecimal getWalletBalance() { return walletBalance; }
        public void setWalletBalance(BigDecimal walletBalance) { this.walletBalance = walletBalance; }
        public Integer getLoyaltyPoints() { return loyaltyPoints; }
        public void setLoyaltyPoints(Integer loyaltyPoints) { this.loyaltyPoints = loyaltyPoints; }
        public long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
        public BigDecimal getTotalSpent() { return totalSpent; }
        public void setTotalSpent(BigDecimal totalSpent) { this.totalSpent = totalSpent; }
        public LocalDateTime getJoinedAt() { return joinedAt; }
        public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    }

    public static class WalletAdjustmentRequest {
        private BigDecimal amount; // positive to credit, negative to debit
        private String reason;

        public BigDecimal getAmount() { return amount; }
        public void setAmount(BigDecimal amount) { this.amount = amount; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    // --- 6. Delivery Rider DTO ---
    public static class RiderAdminDTO {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private boolean isBlocked;
        private long lifetimeDeliveries;
        private BigDecimal totalEarnings;
        private String currentActiveOrderId;
        private LocalDateTime joinedAt;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public boolean isBlocked() { return isBlocked; }
        public void setBlocked(boolean blocked) { isBlocked = blocked; }
        public long getLifetimeDeliveries() { return lifetimeDeliveries; }
        public void setLifetimeDeliveries(long lifetimeDeliveries) { this.lifetimeDeliveries = lifetimeDeliveries; }
        public BigDecimal getTotalEarnings() { return totalEarnings; }
        public void setTotalEarnings(BigDecimal totalEarnings) { this.totalEarnings = totalEarnings; }
        public String getCurrentActiveOrderId() { return currentActiveOrderId; }
        public void setCurrentActiveOrderId(String currentActiveOrderId) { this.currentActiveOrderId = currentActiveOrderId; }
        public LocalDateTime getJoinedAt() { return joinedAt; }
        public void setJoinedAt(LocalDateTime joinedAt) { this.joinedAt = joinedAt; }
    }

    // --- 7. Support Ticket DTOs ---
    public static class TicketReplyRequest {
        private String message;
        private String newStatus; // IN_PROGRESS, RESOLVED, CLOSED

        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getNewStatus() { return newStatus; }
        public void setNewStatus(String newStatus) { this.newStatus = newStatus; }
    }

    // --- 8. Notification Broadcast Request ---
    public static class BroadcastNotificationRequest {
        private String title;
        private String message;
        private String targetAudience = "ALL"; // ALL, CUSTOMERS, RESTAURANT_PARTNERS, RIDERS
        private BusinessSector sector;
        private String actionUrl;

        public String getTitle() { return title; }
        public void setTitle(String title) { this.title = title; }
        public String getMessage() { return message; }
        public void setMessage(String message) { this.message = message; }
        public String getTargetAudience() { return targetAudience; }
        public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }
        public BusinessSector getSector() { return sector; }
        public void setSector(BusinessSector sector) { this.sector = sector; }
        public String getActionUrl() { return actionUrl; }
        public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }
    }

    // --- 9. Financial Report DTO ---
    public static class FinanceReportDTO {
        private BigDecimal totalGrossMerchandiseValue;
        private BigDecimal platformCommissionEarned;
        private BigDecimal totalTaxCollected;
        private BigDecimal totalDeliveryFeesCollected;
        private BigDecimal totalPackagingFeesCollected;
        private BigDecimal totalRefundsIssued;
        private BigDecimal netPlatformEarnings;
        private Map<String, BigDecimal> gmvBySector;
        private long totalTransactions;
        private long successfulTransactions;
        private long refundedTransactions;

        public BigDecimal getTotalGrossMerchandiseValue() { return totalGrossMerchandiseValue; }
        public void setTotalGrossMerchandiseValue(BigDecimal totalGrossMerchandiseValue) { this.totalGrossMerchandiseValue = totalGrossMerchandiseValue; }
        public BigDecimal getPlatformCommissionEarned() { return platformCommissionEarned; }
        public void setPlatformCommissionEarned(BigDecimal platformCommissionEarned) { this.platformCommissionEarned = platformCommissionEarned; }
        public BigDecimal getTotalTaxCollected() { return totalTaxCollected; }
        public void setTotalTaxCollected(BigDecimal totalTaxCollected) { this.totalTaxCollected = totalTaxCollected; }
        public BigDecimal getTotalDeliveryFeesCollected() { return totalDeliveryFeesCollected; }
        public void setTotalDeliveryFeesCollected(BigDecimal totalDeliveryFeesCollected) { this.totalDeliveryFeesCollected = totalDeliveryFeesCollected; }
        public BigDecimal getTotalPackagingFeesCollected() { return totalPackagingFeesCollected; }
        public void setTotalPackagingFeesCollected(BigDecimal totalPackagingFeesCollected) { this.totalPackagingFeesCollected = totalPackagingFeesCollected; }
        public BigDecimal getTotalRefundsIssued() { return totalRefundsIssued; }
        public void setTotalRefundsIssued(BigDecimal totalRefundsIssued) { this.totalRefundsIssued = totalRefundsIssued; }
        public BigDecimal getNetPlatformEarnings() { return netPlatformEarnings; }
        public void setNetPlatformEarnings(BigDecimal netPlatformEarnings) { this.netPlatformEarnings = netPlatformEarnings; }
        public Map<String, BigDecimal> getGmvBySector() { return gmvBySector; }
        public void setGmvBySector(Map<String, BigDecimal> gmvBySector) { this.gmvBySector = gmvBySector; }
        public long getTotalTransactions() { return totalTransactions; }
        public void setTotalTransactions(long totalTransactions) { this.totalTransactions = totalTransactions; }
        public long getSuccessfulTransactions() { return successfulTransactions; }
        public void setSuccessfulTransactions(long successfulTransactions) { this.successfulTransactions = successfulTransactions; }
        public long getRefundedTransactions() { return refundedTransactions; }
        public void setRefundedTransactions(long refundedTransactions) { this.refundedTransactions = refundedTransactions; }
    }

    // --- 10. Existing Requests Preserved ---
    public static class DisputeResolutionRequest {
        private boolean approved;
        private BigDecimal refundAmount;
        private String adminNotes;

        public boolean isApproved() { return approved; }
        public void setApproved(boolean approved) { this.approved = approved; }
        public BigDecimal getRefundAmount() { return refundAmount; }
        public void setRefundAmount(BigDecimal refundAmount) { this.refundAmount = refundAmount; }
        public String getAdminNotes() { return adminNotes; }
        public void setAdminNotes(String adminNotes) { this.adminNotes = adminNotes; }
    }

    public static class SurgePricingUpdateRequest {
        private Boolean rainSurgeActive;
        private BigDecimal rainSurgeMultiplier;
        private Boolean nightSurgeActive;
        private BigDecimal nightSurgeMultiplier;

        public Boolean getRainSurgeActive() { return rainSurgeActive; }
        public void setRainSurgeActive(Boolean rainSurgeActive) { this.rainSurgeActive = rainSurgeActive; }
        public BigDecimal getRainSurgeMultiplier() { return rainSurgeMultiplier; }
        public void setRainSurgeMultiplier(BigDecimal rainSurgeMultiplier) { this.rainSurgeMultiplier = rainSurgeMultiplier; }
        public Boolean getNightSurgeActive() { return nightSurgeActive; }
        public void setNightSurgeActive(Boolean nightSurgeActive) { this.nightSurgeActive = nightSurgeActive; }
        public BigDecimal getNightSurgeMultiplier() { return nightSurgeMultiplier; }
        public void setNightSurgeMultiplier(BigDecimal nightSurgeMultiplier) { this.nightSurgeMultiplier = nightSurgeMultiplier; }
    }

    public static class SystemConfigUpdateRequest {
        private BigDecimal defaultCommissionRate;
        private Boolean maintenanceMode;
        private String maintenanceMessage;
        private String globalAnnouncementBanner;
        private Boolean bannerActive;
        private String supportPhone;
        private String supportEmail;

        public BigDecimal getDefaultCommissionRate() { return defaultCommissionRate; }
        public void setDefaultCommissionRate(BigDecimal defaultCommissionRate) { this.defaultCommissionRate = defaultCommissionRate; }
        public Boolean getMaintenanceMode() { return maintenanceMode; }
        public void setMaintenanceMode(Boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }
        public String getMaintenanceMessage() { return maintenanceMessage; }
        public void setMaintenanceMessage(String maintenanceMessage) { this.maintenanceMessage = maintenanceMessage; }
        public String getGlobalAnnouncementBanner() { return globalAnnouncementBanner; }
        public void setGlobalAnnouncementBanner(String globalAnnouncementBanner) { this.globalAnnouncementBanner = globalAnnouncementBanner; }
        public Boolean getBannerActive() { return bannerActive; }
        public void setBannerActive(Boolean bannerActive) { this.bannerActive = bannerActive; }
        public String getSupportPhone() { return supportPhone; }
        public void setSupportPhone(String supportPhone) { this.supportPhone = supportPhone; }
        public String getSupportEmail() { return supportEmail; }
        public void setSupportEmail(String supportEmail) { this.supportEmail = supportEmail; }
    }
}
