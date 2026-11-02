package com.swiggy.foodapp.dtos.cart;

import java.math.BigDecimal;
import java.util.List;

public class CartDTOs {

    public static class AddToCartRequest {
        private Long dishId;
        private Integer quantity = 1;
        private Long variantId;
        private List<Long> addonIds;
        private boolean forceReplaceCart = false; // if user accepts "Discard & Add"

        public Long getDishId() { return dishId; }
        public void setDishId(Long dishId) { this.dishId = dishId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public Long getVariantId() { return variantId; }
        public void setVariantId(Long variantId) { this.variantId = variantId; }
        public List<Long> getAddonIds() { return addonIds; }
        public void setAddonIds(List<Long> addonIds) { this.addonIds = addonIds; }
        public boolean isForceReplaceCart() { return forceReplaceCart; }
        public void setForceReplaceCart(boolean forceReplaceCart) { this.forceReplaceCart = forceReplaceCart; }
    }

    public static class UpdateCartItemRequest {
        private Integer quantity;

        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }

    public static class CartItemDTO {
        private Long itemId;
        private Long dishId;
        private String dishName;
        private String imageUrl;
        private boolean isVeg;
        private Integer quantity;
        private String selectedVariant;
        private String selectedAddons;
        private BigDecimal unitPrice;
        private BigDecimal totalPrice;

        public Long getItemId() { return itemId; }
        public void setItemId(Long itemId) { this.itemId = itemId; }
        public Long getDishId() { return dishId; }
        public void setDishId(Long dishId) { this.dishId = dishId; }
        public String getDishName() { return dishName; }
        public void setDishName(String dishName) { this.dishName = dishName; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public boolean isVeg() { return isVeg; }
        public void setVeg(boolean veg) { isVeg = veg; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
        public String getSelectedVariant() { return selectedVariant; }
        public void setSelectedVariant(String selectedVariant) { this.selectedVariant = selectedVariant; }
        public String getSelectedAddons() { return selectedAddons; }
        public void setSelectedAddons(String selectedAddons) { this.selectedAddons = selectedAddons; }
        public BigDecimal getUnitPrice() { return unitPrice; }
        public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }
        public BigDecimal getTotalPrice() { return totalPrice; }
        public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
    }

    public static class BillSummaryDTO {
        private BigDecimal itemTotal = BigDecimal.ZERO;
        private BigDecimal deliveryFee = BigDecimal.ZERO;
        private BigDecimal packagingFee = BigDecimal.ZERO;
        private BigDecimal taxAmount = BigDecimal.ZERO;
        private BigDecimal discountAmount = BigDecimal.ZERO;
        private BigDecimal grandTotal = BigDecimal.ZERO;
        private boolean isFreeDelivery = false;
        private BigDecimal freeDeliveryThreshold = BigDecimal.ZERO;

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
        public BigDecimal getGrandTotal() { return grandTotal; }
        public void setGrandTotal(BigDecimal grandTotal) { this.grandTotal = grandTotal; }
        public boolean isFreeDelivery() { return isFreeDelivery; }
        public void setFreeDelivery(boolean freeDelivery) { isFreeDelivery = freeDelivery; }
        public BigDecimal getFreeDeliveryThreshold() { return freeDeliveryThreshold; }
        public void setFreeDeliveryThreshold(BigDecimal freeDeliveryThreshold) { this.freeDeliveryThreshold = freeDeliveryThreshold; }
    }

    public static class CartResponseDTO {
        private Long cartId;
        private Long restaurantId;
        private String restaurantName;
        private String restaurantArea;
        private String restaurantLogo;
        private List<CartItemDTO> items;
        private BillSummaryDTO bill;

        public Long getCartId() { return cartId; }
        public void setCartId(Long cartId) { this.cartId = cartId; }
        public Long getRestaurantId() { return restaurantId; }
        public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
        public String getRestaurantName() { return restaurantName; }
        public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
        public String getRestaurantArea() { return restaurantArea; }
        public void setRestaurantArea(String restaurantArea) { this.restaurantArea = restaurantArea; }
        public String getRestaurantLogo() { return restaurantLogo; }
        public void setRestaurantLogo(String restaurantLogo) { this.restaurantLogo = restaurantLogo; }
        public List<CartItemDTO> getItems() { return items; }
        public void setItems(List<CartItemDTO> items) { this.items = items; }
        public BillSummaryDTO getBill() { return bill; }
        public void setBill(BillSummaryDTO bill) { this.bill = bill; }
    }
}
