package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.superadmin.SuperAdminDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class SuperAdminService {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderDisputeRepository disputeRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private MerchantKycRepository kycRepository;

    @Autowired
    private PlatformSystemConfigRepository configRepository;

    @Autowired
    private SettlementService settlementService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private StripePaymentService stripePaymentService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private AuditLogRepository auditLogRepository;

    @Autowired
    private PaymentTransactionRepository paymentTransactionRepository;

    @Autowired
    private SupportTicketRepository supportTicketRepository;

    @Autowired
    private PlatformNotificationRepository platformNotificationRepository;

    @Autowired
    private CouponRepository couponRepository;

    @Autowired
    private StoreBranchRepository storeBranchRepository;

    @Autowired
    private RestaurantStaffRepository restaurantStaffRepository;

    @Autowired
    private LoyaltyRepository loyaltyRepository;

    // =========================================================================
    // 1. DASHBOARD
    // =========================================================================
    public PlatformCockpitDTO getPlatformCockpit() {
        PlatformCockpitDTO dto = new PlatformCockpitDTO();

        long totalRestaurants = restaurantRepository.count();
        long activeRestaurants = restaurantRepository.countByStatus(RestaurantStatus.ACTIVE);
        long totalCustomers = userRepository.countByRole(Role.CUSTOMER);
        long totalRiders = userRepository.countByRole(Role.DELIVERY_PARTNER);
        long totalOrders = orderRepository.count();

        List<Order> allOrders = orderRepository.findAll();
        BigDecimal platformGmv = BigDecimal.ZERO;
        BigDecimal platformCommissionRevenue = BigDecimal.ZERO;
        long activeOrders = 0;
        long deliveredOrders = 0;
        long ordersLast60Mins = 0;
        LocalDateTime oneHourAgo = LocalDateTime.now().minusHours(1);

        Map<String, Long> cityOrders = new HashMap<>();
        Map<String, Long> ordersBySector = new HashMap<>();
        Map<String, BigDecimal> revenueBySector = new HashMap<>();

        for (Order o : allOrders) {
            if (o.getCreatedAt() != null && o.getCreatedAt().isAfter(oneHourAgo)) {
                ordersLast60Mins++;
            }

            if (o.getRestaurant() != null && o.getRestaurant().getCity() != null) {
                String city = o.getRestaurant().getCity();
                cityOrders.put(city, cityOrders.getOrDefault(city, 0L) + 1);
            }

            String sectorKey = o.getBusinessSector() != null ? o.getBusinessSector().name() : "FOOD";
            ordersBySector.put(sectorKey, ordersBySector.getOrDefault(sectorKey, 0L) + 1);

            if (o.getStatus() == OrderStatus.DELIVERED) {
                deliveredOrders++;
                platformGmv = platformGmv.add(o.getTotalAmount());

                BigDecimal currentSectorRev = revenueBySector.getOrDefault(sectorKey, BigDecimal.ZERO);
                revenueBySector.put(sectorKey, currentSectorRev.add(o.getTotalAmount()));

                BigDecimal commRate = (o.getRestaurant() != null && o.getRestaurant().getCommissionRate() != null)
                        ? o.getRestaurant().getCommissionRate()
                        : BigDecimal.valueOf(15.0);
                BigDecimal commForOrder = o.getItemTotal().multiply(commRate)
                        .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
                platformCommissionRevenue = platformCommissionRevenue.add(commForOrder);
            } else if (o.getStatus() != OrderStatus.CANCELLED) {
                activeOrders++;
            }
        }

        List<OrderDispute> allDisputes = disputeRepository.findAll();
        long openDisputes = 0;
        BigDecimal totalRefunds = BigDecimal.ZERO;
        for (OrderDispute d : allDisputes) {
            if ("OPEN".equalsIgnoreCase(d.getStatus()) || "UNDER_REVIEW".equalsIgnoreCase(d.getStatus())) {
                openDisputes++;
            } else if ("RESOLVED_REFUNDED".equalsIgnoreCase(d.getStatus())) {
                totalRefunds = totalRefunds.add(d.getRefundAmount() != null ? d.getRefundAmount() : BigDecimal.ZERO);
            }
        }

        List<SettlementRecord> paidSettlements = settlementRepository.findByStatus("PAID");
        BigDecimal totalSettlementsPaid = BigDecimal.ZERO;
        for (SettlementRecord s : paidSettlements) {
            totalSettlementsPaid = totalSettlementsPaid
                    .add(s.getNetPayoutAmount() != null ? s.getNetPayoutAmount() : BigDecimal.ZERO);
        }

        dto.setPlatformGmv(platformGmv);
        dto.setPlatformCommissionRevenue(platformCommissionRevenue);
        dto.setTotalRestaurants(totalRestaurants);
        dto.setActiveRestaurants(activeRestaurants);
        dto.setTotalCustomers(totalCustomers);
        dto.setTotalRiders(totalRiders);
        dto.setTotalOrders(totalOrders);
        dto.setActiveOrders(activeOrders);
        dto.setDeliveredOrders(deliveredOrders);
        dto.setOpenDisputes(openDisputes);
        dto.setTotalRefundsIssued(totalRefunds);
        dto.setTotalSettlementsPaid(totalSettlementsPaid);
        dto.setOrdersByCity(cityOrders);
        dto.setOrdersBySector(ordersBySector);
        dto.setRevenueBySector(revenueBySector);
        dto.setOrdersLast60Mins(ordersLast60Mins);

        return dto;
    }

    // =========================================================================
    // 2. RESTAURANTS
    // =========================================================================
    public List<Restaurant> getAllRestaurants() {
        return restaurantRepository.findAll();
    }

    public List<Restaurant> getRestaurantApplications() {
        return restaurantRepository.findByStatus(RestaurantStatus.PENDING_APPROVAL);
    }

    public List<Restaurant> getActiveRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.ACTIVE);
    }

    public List<Restaurant> getSuspendedRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.SUSPENDED);
    }

    public List<Restaurant> getRejectedRestaurants() {
        return restaurantRepository.findByStatus(RestaurantStatus.REJECTED);
    }

    public RestaurantDetailSuperAdminDTO getRestaurant360Details(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + id));

        RestaurantDetailSuperAdminDTO dto = new RestaurantDetailSuperAdminDTO();
        dto.setId(r.getId());
        dto.setName(r.getName());
        dto.setSlug(r.getSlug());
        dto.setBusinessSector(r.getBusinessSector());
        dto.setStatus(r.getStatus());
        dto.setEmail(r.getEmail());
        dto.setPhone(r.getPhone());
        dto.setAddress(r.getAddress());
        dto.setCity(r.getCity());
        dto.setCommissionRate(r.getCommissionRate());
        dto.setStripeAccountId(r.getStripeAccountId());
        dto.setFssaiNumber(r.getFssaiNumber());
        dto.setGstin(r.getGstin());
        dto.setPanNumber(r.getPanNumber());
        dto.setBankAccountNumber(r.getBankAccountNumber());
        dto.setBankIfscCode(r.getBankIfscCode());
        dto.setAvgRating(r.getAvgRating());
        dto.setCreatedAt(r.getCreatedAt());

        long orderCount = orderRepository.countByRestaurant_Id(r.getId());
        dto.setTotalOrders(orderCount);

        List<Order> restaurantOrders = orderRepository.findByRestaurant_IdOrderByCreatedAtDesc(r.getId());
        BigDecimal totalSales = BigDecimal.ZERO;
        for (Order o : restaurantOrders) {
            if (o.getStatus() == OrderStatus.DELIVERED) {
                totalSales = totalSales.add(o.getTotalAmount());
            }
        }
        dto.setLifetimeSales(totalSales);

        dto.setBranchCount((int) storeBranchRepository.findByRestaurant_Id(r.getId()).size());
        dto.setStaffCount((int) restaurantStaffRepository.findByRestaurant_Id(r.getId()).size());

        return dto;
    }

    @Transactional
    public Restaurant approveRestaurant(Long id, String adminEmail, String ip) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + id));
        r.setStatus(RestaurantStatus.ACTIVE);
        Restaurant saved = restaurantRepository.save(r);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "APPROVE_RESTAURANT",
                "RESTAURANT", String.valueOf(id), "Approved restaurant application for " + r.getName(), ip);
        return saved;
    }

    @Transactional
    public Restaurant rejectRestaurant(Long id, String reason, String adminEmail, String ip) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + id));
        r.setStatus(RestaurantStatus.INACTIVE);
        Restaurant saved = restaurantRepository.save(r);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "REJECT_RESTAURANT",
                "RESTAURANT", String.valueOf(id), "Rejected restaurant: " + reason, ip);
        return saved;
    }

    @Transactional
    public Restaurant suspendRestaurant(Long id, String reason, String adminEmail, String ip) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + id));
        r.setStatus(RestaurantStatus.SUSPENDED);
        Restaurant saved = restaurantRepository.save(r);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "SUSPEND_RESTAURANT",
                "RESTAURANT", String.valueOf(id), "Suspended restaurant: " + reason, ip);
        return saved;
    }

    @Transactional
    public Restaurant unsuspendRestaurant(Long id, String adminEmail, String ip) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + id));
        r.setStatus(RestaurantStatus.ACTIVE);
        Restaurant saved = restaurantRepository.save(r);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "UNSUSPEND_RESTAURANT",
                "RESTAURANT", String.valueOf(id), "Unsuspended restaurant: " + r.getName(), ip);
        return saved;
    }

    public Map<String, Object> getRestaurantDocuments(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + id));
        List<MerchantKycRecord> kycList = kycRepository.findByRestaurant_IdOrderBySubmittedAtDesc(id);

        Map<String, Object> docs = new HashMap<>();
        docs.put("restaurantId", r.getId());
        docs.put("name", r.getName());
        docs.put("fssaiNumber", r.getFssaiNumber());
        docs.put("gstin", r.getGstin());
        docs.put("drugLicenseNumber", r.getDrugLicenseNumber());
        docs.put("panNumber", r.getPanNumber());
        docs.put("bankAccountNumber", r.getBankAccountNumber());
        docs.put("bankIfscCode", r.getBankIfscCode());
        docs.put("kycRecords", kycList);
        return docs;
    }

    // =========================================================================
    // 3. ORDERS
    // =========================================================================
    public List<Order> getAllOrders(String sector, OrderStatus status, Long restaurantId) {
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        return orders.stream()
                .filter(o -> sector == null
                        || (o.getBusinessSector() != null && o.getBusinessSector().name().equalsIgnoreCase(sector)))
                .filter(o -> status == null || o.getStatus() == status)
                .filter(o -> restaurantId == null
                        || (o.getRestaurant() != null && o.getRestaurant().getId().equals(restaurantId)))
                .toList();
    }

    public List<Order> getLiveOrders() {
        List<OrderStatus> liveStatuses = List.of(
                OrderStatus.PLACED, OrderStatus.ACCEPTED, OrderStatus.PREPARING,
                OrderStatus.READY_FOR_PICKUP, OrderStatus.OUT_FOR_DELIVERY);
        return orderRepository.findByStatusInOrderByCreatedAtDesc(liveStatuses);
    }

    public List<Order> getCancelledOrders() {
        return orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.CANCELLED);
    }

    public List<Order> getFailedOrders() {
        return orderRepository.findAllByOrderByCreatedAtDesc().stream()
                .filter(o -> o.getPaymentStatus() == PaymentStatus.FAILED || o.getStatus() == OrderStatus.CANCELLED)
                .toList();
    }

    // =========================================================================
    // 4. PAYMENTS (STRIPE & PLUGGABLE GATEWAYS)
    // =========================================================================
    public List<PaymentTransaction> getAllTransactions() {
        return paymentTransactionRepository.findAllByOrderByCreatedAtDesc();
    }

    public List<PaymentTransaction> getSuccessfulTransactions() {
        return paymentTransactionRepository.findByStatusOrderByCreatedAtDesc("SUCCESS");
    }

    public List<PaymentTransaction> getFailedTransactions() {
        return paymentTransactionRepository.findByStatusOrderByCreatedAtDesc("FAILED");
    }

    public List<PaymentTransaction> getRefundedTransactions() {
        return paymentTransactionRepository.findByStatusOrderByCreatedAtDesc("REFUNDED");
    }

    public List<PaymentTransaction> getPaymentDisputes() {
        return paymentTransactionRepository.findByDisputeStatusNotOrderByCreatedAtDesc("NONE");
    }

    @Transactional
    public PaymentTransaction triggerRefund(Long transactionId, RefundExecutionRequest req, String adminEmail,
            String ip) {
        PaymentTransaction tx = paymentTransactionRepository.findById(transactionId)
                .orElseThrow(() -> new NoSuchElementException("Payment transaction not found: " + transactionId));

        BigDecimal refundAmt = (req.getAmount() != null && req.getAmount().compareTo(BigDecimal.ZERO) > 0)
                ? req.getAmount()
                : tx.getAmount();

        String refundRef = "ref_" + System.currentTimeMillis();
        if ("STRIPE".equalsIgnoreCase(tx.getProvider())) {
            Map<String, Object> stripeRefund = stripePaymentService.processRefund(tx.getTransactionReference(),
                    refundAmt, req.getReason());
            refundRef = (String) stripeRefund.get("refundId");
        }

        tx.setStatus("REFUNDED");
        tx.setRefundAmount(refundAmt);
        tx.setRefundReference(refundRef);
        tx.setUpdatedAt(LocalDateTime.now());
        PaymentTransaction saved = paymentTransactionRepository.save(tx);

        if (tx.getOrder() != null) {
            tx.getOrder().setPaymentStatus(PaymentStatus.REFUNDED);
            orderRepository.save(tx.getOrder());

            notificationService.sendOrderUpdate(
                    tx.getOrder().getOrderId(),
                    "REFUNDED",
                    "Payment refund of ₹" + refundAmt + " has been processed via " + tx.getProvider(),
                    0);
        }

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "TRIGGER_REFUND",
                "PAYMENT", String.valueOf(transactionId),
                "Refunded ₹" + refundAmt + " (Ref: " + refundRef + "): " + req.getReason(), ip);

        return saved;
    }

    // =========================================================================
    // 5. SETTLEMENTS (MERCHANT PAYOUTS WITH STRIPE CONNECT)
    // =========================================================================
    public List<SettlementRecord> getPendingSettlements() {
        return settlementRepository.findByStatusOrderByProcessedAtDesc("PENDING");
    }

    public List<SettlementRecord> getProcessingSettlements() {
        return settlementRepository.findByStatusOrderByProcessedAtDesc("PROCESSING");
    }

    public List<SettlementRecord> getPaidSettlements() {
        return settlementRepository.findByStatusOrderByProcessedAtDesc("PAID");
    }

    public List<SettlementRecord> getFailedSettlements() {
        return settlementRepository.findByStatusOrderByProcessedAtDesc("FAILED");
    }

    public List<SettlementRecord> getSettlementHistory() {
        return settlementRepository.findAllByOrderByProcessedAtDesc();
    }

    @Transactional
    public SettlementRecord executePayout(Long settlementId, PayoutExecutionRequest req, String adminEmail, String ip) {
        SettlementRecord s = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new NoSuchElementException("Settlement record not found: " + settlementId));

        String provider = req.getProvider() != null ? req.getProvider().toUpperCase() : "MANUAL_BANK";
        s.setPayoutProvider(provider);

        if ("STRIPE".equalsIgnoreCase(provider)) {
            String stripeAccountId = (s.getRestaurant() != null) ? s.getRestaurant().getStripeAccountId() : null;
            if (stripeAccountId == null || stripeAccountId.trim().isEmpty()) {
                stripeAccountId = "acct_sim_" + (s.getRestaurant() != null ? s.getRestaurant().getId() : "default");
            }

            Map<String, Object> transferResult = stripePaymentService.transferPayout(
                    stripeAccountId, s.getNetPayoutAmount(), "INR",
                    "Settlement Payout for " + (s.getRestaurant() != null ? s.getRestaurant().getName() : "Merchant"));

            s.setStripeTransferId((String) transferResult.get("transferId"));
            s.setStatus("PAID");
            s.setPaidAt(LocalDateTime.now());
            s.setUtrNumber((String) transferResult.get("transferId"));
        } else {
            s.setStatus("PAID");
            s.setPaidAt(LocalDateTime.now());
            s.setUtrNumber(req.getUtrNumber() != null ? req.getUtrNumber() : ("UTR" + System.currentTimeMillis()));
        }

        SettlementRecord saved = settlementRepository.save(s);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "EXECUTE_PAYOUT",
                "SETTLEMENT", String.valueOf(settlementId),
                "Disbursed ₹" + s.getNetPayoutAmount() + " to restaurant via " + provider + " (Ref: " + s.getUtrNumber()
                        + ")",
                ip);

        return saved;
    }

    // =========================================================================
    // 6. COMMISSION
    // =========================================================================
    public BigDecimal getGlobalCommission() {
        return getOrCreateSystemConfig().getDefaultCommissionRate();
    }

    @Transactional
    public BigDecimal updateGlobalCommission(BigDecimal rate, String adminEmail, String ip) {
        PlatformSystemConfig config = getOrCreateSystemConfig();
        config.setDefaultCommissionRate(rate);
        config.setUpdatedAt(LocalDateTime.now());
        configRepository.save(config);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "UPDATE_GLOBAL_COMMISSION",
                "CONFIG", "global", "Updated global commission rate to " + rate + "%", ip);
        return rate;
    }

    public BigDecimal getRestaurantCommission(Long restaurantId) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + restaurantId));
        return r.getCommissionRate();
    }

    @Transactional
    public Restaurant updateRestaurantCommission(Long restaurantId, BigDecimal rate, String adminEmail, String ip) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + restaurantId));
        r.setCommissionRate(rate);
        Restaurant saved = restaurantRepository.save(r);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "UPDATE_RESTAURANT_COMMISSION",
                "RESTAURANT", String.valueOf(restaurantId),
                "Updated custom commission to " + rate + "% for " + r.getName(), ip);
        return saved;
    }

    public Map<String, Object> getDeliveryCommission() {
        return Map.of(
                "platformDeliverySharePercentage", BigDecimal.valueOf(20.0),
                "riderDeliverySharePercentage", BigDecimal.valueOf(80.0));
    }

    // =========================================================================
    // 7. DELIVERY (RIDERS)
    // =========================================================================
    public List<RiderAdminDTO> getDeliveryPartners() {
        List<User> riders = userRepository.findByRole(Role.DELIVERY_PARTNER);
        List<RiderAdminDTO> dtos = new ArrayList<>();

        for (User u : riders) {
            RiderAdminDTO dto = new RiderAdminDTO();
            dto.setId(u.getId());
            dto.setName(u.getName());
            dto.setEmail(u.getEmail());
            dto.setPhone(u.getPhone());
            dto.setBlocked(u.isBlocked());
            dto.setJoinedAt(u.getCreatedAt());

            long deliveries = orderRepository.findAll().stream()
                    .filter(o -> o.getRiderPhone() != null && o.getRiderPhone().equals(u.getPhone())
                            && o.getStatus() == OrderStatus.DELIVERED)
                    .count();
            dto.setLifetimeDeliveries(deliveries);
            dto.setTotalEarnings(BigDecimal.valueOf(deliveries * 45.0)); // e.g. ₹45 base pay per trip

            Order activeOrder = orderRepository.findAll().stream()
                    .filter(o -> o.getRiderPhone() != null && o.getRiderPhone().equals(u.getPhone())
                            && o.getStatus() == OrderStatus.OUT_FOR_DELIVERY)
                    .findFirst().orElse(null);
            dto.setCurrentActiveOrderId(activeOrder != null ? activeOrder.getOrderId() : null);

            dtos.add(dto);
        }
        return dtos;
    }

    public List<Order> getLiveDeliveries() {
        return orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.OUT_FOR_DELIVERY);
    }

    public List<Map<String, Object>> getPartnerEarnings() {
        List<User> riders = userRepository.findByRole(Role.DELIVERY_PARTNER);
        List<Map<String, Object>> earnings = new ArrayList<>();

        for (User u : riders) {
            long deliveries = orderRepository.findAll().stream()
                    .filter(o -> o.getRiderPhone() != null && o.getRiderPhone().equals(u.getPhone())
                            && o.getStatus() == OrderStatus.DELIVERED)
                    .count();
            BigDecimal deliveryPay = BigDecimal.valueOf(deliveries * 45.0);
            BigDecimal bonusPay = BigDecimal.valueOf(deliveries >= 10 ? 250.0 : 0.0);

            earnings.add(Map.of(
                    "riderId", u.getId(),
                    "name", u.getName(),
                    "phone", u.getPhone(),
                    "deliveriesCount", deliveries,
                    "deliveryPay", deliveryPay,
                    "bonusPay", bonusPay,
                    "totalEarnings", deliveryPay.add(bonusPay)));
        }
        return earnings;
    }

    public List<Order> getDeliveryIssues() {
        // Delayed orders or cancelled after pickup
        return orderRepository.findAll().stream()
                .filter(o -> o.getStatus() == OrderStatus.CANCELLED && o.getRiderPhone() != null)
                .toList();
    }

    // =========================================================================
    // 8. CUSTOMERS & FRAUD PREVENTION
    // =========================================================================
    public List<CustomerAdminDTO> getAllCustomers() {
        List<User> customers = userRepository.findByRole(Role.CUSTOMER);
        List<CustomerAdminDTO> dtos = new ArrayList<>();

        for (User u : customers) {
            CustomerAdminDTO dto = new CustomerAdminDTO();
            dto.setId(u.getId());
            dto.setName(u.getName());
            dto.setEmail(u.getEmail());
            dto.setPhone(u.getPhone());
            dto.setBlocked(u.isBlocked());
            dto.setWalletBalance(u.getWalletBalance());
            dto.setJoinedAt(u.getCreatedAt());

            loyaltyRepository.findByUser_Id(u.getId()).ifPresent(la -> dto.setLoyaltyPoints(la.getPointsBalance()));

            long ordersCount = orderRepository.countByUser_Id(u.getId());
            dto.setTotalOrders(ordersCount);

            List<Order> userOrders = orderRepository.findByUser_IdOrderByCreatedAtDesc(u.getId());
            BigDecimal spent = BigDecimal.ZERO;
            for (Order o : userOrders) {
                if (o.getStatus() == OrderStatus.DELIVERED) {
                    spent = spent.add(o.getTotalAmount());
                }
            }
            dto.setTotalSpent(spent);

            dtos.add(dto);
        }
        return dtos;
    }

    public List<User> getBlockedCustomers() {
        return userRepository.findByIsBlockedTrue();
    }

    @Transactional
    public User blockCustomer(Long userId, String reason, String adminEmail, String ip) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        u.setBlocked(true);
        User saved = userRepository.save(u);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "BLOCK_USER",
                "USER", String.valueOf(userId), "Blocked user account: " + reason, ip);
        return saved;
    }

    @Transactional
    public User unblockCustomer(Long userId, String adminEmail, String ip) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        u.setBlocked(false);
        User saved = userRepository.save(u);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "UNBLOCK_USER",
                "USER", String.valueOf(userId), "Unblocked user account for " + u.getEmail(), ip);
        return saved;
    }

    public List<Map<String, Object>> getCustomerWallets() {
        List<User> customers = userRepository.findByRole(Role.CUSTOMER);
        List<Map<String, Object>> wallets = new ArrayList<>();
        for (User u : customers) {
            wallets.add(Map.of(
                    "userId", u.getId(),
                    "name", u.getName(),
                    "email", u.getEmail(),
                    "phone", u.getPhone(),
                    "walletBalance", u.getWalletBalance() != null ? u.getWalletBalance() : BigDecimal.ZERO));
        }
        return wallets;
    }

    @Transactional
    public User adjustCustomerWallet(Long userId, WalletAdjustmentRequest req, String adminEmail, String ip) {
        User u = userRepository.findById(userId)
                .orElseThrow(() -> new NoSuchElementException("User not found: " + userId));
        BigDecimal current = u.getWalletBalance() != null ? u.getWalletBalance() : BigDecimal.ZERO;
        BigDecimal updated = current.add(req.getAmount());
        if (updated.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("Wallet balance cannot become negative!");
        }
        u.setWalletBalance(updated);
        User saved = userRepository.save(u);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "ADJUST_WALLET",
                "USER", String.valueOf(userId), "Adjusted wallet balance by ₹" + req.getAmount() + " (New balance: ₹"
                        + updated + "): " + req.getReason(),
                ip);
        return saved;
    }

    // =========================================================================
    // 9. COUPONS
    // =========================================================================
    public List<Coupon> getAllCoupons() {
        return couponRepository.findAll();
    }

    public List<Coupon> getPlatformCoupons() {
        return couponRepository.findAll().stream()
                .filter(c -> c.getRestaurant() == null)
                .toList();
    }

    public List<Coupon> getRestaurantCoupons() {
        return couponRepository.findAll().stream()
                .filter(c -> c.getRestaurant() != null)
                .toList();
    }

    public List<Coupon> getCampaignCoupons() {
        return couponRepository.findAll().stream()
                .filter(c -> c.getCode().contains("CAMPAIGN") || c.getCode().contains("FEST")
                        || c.getCode().contains("INSTA"))
                .toList();
    }

    @Transactional
    public Coupon createPlatformCoupon(Coupon coupon, String adminEmail, String ip) {
        coupon.setRestaurant(null); // Platform-wide
        coupon.setActive(true);
        Coupon saved = couponRepository.save(coupon);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "CREATE_COUPON",
                "COUPON", saved.getCode(), "Created platform coupon " + saved.getCode() + " ("
                        + (saved.getDiscountPercentage() != null ? saved.getDiscountPercentage() : "0") + "% off)",
                ip);
        return saved;
    }

    @Transactional
    public Coupon toggleCouponStatus(Long id, String adminEmail, String ip) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Coupon not found: " + id));
        c.setActive(!c.isActive());
        Coupon saved = couponRepository.save(c);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "TOGGLE_COUPON_STATUS",
                "COUPON", c.getCode(), "Set coupon active=" + c.isActive(), ip);
        return saved;
    }

    @Transactional
    public Coupon updateCoupon(Long id, Coupon updated, String adminEmail, String ip) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Coupon not found: " + id));
        if (updated.getTitle() != null)
            c.setTitle(updated.getTitle());
        if (updated.getDescription() != null)
            c.setDescription(updated.getDescription());
        if (updated.getDiscountPercentage() != null)
            c.setDiscountPercentage(updated.getDiscountPercentage());
        if (updated.getMaxDiscountAmount() != null)
            c.setMaxDiscountAmount(updated.getMaxDiscountAmount());
        if (updated.getFlatDiscountAmount() != null)
            c.setFlatDiscountAmount(updated.getFlatDiscountAmount());
        if (updated.getMinOrderAmount() != null)
            c.setMinOrderAmount(updated.getMinOrderAmount());
        if (updated.getValidUntil() != null)
            c.setValidUntil(updated.getValidUntil());
        if (updated.getUsageLimitPerUser() != null)
            c.setUsageLimitPerUser(updated.getUsageLimitPerUser());
        if (updated.getTotalUsageLimit() != null)
            c.setTotalUsageLimit(updated.getTotalUsageLimit());
        Coupon saved = couponRepository.save(c);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "UPDATE_COUPON",
                "COUPON", c.getCode(), "Updated coupon parameters for " + c.getCode(), ip);
        return saved;
    }

    @Transactional
    public void deleteCoupon(Long id, String adminEmail, String ip) {
        Coupon c = couponRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Coupon not found: " + id));
        couponRepository.delete(c);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "DELETE_COUPON",
                "COUPON", c.getCode(), "Deleted coupon " + c.getCode(), ip);
    }

    // =========================================================================
    // 10. FINANCE & TAX REPORTS
    // =========================================================================
    public FinanceReportDTO generateFinancialReport() {
        FinanceReportDTO dto = new FinanceReportDTO();

        List<Order> deliveredOrders = orderRepository.findByStatusOrderByCreatedAtDesc(OrderStatus.DELIVERED);
        BigDecimal gmv = BigDecimal.ZERO;
        BigDecimal commEarned = BigDecimal.ZERO;
        BigDecimal tax = BigDecimal.ZERO;
        BigDecimal deliveryFees = BigDecimal.ZERO;
        BigDecimal packagingFees = BigDecimal.ZERO;
        Map<String, BigDecimal> sectorGmv = new HashMap<>();

        for (Order o : deliveredOrders) {
            gmv = gmv.add(o.getTotalAmount());
            tax = tax.add(o.getTaxAmount() != null ? o.getTaxAmount() : BigDecimal.ZERO);
            deliveryFees = deliveryFees.add(o.getDeliveryFee() != null ? o.getDeliveryFee() : BigDecimal.ZERO);
            packagingFees = packagingFees.add(o.getPackagingFee() != null ? o.getPackagingFee() : BigDecimal.ZERO);

            BigDecimal commRate = (o.getRestaurant() != null && o.getRestaurant().getCommissionRate() != null)
                    ? o.getRestaurant().getCommissionRate()
                    : BigDecimal.valueOf(15.0);
            BigDecimal orderComm = o.getItemTotal().multiply(commRate)
                    .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            commEarned = commEarned.add(orderComm);

            String sectorKey = o.getBusinessSector() != null ? o.getBusinessSector().name() : "FOOD";
            sectorGmv.put(sectorKey, sectorGmv.getOrDefault(sectorKey, BigDecimal.ZERO).add(o.getTotalAmount()));
        }

        BigDecimal refundsIssued = BigDecimal.ZERO;
        for (OrderDispute d : disputeRepository.findAll()) {
            if ("RESOLVED_REFUNDED".equalsIgnoreCase(d.getStatus())) {
                refundsIssued = refundsIssued.add(d.getRefundAmount() != null ? d.getRefundAmount() : BigDecimal.ZERO);
            }
        }

        dto.setTotalGrossMerchandiseValue(gmv);
        dto.setPlatformCommissionEarned(commEarned);
        dto.setTotalTaxCollected(tax);
        dto.setTotalDeliveryFeesCollected(deliveryFees);
        dto.setTotalPackagingFeesCollected(packagingFees);
        dto.setTotalRefundsIssued(refundsIssued);
        dto.setNetPlatformEarnings(commEarned.subtract(refundsIssued));
        dto.setGmvBySector(sectorGmv);

        dto.setTotalTransactions(paymentTransactionRepository.count());
        dto.setSuccessfulTransactions(paymentTransactionRepository.countByStatus("SUCCESS"));
        dto.setRefundedTransactions(paymentTransactionRepository.countByStatus("REFUNDED"));

        return dto;
    }

    // =========================================================================
    // 11. SUPPORT (COMPLAINTS, DISPUTES, TICKETS)
    // =========================================================================
    public List<OrderDispute> getSupportDisputes() {
        return disputeRepository.findAll();
    }

    public List<OrderDispute> getDisputes(String status) {
        if (status != null && !status.trim().isEmpty()) {
            return disputeRepository.findByStatus(status.toUpperCase());
        }
        return disputeRepository.findAll();
    }

    public OrderDispute getDisputeById(Long id) {
        return disputeRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Order dispute not found: " + id));
    }

    public List<SupportTicket> getSupportTickets(String status, String category) {
        List<SupportTicket> tickets = supportTicketRepository.findAllByOrderByCreatedAtDesc();
        return tickets.stream()
                .filter(t -> status == null || t.getStatus().equalsIgnoreCase(status))
                .filter(t -> category == null || t.getCategory().equalsIgnoreCase(category))
                .toList();
    }

    @Transactional
    public SupportTicket replyToTicket(Long ticketId, TicketReplyRequest req, String adminEmail, String ip) {
        SupportTicket ticket = supportTicketRepository.findById(ticketId)
                .orElseThrow(() -> new NoSuchElementException("Support ticket not found: " + ticketId));

        String entry = "\n[" + LocalDateTime.now() + "] Admin (" + adminEmail + "): " + req.getMessage();
        String currentLog = ticket.getConversationLog() != null ? ticket.getConversationLog() : "";
        ticket.setConversationLog(currentLog + entry);
        ticket.setAssignedAdminEmail(adminEmail);
        ticket.setUpdatedAt(LocalDateTime.now());

        if (req.getNewStatus() != null && !req.getNewStatus().trim().isEmpty()) {
            ticket.setStatus(req.getNewStatus().toUpperCase());
            if ("RESOLVED".equalsIgnoreCase(req.getNewStatus()) || "CLOSED".equalsIgnoreCase(req.getNewStatus())) {
                ticket.setResolvedAt(LocalDateTime.now());
            }
        }

        SupportTicket saved = supportTicketRepository.save(ticket);
        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "REPLY_SUPPORT_TICKET",
                "TICKET", String.valueOf(ticketId), "Replied to ticket " + ticket.getTicketNumber(), ip);

        return saved;
    }

    // =========================================================================
    // 12. NOTIFICATIONS (PUSH & BROADCAST CONSOLE)
    // =========================================================================
    @Transactional
    public PlatformNotification broadcastNotification(BroadcastNotificationRequest req, String adminEmail, String ip) {
        PlatformNotification notification = new PlatformNotification(
                req.getTitle(), req.getMessage(), req.getTargetAudience(),
                req.getSector(), req.getActionUrl(), adminEmail);
        PlatformNotification saved = platformNotificationRepository.save(notification);

        // Broadcast to WebSocket topic
        notificationService.sendOrderUpdate("BROADCAST", "SYSTEM_ANNOUNCEMENT", req.getMessage(), 0);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "BROADCAST_NOTIFICATION",
                "NOTIFICATION", String.valueOf(saved.getId()),
                "Broadcasted announcement '" + req.getTitle() + "' to " + req.getTargetAudience(), ip);

        return saved;
    }

    public List<PlatformNotification> getBroadcastHistory() {
        return platformNotificationRepository.findAllByOrderBySentAtDesc();
    }

    // =========================================================================
    // 13. SETTINGS & SYSTEM CONFIGURATION
    // =========================================================================
    public PlatformSystemConfig getOrCreateSystemConfig() {
        return configRepository.findAll().stream().findFirst().orElseGet(() -> {
            PlatformSystemConfig newConfig = new PlatformSystemConfig();
            return configRepository.save(newConfig);
        });
    }

    @Transactional
    public PlatformSystemConfig updateSurgePricing(SurgePricingUpdateRequest req, String adminEmail, String ip) {
        PlatformSystemConfig config = getOrCreateSystemConfig();
        if (req.getRainSurgeActive() != null)
            config.setRainSurgeActive(req.getRainSurgeActive());
        if (req.getRainSurgeMultiplier() != null)
            config.setRainSurgeMultiplier(req.getRainSurgeMultiplier());
        if (req.getNightSurgeActive() != null)
            config.setNightSurgeActive(req.getNightSurgeActive());
        if (req.getNightSurgeMultiplier() != null)
            config.setNightSurgeMultiplier(req.getNightSurgeMultiplier());
        config.setUpdatedAt(LocalDateTime.now());
        PlatformSystemConfig saved = configRepository.save(config);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "UPDATE_SURGE_PRICING",
                "CONFIG", "surge", "Updated dynamic surge pricing settings", ip);
        return saved;
    }

    @Transactional
    public PlatformSystemConfig updateSystemConfig(SystemConfigUpdateRequest req, String adminEmail, String ip) {
        PlatformSystemConfig config = getOrCreateSystemConfig();
        if (req.getDefaultCommissionRate() != null)
            config.setDefaultCommissionRate(req.getDefaultCommissionRate());
        if (req.getMaintenanceMode() != null)
            config.setMaintenanceMode(req.getMaintenanceMode());
        if (req.getMaintenanceMessage() != null)
            config.setMaintenanceMessage(req.getMaintenanceMessage());
        if (req.getGlobalAnnouncementBanner() != null)
            config.setGlobalAnnouncementBanner(req.getGlobalAnnouncementBanner());
        if (req.getBannerActive() != null)
            config.setBannerActive(req.getBannerActive());
        if (req.getSupportPhone() != null)
            config.setSupportPhone(req.getSupportPhone());
        if (req.getSupportEmail() != null)
            config.setSupportEmail(req.getSupportEmail());
        config.setUpdatedAt(LocalDateTime.now());
        PlatformSystemConfig saved = configRepository.save(config);

        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "UPDATE_SYSTEM_CONFIG",
                "CONFIG", "system", "Updated platform system configuration", ip);
        return saved;
    }

    // =========================================================================
    // 14. AUDIT LOGS
    // =========================================================================
    public List<AuditLog> getAuditLogs(String actorEmail, String action, String targetEntityType) {
        if (actorEmail != null && !actorEmail.trim().isEmpty()) {
            return auditLogRepository.findByActorEmailOrderByTimestampDesc(actorEmail);
        }
        if (action != null && !action.trim().isEmpty()) {
            return auditLogRepository.findByActionOrderByTimestampDesc(action);
        }
        if (targetEntityType != null && !targetEntityType.trim().isEmpty()) {
            return auditLogRepository.findByTargetEntityTypeOrderByTimestampDesc(targetEntityType);
        }
        return auditLogRepository.findAllByOrderByTimestampDesc();
    }

    // KYC and Dispute Helpers
    public List<MerchantKycRecord> getPendingKyc() {
        return kycRepository.findByStatus("PENDING");
    }

    @Transactional
    public MerchantKycRecord reviewKyc(Long kycId, boolean approved, String reason, String adminEmail, String ip) {
        MerchantKycRecord kyc = kycRepository.findById(kycId)
                .orElseThrow(() -> new NoSuchElementException("KYC record not found: " + kycId));

        if (approved) {
            kyc.setStatus("VERIFIED");
            kyc.setVerifiedAt(LocalDateTime.now());
            if (kyc.getRestaurant() != null) {
                kyc.getRestaurant().setStatus(RestaurantStatus.ACTIVE);
                restaurantRepository.save(kyc.getRestaurant());
            }
        } else {
            kyc.setStatus("REJECTED");
            kyc.setRejectionReason(reason);
        }

        MerchantKycRecord saved = kycRepository.save(kyc);
        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", approved ? "APPROVE_KYC" : "REJECT_KYC",
                "KYC", String.valueOf(kycId),
                "Reviewed KYC for restaurant " + (kyc.getRestaurant() != null ? kyc.getRestaurant().getName() : "")
                        + ": " + (approved ? "Approved" : reason),
                ip);
        return saved;
    }

    @Transactional
    public OrderDispute resolveDispute(Long disputeId, DisputeResolutionRequest req, String adminEmail, String ip) {
        OrderDispute dispute = disputeRepository.findById(disputeId)
                .orElseThrow(() -> new NoSuchElementException("Order dispute not found: " + disputeId));

        dispute.setAdminNotes(req.getAdminNotes());
        dispute.setResolvedAt(LocalDateTime.now());

        if (req.isApproved()) {
            dispute.setStatus("RESOLVED_REFUNDED");
            BigDecimal refund = req.getRefundAmount() != null && req.getRefundAmount().compareTo(BigDecimal.ZERO) > 0
                    ? req.getRefundAmount()
                    : dispute.getOrder().getTotalAmount();
            dispute.setRefundAmount(refund);

            Order order = dispute.getOrder();
            order.setPaymentStatus(PaymentStatus.REFUNDED);
            orderRepository.save(order);

            notificationService.sendOrderUpdate(
                    order.getOrderId(),
                    "REFUNDED",
                    "Dispute approved by Swiggy Support: ₹" + refund + " has been initiated for refund.",
                    0);
        } else {
            dispute.setStatus("REJECTED");
            notificationService.sendOrderUpdate(
                    dispute.getOrder().getOrderId(),
                    "DISPUTE_REJECTED",
                    "Dispute reviewed and resolved without refund: "
                            + (req.getAdminNotes() != null ? req.getAdminNotes() : "Terms conditions apply."),
                    0);
        }

        OrderDispute saved = disputeRepository.save(dispute);
        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "RESOLVE_DISPUTE",
                "DISPUTE", String.valueOf(disputeId), "Resolved dispute: " + dispute.getStatus(), ip);
        return saved;
    }

    @Transactional
    public List<SettlementRecord> generateSettlementBatch(String adminEmail, String ip) {
        List<Restaurant> activeRestaurants = restaurantRepository.findByStatus(RestaurantStatus.ACTIVE);
        List<SettlementRecord> generated = new ArrayList<>();
        for (Restaurant r : activeRestaurants) {
            BigDecimal commRate = r.getCommissionRate() != null ? r.getCommissionRate() : BigDecimal.valueOf(15.0);
            SettlementRecord record = settlementService.calculateSettlement(r.getId(), commRate);
            generated.add(record);
        }
        auditLogService.recordAction(adminEmail, "SUPER_ADMIN", "GENERATE_SETTLEMENT_BATCH",
                "SETTLEMENT", "batch", "Generated settlement batch for " + generated.size() + " active stores", ip);
        return generated;
    }
}
