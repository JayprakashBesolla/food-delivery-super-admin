package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.superadmin.SuperAdminDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.services.SuperAdminService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
public class SuperAdminController {

    @Autowired
    private SuperAdminService superAdminService;

    private String getAdminEmail(Authentication auth) {
        return auth != null && auth.getName() != null ? auth.getName() : "admin@swiggy.com";
    }

    private String getClientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        return xf != null ? xf.split(",")[0] : req.getRemoteAddr();
    }

    // =========================================================================
    // 1. DASHBOARD
    // =========================================================================
    @GetMapping({"/dashboard", "/cockpit"})
    public ResponseEntity<PlatformCockpitDTO> getPlatformCockpit() {
        return ResponseEntity.ok(superAdminService.getPlatformCockpit());
    }

    // =========================================================================
    // 2. RESTAURANTS
    // =========================================================================
    @GetMapping("/restaurants")
    public ResponseEntity<List<Restaurant>> getAllRestaurants(
            @RequestParam(required = false) RestaurantStatus status) {
        if (status == null) return ResponseEntity.ok(superAdminService.getAllRestaurants());
        if (status == RestaurantStatus.PENDING_APPROVAL) return ResponseEntity.ok(superAdminService.getRestaurantApplications());
        if (status == RestaurantStatus.ACTIVE) return ResponseEntity.ok(superAdminService.getActiveRestaurants());
        if (status == RestaurantStatus.SUSPENDED) return ResponseEntity.ok(superAdminService.getSuspendedRestaurants());
        if (status == RestaurantStatus.REJECTED) return ResponseEntity.ok(superAdminService.getRejectedRestaurants());
        return ResponseEntity.ok(superAdminService.getAllRestaurants());
    }

    @GetMapping("/restaurants/applications")
    public ResponseEntity<List<Restaurant>> getRestaurantApplications() {
        return ResponseEntity.ok(superAdminService.getRestaurantApplications());
    }

    @GetMapping("/restaurants/active")
    public ResponseEntity<List<Restaurant>> getActiveRestaurants() {
        return ResponseEntity.ok(superAdminService.getActiveRestaurants());
    }

    @GetMapping("/restaurants/suspended")
    public ResponseEntity<List<Restaurant>> getSuspendedRestaurants() {
        return ResponseEntity.ok(superAdminService.getSuspendedRestaurants());
    }

    @GetMapping("/restaurants/{id}/details")
    public ResponseEntity<RestaurantDetailSuperAdminDTO> getRestaurant360Details(@PathVariable Long id) {
        return ResponseEntity.ok(superAdminService.getRestaurant360Details(id));
    }

    @PostMapping("/restaurants/{id}/approve")
    public ResponseEntity<Restaurant> approveRestaurant(
            @PathVariable Long id, Authentication auth, HttpServletRequest req) {
        return ResponseEntity.ok(superAdminService.approveRestaurant(id, getAdminEmail(auth), getClientIp(req)));
    }

    public static class ReasonRequest {
        private String reason;
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    @PostMapping("/restaurants/{id}/reject")
    public ResponseEntity<Restaurant> rejectRestaurant(
            @PathVariable Long id, @RequestBody(required = false) ReasonRequest body,
            Authentication auth, HttpServletRequest req) {
        String reason = body != null && body.getReason() != null ? body.getReason() : "Application rejected by Super Admin";
        return ResponseEntity.ok(superAdminService.rejectRestaurant(id, reason, getAdminEmail(auth), getClientIp(req)));
    }

    @PostMapping("/restaurants/{id}/suspend")
    public ResponseEntity<Restaurant> suspendRestaurant(
            @PathVariable Long id, @RequestBody(required = false) ReasonRequest body,
            Authentication auth, HttpServletRequest req) {
        String reason = body != null && body.getReason() != null ? body.getReason() : "Store policy violation";
        return ResponseEntity.ok(superAdminService.suspendRestaurant(id, reason, getAdminEmail(auth), getClientIp(req)));
    }

    @PostMapping("/restaurants/{id}/unsuspend")
    public ResponseEntity<Restaurant> unsuspendRestaurant(
            @PathVariable Long id, Authentication auth, HttpServletRequest req) {
        return ResponseEntity.ok(superAdminService.unsuspendRestaurant(id, getAdminEmail(auth), getClientIp(req)));
    }

    @GetMapping("/restaurants/{id}/documents")
    public ResponseEntity<Map<String, Object>> getRestaurantDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(superAdminService.getRestaurantDocuments(id));
    }

    @GetMapping({"/kyc/pending", "/restaurants/kyc/pending"})
    public ResponseEntity<List<MerchantKycRecord>> getPendingKyc() {
        return ResponseEntity.ok(superAdminService.getPendingKyc());
    }

    public static class KycDecisionRequest {
        private boolean approved;
        private String reason;
        public boolean isApproved() { return approved; }
        public void setApproved(boolean approved) { this.approved = approved; }
        public String getReason() { return reason; }
        public void setReason(String reason) { this.reason = reason; }
    }

    @PatchMapping({"/kyc/{kycId}/decision", "/restaurants/kyc/{kycId}/decision"})
    public ResponseEntity<MerchantKycRecord> reviewKyc(
            @PathVariable Long kycId, @RequestBody KycDecisionRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.reviewKyc(kycId, req.isApproved(), req.getReason(), getAdminEmail(auth), getClientIp(request)));
    }

    // =========================================================================
    // 3. ORDERS
    // =========================================================================
    @GetMapping("/orders")
    public ResponseEntity<List<Order>> getAllOrders(
            @RequestParam(required = false) String sector,
            @RequestParam(required = false) OrderStatus status,
            @RequestParam(required = false) Long restaurantId) {
        return ResponseEntity.ok(superAdminService.getAllOrders(sector, status, restaurantId));
    }

    @GetMapping("/orders/live")
    public ResponseEntity<List<Order>> getLiveOrders() {
        return ResponseEntity.ok(superAdminService.getLiveOrders());
    }

    @GetMapping("/orders/cancelled")
    public ResponseEntity<List<Order>> getCancelledOrders() {
        return ResponseEntity.ok(superAdminService.getCancelledOrders());
    }

    @GetMapping("/orders/failed")
    public ResponseEntity<List<Order>> getFailedOrders() {
        return ResponseEntity.ok(superAdminService.getFailedOrders());
    }

    @GetMapping("/orders/disputes")
    public ResponseEntity<List<OrderDispute>> getOrderDisputes(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(superAdminService.getDisputes(status));
    }

    // =========================================================================
    // 4. PAYMENTS (STRIPE & MULTI-GATEWAY TRANSACTIONS)
    // =========================================================================
    @GetMapping("/payments/transactions")
    public ResponseEntity<List<PaymentTransaction>> getAllTransactions() {
        return ResponseEntity.ok(superAdminService.getAllTransactions());
    }

    @GetMapping("/payments/successful")
    public ResponseEntity<List<PaymentTransaction>> getSuccessfulTransactions() {
        return ResponseEntity.ok(superAdminService.getSuccessfulTransactions());
    }

    @GetMapping("/payments/failed")
    public ResponseEntity<List<PaymentTransaction>> getFailedTransactions() {
        return ResponseEntity.ok(superAdminService.getFailedTransactions());
    }

    @GetMapping("/payments/refunds")
    public ResponseEntity<List<PaymentTransaction>> getRefundedTransactions() {
        return ResponseEntity.ok(superAdminService.getRefundedTransactions());
    }

    @GetMapping("/payments/disputes")
    public ResponseEntity<List<PaymentTransaction>> getPaymentDisputes() {
        return ResponseEntity.ok(superAdminService.getPaymentDisputes());
    }

    @PostMapping("/payments/{transactionId}/refund")
    public ResponseEntity<PaymentTransaction> triggerRefund(
            @PathVariable Long transactionId, @RequestBody RefundExecutionRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.triggerRefund(transactionId, req, getAdminEmail(auth), getClientIp(request)));
    }

    // =========================================================================
    // 5. SETTLEMENTS (STRIPE CONNECT & BANK PAYOUTS)
    // =========================================================================
    @GetMapping("/settlements/pending")
    public ResponseEntity<List<SettlementRecord>> getPendingSettlements() {
        return ResponseEntity.ok(superAdminService.getPendingSettlements());
    }

    @GetMapping("/settlements/processing")
    public ResponseEntity<List<SettlementRecord>> getProcessingSettlements() {
        return ResponseEntity.ok(superAdminService.getProcessingSettlements());
    }

    @GetMapping("/settlements/paid")
    public ResponseEntity<List<SettlementRecord>> getPaidSettlements() {
        return ResponseEntity.ok(superAdminService.getPaidSettlements());
    }

    @GetMapping("/settlements/failed")
    public ResponseEntity<List<SettlementRecord>> getFailedSettlements() {
        return ResponseEntity.ok(superAdminService.getFailedSettlements());
    }

    @GetMapping("/settlements/history")
    public ResponseEntity<List<SettlementRecord>> getSettlementHistory() {
        return ResponseEntity.ok(superAdminService.getSettlementHistory());
    }

    @PostMapping("/settlements/generate-batch")
    public ResponseEntity<List<SettlementRecord>> generateSettlementBatch(
            Authentication auth, HttpServletRequest req) {
        return ResponseEntity.ok(superAdminService.generateSettlementBatch(getAdminEmail(auth), getClientIp(req)));
    }

    @PostMapping({"/settlements/{id}/payout", "/settlements/{id}/pay"})
    public ResponseEntity<SettlementRecord> executePayout(
            @PathVariable Long id, @RequestBody(required = false) PayoutExecutionRequest req,
            Authentication auth, HttpServletRequest request) {
        PayoutExecutionRequest body = req != null ? req : new PayoutExecutionRequest();
        return ResponseEntity.ok(superAdminService.executePayout(id, body, getAdminEmail(auth), getClientIp(request)));
    }

    // =========================================================================
    // 6. COMMISSION
    // =========================================================================
    @GetMapping("/commission/global")
    public ResponseEntity<Map<String, BigDecimal>> getGlobalCommission() {
        return ResponseEntity.ok(Map.of("globalCommissionPercentage", superAdminService.getGlobalCommission()));
    }

    public static class CommissionUpdateRequest {
        private BigDecimal commissionRate;
        public BigDecimal getCommissionRate() { return commissionRate; }
        public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }
    }

    @PutMapping("/commission/global")
    public ResponseEntity<Map<String, BigDecimal>> updateGlobalCommission(
            @RequestBody CommissionUpdateRequest req, Authentication auth, HttpServletRequest request) {
        BigDecimal updated = superAdminService.updateGlobalCommission(req.getCommissionRate(), getAdminEmail(auth), getClientIp(request));
        return ResponseEntity.ok(Map.of("globalCommissionPercentage", updated));
    }

    @GetMapping("/commission/restaurants/{id}")
    public ResponseEntity<Map<String, BigDecimal>> getRestaurantCommission(@PathVariable Long id) {
        return ResponseEntity.ok(Map.of("restaurantCommissionPercentage", superAdminService.getRestaurantCommission(id)));
    }

    @PatchMapping({"/commission/restaurants/{id}", "/restaurants/{id}/commission"})
    public ResponseEntity<Restaurant> updateRestaurantCommission(
            @PathVariable Long id, @RequestBody CommissionUpdateRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.updateRestaurantCommission(id, req.getCommissionRate(), getAdminEmail(auth), getClientIp(request)));
    }

    @GetMapping("/commission/delivery")
    public ResponseEntity<Map<String, Object>> getDeliveryCommission() {
        return ResponseEntity.ok(superAdminService.getDeliveryCommission());
    }

    // =========================================================================
    // 7. DELIVERY (RIDERS)
    // =========================================================================
    @GetMapping("/delivery/partners")
    public ResponseEntity<List<RiderAdminDTO>> getDeliveryPartners() {
        return ResponseEntity.ok(superAdminService.getDeliveryPartners());
    }

    @GetMapping("/delivery/live")
    public ResponseEntity<List<Order>> getLiveDeliveries() {
        return ResponseEntity.ok(superAdminService.getLiveDeliveries());
    }

    @GetMapping("/delivery/earnings")
    public ResponseEntity<List<Map<String, Object>>> getPartnerEarnings() {
        return ResponseEntity.ok(superAdminService.getPartnerEarnings());
    }

    @GetMapping("/delivery/issues")
    public ResponseEntity<List<Order>> getDeliveryIssues() {
        return ResponseEntity.ok(superAdminService.getDeliveryIssues());
    }

    // =========================================================================
    // 8. CUSTOMERS & FRAUD PREVENTION
    // =========================================================================
    @GetMapping("/customers/users")
    public ResponseEntity<List<CustomerAdminDTO>> getAllCustomers() {
        return ResponseEntity.ok(superAdminService.getAllCustomers());
    }

    @GetMapping("/customers/blocked")
    public ResponseEntity<List<User>> getBlockedCustomers() {
        return ResponseEntity.ok(superAdminService.getBlockedCustomers());
    }

    @PatchMapping("/customers/{id}/block")
    public ResponseEntity<User> blockCustomer(
            @PathVariable Long id, @RequestBody(required = false) ReasonRequest req,
            Authentication auth, HttpServletRequest request) {
        String reason = req != null && req.getReason() != null ? req.getReason() : "Fraudulent activity detected";
        return ResponseEntity.ok(superAdminService.blockCustomer(id, reason, getAdminEmail(auth), getClientIp(request)));
    }

    @PatchMapping("/customers/{id}/unblock")
    public ResponseEntity<User> unblockCustomer(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.unblockCustomer(id, getAdminEmail(auth), getClientIp(request)));
    }

    @GetMapping("/customers/wallets")
    public ResponseEntity<List<Map<String, Object>>> getCustomerWallets() {
        return ResponseEntity.ok(superAdminService.getCustomerWallets());
    }

    @PostMapping("/customers/{id}/wallet-adjust")
    public ResponseEntity<User> adjustCustomerWallet(
            @PathVariable Long id, @RequestBody WalletAdjustmentRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.adjustCustomerWallet(id, req, getAdminEmail(auth), getClientIp(request)));
    }

    @GetMapping("/customers/complaints")
    public ResponseEntity<List<SupportTicket>> getCustomerComplaints() {
        return ResponseEntity.ok(superAdminService.getSupportTickets("OPEN", "DELIVERY"));
    }

    // =========================================================================
    // 9. COUPONS
    // =========================================================================
    @GetMapping("/coupons")
    public ResponseEntity<List<Coupon>> getAllCoupons() {
        return ResponseEntity.ok(superAdminService.getAllCoupons());
    }

    @GetMapping("/coupons/platform")
    public ResponseEntity<List<Coupon>> getPlatformCoupons() {
        return ResponseEntity.ok(superAdminService.getPlatformCoupons());
    }

    @PostMapping("/coupons/platform")
    public ResponseEntity<Coupon> createPlatformCoupon(
            @RequestBody Coupon coupon, Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.createPlatformCoupon(coupon, getAdminEmail(auth), getClientIp(request)));
    }

    @PatchMapping("/coupons/{id}/toggle")
    public ResponseEntity<Coupon> toggleCouponStatus(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.toggleCouponStatus(id, getAdminEmail(auth), getClientIp(request)));
    }

    @PutMapping("/coupons/{id}")
    public ResponseEntity<Coupon> updateCoupon(
            @PathVariable Long id, @RequestBody Coupon coupon, Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.updateCoupon(id, coupon, getAdminEmail(auth), getClientIp(request)));
    }

    @DeleteMapping("/coupons/{id}")
    public ResponseEntity<Void> deleteCoupon(
            @PathVariable Long id, Authentication auth, HttpServletRequest request) {
        superAdminService.deleteCoupon(id, getAdminEmail(auth), getClientIp(request));
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/coupons/restaurant")
    public ResponseEntity<List<Coupon>> getRestaurantCoupons() {
        return ResponseEntity.ok(superAdminService.getRestaurantCoupons());
    }

    @GetMapping("/coupons/campaigns")
    public ResponseEntity<List<Coupon>> getCampaignCoupons() {
        return ResponseEntity.ok(superAdminService.getCampaignCoupons());
    }

    // =========================================================================
    // 10. FINANCE & TAX
    // =========================================================================
    @GetMapping("/finance/revenue")
    public ResponseEntity<Map<String, Object>> getFinanceRevenue() {
        FinanceReportDTO report = superAdminService.generateFinancialReport();
        return ResponseEntity.ok(Map.of(
                "totalGrossMerchandiseValue", report.getTotalGrossMerchandiseValue(),
                "netPlatformEarnings", report.getNetPlatformEarnings(),
                "gmvBySector", report.getGmvBySector()
        ));
    }

    @GetMapping("/finance/commission")
    public ResponseEntity<Map<String, BigDecimal>> getFinanceCommission() {
        FinanceReportDTO report = superAdminService.generateFinancialReport();
        return ResponseEntity.ok(Map.of("platformCommissionEarned", report.getPlatformCommissionEarned()));
    }

    @GetMapping("/finance/tax")
    public ResponseEntity<Map<String, BigDecimal>> getFinanceTax() {
        FinanceReportDTO report = superAdminService.generateFinancialReport();
        return ResponseEntity.ok(Map.of("totalTaxCollected", report.getTotalTaxCollected()));
    }

    @GetMapping("/finance/refunds")
    public ResponseEntity<Map<String, BigDecimal>> getFinanceRefunds() {
        FinanceReportDTO report = superAdminService.generateFinancialReport();
        return ResponseEntity.ok(Map.of("totalRefundsIssued", report.getTotalRefundsIssued()));
    }

    @GetMapping("/finance/reports")
    public ResponseEntity<FinanceReportDTO> getFinanceFullReport() {
        return ResponseEntity.ok(superAdminService.generateFinancialReport());
    }

    // =========================================================================
    // 11. SUPPORT (COMPLAINTS, DISPUTES, TICKETS)
    // =========================================================================
    @GetMapping("/support/complaints")
    public ResponseEntity<List<SupportTicket>> getSupportComplaints() {
        return ResponseEntity.ok(superAdminService.getSupportTickets(null, null));
    }

    @GetMapping("/support/disputes")
    public ResponseEntity<List<OrderDispute>> getSupportDisputes(
            @RequestParam(required = false) String status) {
        return ResponseEntity.ok(superAdminService.getDisputes(status));
    }

    @GetMapping("/support/disputes/{disputeId}")
    public ResponseEntity<OrderDispute> getDisputeById(@PathVariable Long disputeId) {
        return ResponseEntity.ok(superAdminService.getDisputeById(disputeId));
    }

    @PostMapping({"/disputes/{disputeId}/resolve", "/support/disputes/{disputeId}/resolve"})
    public ResponseEntity<OrderDispute> resolveDispute(
            @PathVariable Long disputeId, @RequestBody DisputeResolutionRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.resolveDispute(disputeId, req, getAdminEmail(auth), getClientIp(request)));
    }

    @GetMapping("/support/tickets")
    public ResponseEntity<List<SupportTicket>> getSupportTickets(
            @RequestParam(required = false) String status,
            @RequestParam(required = false) String category) {
        return ResponseEntity.ok(superAdminService.getSupportTickets(status, category));
    }

    @PostMapping("/support/tickets/{id}/reply")
    public ResponseEntity<SupportTicket> replyToTicket(
            @PathVariable Long id, @RequestBody TicketReplyRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.replyToTicket(id, req, getAdminEmail(auth), getClientIp(request)));
    }

    // =========================================================================
    // 12. NOTIFICATIONS (PUSH & BROADCAST CONSOLE)
    // =========================================================================
    @PostMapping("/notifications/broadcast")
    public ResponseEntity<PlatformNotification> broadcastNotification(
            @RequestBody BroadcastNotificationRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.broadcastNotification(req, getAdminEmail(auth), getClientIp(request)));
    }

    @GetMapping("/notifications/history")
    public ResponseEntity<List<PlatformNotification>> getBroadcastHistory() {
        return ResponseEntity.ok(superAdminService.getBroadcastHistory());
    }

    // =========================================================================
    // 13. SETTINGS & SYSTEM CONFIGURATION
    // =========================================================================
    @GetMapping({"/settings", "/system/config"})
    public ResponseEntity<PlatformSystemConfig> getSystemConfig() {
        return ResponseEntity.ok(superAdminService.getOrCreateSystemConfig());
    }

    @PutMapping({"/settings", "/system/config"})
    public ResponseEntity<PlatformSystemConfig> updateSystemConfig(
            @RequestBody SystemConfigUpdateRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.updateSystemConfig(req, getAdminEmail(auth), getClientIp(request)));
    }

    @GetMapping("/surge")
    public ResponseEntity<PlatformSystemConfig> getSurgeStatus() {
        return ResponseEntity.ok(superAdminService.getOrCreateSystemConfig());
    }

    @PatchMapping("/surge")
    public ResponseEntity<PlatformSystemConfig> updateSurgePricing(
            @RequestBody SurgePricingUpdateRequest req,
            Authentication auth, HttpServletRequest request) {
        return ResponseEntity.ok(superAdminService.updateSurgePricing(req, getAdminEmail(auth), getClientIp(request)));
    }

    // =========================================================================
    // 14. AUDIT LOGS
    // =========================================================================
    @GetMapping("/audit-logs")
    public ResponseEntity<List<AuditLog>> getAuditLogs(
            @RequestParam(required = false) String actorEmail,
            @RequestParam(required = false) String action,
            @RequestParam(required = false) String targetEntityType) {
        return ResponseEntity.ok(superAdminService.getAuditLogs(actorEmail, action, targetEntityType));
    }
}
