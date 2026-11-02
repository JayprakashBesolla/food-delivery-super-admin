package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.order.OrderDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import com.razorpay.RazorpayClient;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class OrderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderItemRepository orderItemRepository;

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private UserAddressRepository userAddressRepository;

    @Autowired
    private CouponService couponService;

    @Autowired
    private LoyaltyService loyaltyService;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private OrderDisputeRepository disputeRepository;

    @Autowired
    private DishRepository dishRepository;

    @Value("${razorpay.key_id:rzp_test_placeholder}")
    private String razorpayKeyId;

    @Value("${razorpay.key_secret:rzp_secret_placeholder}")
    private String razorpayKeySecret;

    @Transactional
    public OrderResponseDTO placeOrder(User user, PlaceOrderRequest req) {
        Cart cart = cartRepository.findByUser_Id(user.getId())
                .orElseThrow(() -> new IllegalStateException("No active cart found for user"));

        if (cart.getItems() == null || cart.getItems().isEmpty()) {
            throw new IllegalStateException("Cart is empty. Please add items before placing an order.");
        }

        Restaurant restaurant = cart.getRestaurant();
        if (restaurant == null) {
            throw new IllegalStateException("Restaurant not found for cart items.");
        }

        if (!restaurant.isCurrentlyAcceptingOrders()) {
            throw new IllegalStateException("Restaurant '" + restaurant.getName() + "' is currently closed and not accepting orders.");
        }

        // Sector & Prescription validation
        boolean requiresPrescription = false;
        for (CartItem ci : cart.getItems()) {
            if (ci.getDish() != null && ci.getDish().isPrescriptionRequired()) {
                requiresPrescription = true;
                break;
            }
        }

        String prescriptionVerificationStatus = "NOT_REQUIRED";
        if (requiresPrescription) {
            if (req.getPrescriptionImageUrl() == null || req.getPrescriptionImageUrl().trim().isEmpty()) {
                throw new IllegalArgumentException("Doctor prescription is required for one or more pharmacy items in your cart. Please upload a prescription image.");
            }
            prescriptionVerificationStatus = "PENDING_REVIEW";
        }

        // Calculate item total
        BigDecimal itemTotal = BigDecimal.ZERO;
        for (CartItem item : cart.getItems()) {
            itemTotal = itemTotal.add(item.getTotalPrice());
        }

        // Calculate fees
        BigDecimal packagingFee = restaurant.getPackagingFee() != null ? restaurant.getPackagingFee() : BigDecimal.valueOf(15.0);
        BigDecimal taxPercentage = restaurant.getTaxPercentage() != null ? restaurant.getTaxPercentage() : BigDecimal.valueOf(5.0);
        BigDecimal taxAmount = itemTotal.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        BigDecimal deliveryFee = BigDecimal.ZERO;
        if (req.getOrderType() == OrderType.DELIVERY) {
            BigDecimal freeThreshold = restaurant.getFreeDeliveryThreshold() != null ? restaurant.getFreeDeliveryThreshold() : BigDecimal.valueOf(500.0);
            if (itemTotal.compareTo(freeThreshold) < 0) {
                deliveryFee = restaurant.getDeliveryFee() != null ? restaurant.getDeliveryFee() : BigDecimal.valueOf(40.0);
            }
        }

        // Coupon discount calculation
        BigDecimal discountAmount = BigDecimal.ZERO;
        String appliedCouponCode = null;
        Coupon appliedCoupon = null;
        if (req.getCouponCode() != null && !req.getCouponCode().trim().isEmpty()) {
            var validation = couponService.validateAndCalculateDiscount(req.getCouponCode(), user, restaurant, itemTotal);
            if (Boolean.TRUE.equals(validation.get("valid"))) {
                appliedCoupon = (Coupon) validation.get("coupon");
                discountAmount = (BigDecimal) validation.get("discount");
                appliedCouponCode = appliedCoupon.getCode();
            }
        }

        BigDecimal totalAmount = itemTotal.add(packagingFee).add(taxAmount).add(deliveryFee).subtract(discountAmount);
        if (totalAmount.compareTo(BigDecimal.ZERO) < 0) totalAmount = BigDecimal.ZERO;

        // Resolve delivery address
        String finalAddress = "Standard Address";
        Double lat = req.getLatitude();
        Double lng = req.getLongitude();

        if (req.getOrderType() == OrderType.DINE_IN) {
            finalAddress = "Dine-In: Table " + (req.getTableNumber() != null ? req.getTableNumber() : "General");
        } else if (req.getOrderType() == OrderType.TAKEAWAY) {
            finalAddress = "Takeaway / Self Pickup from " + restaurant.getName() + " (" + restaurant.getArea() + ")";
        } else {
            if (req.getAddressId() != null) {
                UserAddress addr = userAddressRepository.findById(req.getAddressId()).orElse(null);
                if (addr != null) {
                    finalAddress = String.format("%s, %s, %s - %s", addr.getAddressLine(), addr.getLandmark() != null ? addr.getLandmark() : "", addr.getCity(), addr.getPincode());
                    lat = addr.getLatitude();
                    lng = addr.getLongitude();
                }
            } else if (req.getCustomAddress() != null && !req.getCustomAddress().trim().isEmpty()) {
                finalAddress = req.getCustomAddress().trim();
            }
        }

        // Generate Order ID
        String orderId = "SWIG_" + System.currentTimeMillis() % 100000000;

        // Payment status & online razorpay order creation
        PaymentMethod paymentMethod = req.getPaymentMethod() != null ? req.getPaymentMethod() : PaymentMethod.CASH_ON_DELIVERY;
        PaymentStatus paymentStatus = PaymentStatus.PENDING;
        OrderStatus initialStatus = OrderStatus.PLACED;

        if (paymentMethod == PaymentMethod.ONLINE_RAZORPAY) {
            String key = (restaurant.getRazorpayKeyId() != null && !restaurant.getRazorpayKeyId().trim().isEmpty())
                    ? restaurant.getRazorpayKeyId().trim() : razorpayKeyId;
            String secret = (restaurant.getRazorpayKeySecret() != null && !restaurant.getRazorpayKeySecret().trim().isEmpty())
                    ? restaurant.getRazorpayKeySecret().trim() : razorpayKeySecret;

            if (!key.contains("placeholder") && !secret.contains("placeholder")) {
                try {
                    RazorpayClient client = new RazorpayClient(key, secret);
                    JSONObject rzpReq = new JSONObject();
                    rzpReq.put("amount", totalAmount.multiply(BigDecimal.valueOf(100)).intValue());
                    rzpReq.put("currency", "INR");
                    rzpReq.put("receipt", orderId);
                    com.razorpay.Order rzpOrder = client.orders.create(rzpReq);
                    orderId = rzpOrder.get("id");
                } catch (Exception e) {
                    // Fallback to internal orderId if razorpay fails or in dev mode
                }
            }
        }

        Order order = new Order();
        order.setOrderId(orderId);
        order.setUser(user);
        order.setRestaurant(restaurant);
        order.setOrderType(req.getOrderType() != null ? req.getOrderType() : OrderType.DELIVERY);
        order.setStatus(initialStatus);
        order.setPaymentMethod(paymentMethod);
        order.setPaymentStatus(paymentStatus);
        order.setDeliveryAddress(finalAddress);
        order.setDeliveryLatitude(lat);
        order.setDeliveryLongitude(lng);
        order.setTableNumber(req.getTableNumber());
        order.setSpecialInstructions(req.getSpecialInstructions());
        order.setItemTotal(itemTotal);
        order.setPackagingFee(packagingFee);
        order.setTaxAmount(taxAmount);
        order.setDeliveryFee(deliveryFee);
        order.setDiscountAmount(discountAmount);
        order.setTotalAmount(totalAmount);
        order.setCouponCode(appliedCouponCode);
        order.setRiderName("Ramesh Kumar (Swiggy Delivery)");
        order.setRiderPhone("+91 98765 43210");
        order.setEstimatedDeliveryMinutes(30);
        order.setCreatedAt(LocalDateTime.now());
        order.setBusinessSector(restaurant.getBusinessSector());
        order.setPrescriptionImageUrl(req.getPrescriptionImageUrl());
        order.setPrescriptionVerificationStatus(prescriptionVerificationStatus);

        orderRepository.save(order);

        // Copy cart items into order items and decrement stock inventory
        List<OrderItem> orderItems = new ArrayList<>();
        for (CartItem ci : cart.getItems()) {
            Dish d = ci.getDish();
            if (d != null && d.getStockQuantity() != null) {
                int newStock = Math.max(0, d.getStockQuantity() - ci.getQuantity());
                d.setStockQuantity(newStock);
                if (newStock == 0) {
                    d.setAvailable(false);
                }
                dishRepository.save(d);
            }

            OrderItem oi = new OrderItem();
            oi.setOrder(order);
            oi.setDishId(ci.getDish().getId());
            oi.setDishName(ci.getDish().getName());
            oi.setQuantity(ci.getQuantity());
            oi.setPricePerUnit(ci.getUnitPrice());
            oi.setTotalPrice(ci.getTotalPrice());
            oi.setSelectedVariant(ci.getSelectedVariantName());
            oi.setSelectedAddons(ci.getSelectedAddonsSummary());
            oi.setImageUrl(ci.getDish().getImageUrl());
            orderItemRepository.save(oi);
            orderItems.add(oi);
        }

        order.setOrderItems(orderItems);

        if (appliedCoupon != null && discountAmount.compareTo(BigDecimal.ZERO) > 0) {
            couponService.recordCouponUsage(appliedCoupon, user, orderId, discountAmount);
        }

        // Clear cart
        cart.getItems().clear();
        cart.setRestaurant(null);
        cartRepository.save(cart);

        // Notify Restaurant Partner real-time
        notificationService.notifyRestaurantNewOrder(restaurant.getId(), orderId, totalAmount.toString());

        return OrderResponseDTO.fromEntity(order);
    }

    public List<OrderResponseDTO> getUserOrders(User user) {
        List<Order> orders = orderRepository.findByUser_IdOrderByCreatedAtDesc(user.getId());
        return orders.stream().map(OrderResponseDTO::fromEntity).toList();
    }

    public OrderResponseDTO getOrderById(String orderId, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId()) && user.getRole() == Role.CUSTOMER) {
            throw new IllegalArgumentException("Unauthorized to view this order");
        }

        return OrderResponseDTO.fromEntity(order);
    }

    @Transactional
    public OrderResponseDTO updateOrderStatus(String orderId, OrderStatus newStatus, String riderName, String riderPhone, Integer etaMinutes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        order.setStatus(newStatus);
        if (riderName != null) order.setRiderName(riderName);
        if (riderPhone != null) order.setRiderPhone(riderPhone);
        if (etaMinutes != null) order.setEstimatedDeliveryMinutes(etaMinutes);

        if (newStatus == OrderStatus.DELIVERED) {
            order.setDeliveredAt(LocalDateTime.now());
            order.setPaymentStatus(PaymentStatus.COMPLETED);
            loyaltyService.earnPoints(order.getUser(), order.getTotalAmount());
        }

        orderRepository.save(order);

        String message = switch (newStatus) {
            case ACCEPTED -> "Your order has been accepted by " + order.getRestaurant().getName() + "!";
            case PREPARING -> "Chef is preparing your fresh meal!";
            case READY_FOR_PICKUP -> "Food is packed and ready for delivery partner.";
            case OUT_FOR_DELIVERY -> "Delivery partner is on the way to your location!";
            case DELIVERED -> "Your order has been delivered. Enjoy your meal!";
            case CANCELLED -> "Order has been cancelled.";
            default -> "Order status updated to " + newStatus;
        };

        notificationService.sendOrderUpdate(orderId, newStatus.name(), message, etaMinutes);

        return OrderResponseDTO.fromEntity(order);
    }

    @Transactional
    public String requestCancelOrder(String orderId, String reason, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized action");
        }

        if (order.getStatus() != OrderStatus.PLACED && order.getStatus() != OrderStatus.ACCEPTED) {
            throw new IllegalStateException("Cannot cancel order once food preparation has started.");
        }

        order.setStatus(OrderStatus.CANCEL_REQUESTED);
        order.setCancelReason(reason);
        orderRepository.save(order);

        notificationService.sendOrderUpdate(orderId, OrderStatus.CANCEL_REQUESTED.name(),
                "Cancellation requested: " + reason, null);

        return "Cancellation request submitted to restaurant.";
    }

    @Transactional
    public OrderDispute raiseDispute(String orderId, String reason, String details, String evidenceImageUrl, User user) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        if (!order.getUser().getId().equals(user.getId())) {
            throw new IllegalArgumentException("Unauthorized action: You did not place this order.");
        }

        OrderDispute dispute = new OrderDispute();
        dispute.setOrder(order);
        dispute.setUser(user);
        dispute.setRestaurant(order.getRestaurant());
        dispute.setDisputeReason(reason != null ? reason : "OTHER");
        dispute.setDisputeDetails(details);
        dispute.setEvidenceImageUrl(evidenceImageUrl);
        dispute.setStatus("OPEN");
        dispute.setCreatedAt(LocalDateTime.now());

        return disputeRepository.save(dispute);
    }

    @Transactional
    public OrderResponseDTO verifyPrescription(String orderId, boolean approved, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        if (approved) {
            order.setPrescriptionVerificationStatus("APPROVED");
            order.setPrescriptionNotes(notes != null ? notes : "Prescription verified by pharmacist.");
            notificationService.sendOrderUpdate(orderId, order.getStatus().name(),
                    "Prescription approved by pharmacist. Preparing your medicine package.", order.getEstimatedDeliveryMinutes());
        } else {
            order.setPrescriptionVerificationStatus("REJECTED");
            order.setStatus(OrderStatus.CANCELLED);
            order.setCancelReason("Prescription rejected: " + (notes != null ? notes : "Invalid or expired prescription."));
            notificationService.sendOrderUpdate(orderId, OrderStatus.CANCELLED.name(),
                    "Order cancelled: Prescription rejected by pharmacist - " + (notes != null ? notes : "Invalid prescription."), 0);
        }

        return OrderResponseDTO.fromEntity(orderRepository.save(order));
    }
}
