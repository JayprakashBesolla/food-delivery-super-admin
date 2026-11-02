package com.swiggy.foodapp.dtos.order;

import com.swiggy.foodapp.entities.*;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

public class OrderDTOs {

    public static class PlaceOrderRequest {
        private OrderType orderType = OrderType.DELIVERY;
        private PaymentMethod paymentMethod = PaymentMethod.CASH_ON_DELIVERY;
        private Long addressId;
        private String customAddress;
        private Double latitude;
        private Double longitude;
        private String tableNumber;
        private String specialInstructions;
        private String couponCode;
        private String prescriptionImageUrl; // For Pharmacy orders requiring doctor prescription

        public OrderType getOrderType() { return orderType; }
        public void setOrderType(OrderType orderType) { this.orderType = orderType; }
        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        public Long getAddressId() { return addressId; }
        public void setAddressId(Long addressId) { this.addressId = addressId; }
        public String getCustomAddress() { return customAddress; }
        public void setCustomAddress(String customAddress) { this.customAddress = customAddress; }
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
        public String getTableNumber() { return tableNumber; }
        public void setTableNumber(String tableNumber) { this.tableNumber = tableNumber; }
        public String getSpecialInstructions() { return specialInstructions; }
        public void setSpecialInstructions(String specialInstructions) { this.specialInstructions = specialInstructions; }
        public String getCouponCode() { return couponCode; }
        public void setCouponCode(String couponCode) { this.couponCode = couponCode; }
        public String getPrescriptionImageUrl() { return prescriptionImageUrl; }
        public void setPrescriptionImageUrl(String prescriptionImageUrl) { this.prescriptionImageUrl = prescriptionImageUrl; }
    }

    public static class OrderItemSummaryDTO {
        private Long dishId;
        private String dishName;
        private Integer quantity;
        private BigDecimal pricePerUnit;
        private BigDecimal totalPrice;
        private String selectedVariant;
        private String selectedAddons;
        private String imageUrl;

        public static OrderItemSummaryDTO fromEntity(OrderItem item) {
            OrderItemSummaryDTO dto = new OrderItemSummaryDTO();
            dto.setDishId(item.getDishId());
            dto.setDishName(item.getDishName());
            dto.setQuantity(item.getQuantity());
            dto.setPricePerUnit(item.getPricePerUnit());
            dto.setTotalPrice(item.getTotalPrice());
            dto.setSelectedVariant(item.getSelectedVariant());
            dto.setSelectedAddons(item.getSelectedAddons());
            dto.setImageUrl(item.getImageUrl());
            return dto;
        }

        public Long getDishId() { return dishId; }
        public void setDishId(Long dishId) { this.dishId = dishId; }
        public String getDishName() { return dishName; }
        public void setDishName(String dishName) { this.dishName = dishName; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public BigDecimal getPricePerUnit() { return pricePerUnit; }
        public void setPricePerUnit(BigDecimal pricePerUnit) { this.pricePerUnit = pricePerUnit; }
        public BigDecimal getTotalPrice() { return totalPrice; }
        public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
        public String getSelectedVariant() { return selectedVariant; }
        public void setSelectedVariant(String selectedVariant) { this.selectedVariant = selectedVariant; }
        public String getSelectedAddons() { return selectedAddons; }
        public void setSelectedAddons(String selectedAddons) { this.selectedAddons = selectedAddons; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
    }

    public static class OrderResponseDTO {
        private String orderId;
        private Long restaurantId;
        private String restaurantName;
        private String restaurantArea;
        private String restaurantLogo;
        private OrderType orderType;
        private OrderStatus status;
        private PaymentMethod paymentMethod;
        private PaymentStatus paymentStatus;
        private String deliveryAddress;
        private BigDecimal itemTotal;
        private BigDecimal deliveryFee;
        private BigDecimal packagingFee;
        private BigDecimal taxAmount;
        private BigDecimal discountAmount;
        private BigDecimal totalAmount;
        private String riderName;
        private String riderPhone;
        private Integer estimatedDeliveryMinutes;
        private LocalDateTime createdAt;
        private BusinessSector businessSector;
        private String prescriptionImageUrl;
        private String prescriptionVerificationStatus;
        private String prescriptionNotes;
        private List<OrderItemSummaryDTO> items;

        public static OrderResponseDTO fromEntity(Order o) {
            OrderResponseDTO dto = new OrderResponseDTO();
            dto.setOrderId(o.getOrderId());
            if (o.getRestaurant() != null) {
                dto.setRestaurantId(o.getRestaurant().getId());
                dto.setRestaurantName(o.getRestaurant().getName());
                dto.setRestaurantArea(o.getRestaurant().getArea());
                dto.setRestaurantLogo(o.getRestaurant().getLogoUrl());
            }
            dto.setOrderType(o.getOrderType());
            dto.setStatus(o.getStatus());
            dto.setPaymentMethod(o.getPaymentMethod());
            dto.setPaymentStatus(o.getPaymentStatus());
            dto.setDeliveryAddress(o.getDeliveryAddress());
            dto.setItemTotal(o.getItemTotal());
            dto.setDeliveryFee(o.getDeliveryFee());
            dto.setPackagingFee(o.getPackagingFee());
            dto.setTaxAmount(o.getTaxAmount());
            dto.setDiscountAmount(o.getDiscountAmount());
            dto.setTotalAmount(o.getTotalAmount());
            dto.setRiderName(o.getRiderName());
            dto.setRiderPhone(o.getRiderPhone());
            dto.setEstimatedDeliveryMinutes(o.getEstimatedDeliveryMinutes());
            dto.setCreatedAt(o.getCreatedAt());
            dto.setBusinessSector(o.getBusinessSector());
            dto.setPrescriptionImageUrl(o.getPrescriptionImageUrl());
            dto.setPrescriptionVerificationStatus(o.getPrescriptionVerificationStatus());
            dto.setPrescriptionNotes(o.getPrescriptionNotes());

            if (o.getOrderItems() != null) {
                dto.setItems(o.getOrderItems().stream().map(OrderItemSummaryDTO::fromEntity).toList());
            }
            return dto;
        }

        public String getOrderId() { return orderId; }
        public void setOrderId(String orderId) { this.orderId = orderId; }
        public Long getRestaurantId() { return restaurantId; }
        public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
        public String getRestaurantName() { return restaurantName; }
        public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
        public String getRestaurantArea() { return restaurantArea; }
        public void setRestaurantArea(String restaurantArea) { this.restaurantArea = restaurantArea; }
        public String getRestaurantLogo() { return restaurantLogo; }
        public void setRestaurantLogo(String restaurantLogo) { this.restaurantLogo = restaurantLogo; }
        public OrderType getOrderType() { return orderType; }
        public void setOrderType(OrderType orderType) { this.orderType = orderType; }
        public OrderStatus getStatus() { return status; }
        public void setStatus(OrderStatus status) { this.status = status; }
        public PaymentMethod getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(PaymentMethod paymentMethod) { this.paymentMethod = paymentMethod; }
        public PaymentStatus getPaymentStatus() { return paymentStatus; }
        public void setPaymentStatus(PaymentStatus paymentStatus) { this.paymentStatus = paymentStatus; }
        public String getDeliveryAddress() { return deliveryAddress; }
        public void setDeliveryAddress(String deliveryAddress) { this.deliveryAddress = deliveryAddress; }
        public BigDecimal getItemTotal() { return itemTotal; }
        public void setItemTotal(BigDecimal itemTotal) { this.itemTotal = itemTotal; }
        public BigDecimal getDeliveryFee() { return deliveryFee; }
        public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }
        public BigDecimal getPackagingFee() { return packagingFee; }
        public void setPackagingFee(BigDecimal packagingFee) { this.packagingFee = packagingFee; }
        public BigDecimal getTaxAmount() { return taxAmount; }
        public void setTaxAmount(BigDecimal taxAmount) { this.taxAmount = taxAmount; }
        public BigDecimal getDiscountAmount() { return discountAmount; }
        public void setDiscountAmount(BigDecimal discountAmount) { this.discountAmount = discountAmount; }
        public BigDecimal getTotalAmount() { return totalAmount; }
        public void setTotalAmount(BigDecimal totalAmount) { this.totalAmount = totalAmount; }
        public String getRiderName() { return riderName; }
        public void setRiderName(String riderName) { this.riderName = riderName; }
        public String getRiderPhone() { return riderPhone; }
        public void setRiderPhone(String riderPhone) { this.riderPhone = riderPhone; }
        public Integer getEstimatedDeliveryMinutes() { return estimatedDeliveryMinutes; }
        public void setEstimatedDeliveryMinutes(Integer estimatedDeliveryMinutes) { this.estimatedDeliveryMinutes = estimatedDeliveryMinutes; }
        public LocalDateTime getCreatedAt() { return createdAt; }
        public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
        public BusinessSector getBusinessSector() { return businessSector; }
        public void setBusinessSector(BusinessSector businessSector) { this.businessSector = businessSector; }
        public String getPrescriptionImageUrl() { return prescriptionImageUrl; }
        public void setPrescriptionImageUrl(String prescriptionImageUrl) { this.prescriptionImageUrl = prescriptionImageUrl; }
        public String getPrescriptionVerificationStatus() { return prescriptionVerificationStatus; }
        public void setPrescriptionVerificationStatus(String prescriptionVerificationStatus) { this.prescriptionVerificationStatus = prescriptionVerificationStatus; }
        public String getPrescriptionNotes() { return prescriptionNotes; }
        public void setPrescriptionNotes(String prescriptionNotes) { this.prescriptionNotes = prescriptionNotes; }
        public List<OrderItemSummaryDTO> getItems() { return items; }
        public void setItems(List<OrderItemSummaryDTO> items) { this.items = items; }
    }
}
