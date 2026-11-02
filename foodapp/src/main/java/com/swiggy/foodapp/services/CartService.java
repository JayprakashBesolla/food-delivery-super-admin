package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.cart.CartDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.exceptions.RestaurantConflictException;
import com.swiggy.foodapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class CartService {

    @Autowired
    private CartRepository cartRepository;

    @Autowired
    private CartItemRepository cartItemRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private DishVariantRepository dishVariantRepository;

    @Autowired
    private DishAddonRepository dishAddonRepository;

    public Cart getOrCreateCart(User user) {
        return cartRepository.findByUser_Id(user.getId())
                .orElseGet(() -> cartRepository.save(new Cart(user)));
    }

    @Transactional
    public CartResponseDTO getCartResponse(User user) {
        Cart cart = getOrCreateCart(user);
        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponseDTO addToCart(User user, AddToCartRequest req) {
        Dish dish = dishRepository.findById(req.getDishId())
                .orElseThrow(() -> new NoSuchElementException("Dish not found: " + req.getDishId()));

        Restaurant dishRestaurant = dish.getRestaurant();
        Cart cart = getOrCreateCart(user);

        // Swiggy Cart Guard: Single restaurant enforcement
        if (cart.getRestaurant() != null && !cart.getItems().isEmpty() &&
                !cart.getRestaurant().getId().equals(dishRestaurant.getId())) {

            if (!req.isForceReplaceCart()) {
                throw new RestaurantConflictException(
                        cart.getRestaurant().getId(),
                        cart.getRestaurant().getName(),
                        cart.getRestaurant().getBusinessSector(),
                        dishRestaurant.getId(),
                        dishRestaurant.getName(),
                        dishRestaurant.getBusinessSector()
                );
            } else {
                // User approved replacing cart: clear old items and switch restaurant
                cart.getItems().clear();
                cartItemRepository.deleteByCart_Id(cart.getId());
                cart.setRestaurant(dishRestaurant);
            }
        }

        if (cart.getRestaurant() == null) {
            cart.setRestaurant(dishRestaurant);
        }

        // Determine price based on variant and addons
        BigDecimal unitPrice = dish.getPrice();
        String variantName = null;
        BigDecimal variantPrice = null;

        if (req.getVariantId() != null) {
            DishVariant variant = dishVariantRepository.findById(req.getVariantId()).orElse(null);
            if (variant != null) {
                variantName = variant.getVariantName();
                variantPrice = variant.getPrice();
                unitPrice = variantPrice;
            }
        }

        StringBuilder addonsSummary = new StringBuilder();
        BigDecimal addonsTotal = BigDecimal.ZERO;
        if (req.getAddonIds() != null && !req.getAddonIds().isEmpty()) {
            List<DishAddon> addons = dishAddonRepository.findAllById(req.getAddonIds());
            for (int i = 0; i < addons.size(); i++) {
                DishAddon a = addons.get(i);
                addonsTotal = addonsTotal.add(a.getPrice());
                if (i > 0) addonsSummary.append(", ");
                addonsSummary.append(a.getAddonName()).append(" (+₹").append(a.getPrice()).append(")");
            }
        }

        BigDecimal effectiveUnitPrice = unitPrice.add(addonsTotal);

        // Check if matching item already in cart
        CartItem existingItem = null;
        for (CartItem item : cart.getItems()) {
            boolean sameDish = item.getDish().getId().equals(dish.getId());
            boolean sameVariant = (variantName == null && item.getSelectedVariantName() == null) ||
                    (variantName != null && variantName.equals(item.getSelectedVariantName()));
            boolean sameAddons = (addonsSummary.length() == 0 && item.getSelectedAddonsSummary() == null) ||
                    (addonsSummary.toString().equals(item.getSelectedAddonsSummary()));

            if (sameDish && sameVariant && sameAddons) {
                existingItem = item;
                break;
            }
        }

        if (existingItem != null) {
            existingItem.setQuantity(existingItem.getQuantity() + (req.getQuantity() != null ? req.getQuantity() : 1));
            existingItem.setTotalPrice(effectiveUnitPrice.multiply(BigDecimal.valueOf(existingItem.getQuantity())));
            cartItemRepository.save(existingItem);
        } else {
            CartItem newItem = new CartItem();
            newItem.setCart(cart);
            newItem.setDish(dish);
            newItem.setQuantity(req.getQuantity() != null ? req.getQuantity() : 1);
            newItem.setSelectedVariantName(variantName);
            newItem.setSelectedVariantPrice(variantPrice);
            newItem.setSelectedAddonsSummary(addonsSummary.length() > 0 ? addonsSummary.toString() : null);
            newItem.setAddonsTotalPrice(addonsTotal);
            newItem.setUnitPrice(effectiveUnitPrice);
            newItem.setTotalPrice(effectiveUnitPrice.multiply(BigDecimal.valueOf(newItem.getQuantity())));

            cart.getItems().add(newItem);
            cartItemRepository.save(newItem);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponseDTO updateItemQuantity(User user, Long itemId, int quantity) {
        Cart cart = getOrCreateCart(user);
        CartItem item = cartItemRepository.findById(itemId)
                .orElseThrow(() -> new NoSuchElementException("Cart item not found: " + itemId));

        if (!item.getCart().getId().equals(cart.getId())) {
            throw new IllegalArgumentException("Unauthorized modification of cart item");
        }

        if (quantity <= 0) {
            cart.getItems().remove(item);
            cartItemRepository.delete(item);
            if (cart.getItems().isEmpty()) {
                cart.setRestaurant(null);
            }
        } else {
            item.setQuantity(quantity);
            item.setTotalPrice(item.getUnitPrice().multiply(BigDecimal.valueOf(quantity)));
            cartItemRepository.save(item);
        }

        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    @Transactional
    public CartResponseDTO clearCart(User user) {
        Cart cart = getOrCreateCart(user);
        cart.getItems().clear();
        cartItemRepository.deleteByCart_Id(cart.getId());
        cart.setRestaurant(null);
        cart.setUpdatedAt(LocalDateTime.now());
        cartRepository.save(cart);

        return buildCartResponse(cart);
    }

    private CartResponseDTO buildCartResponse(Cart cart) {
        CartResponseDTO dto = new CartResponseDTO();
        dto.setCartId(cart.getId());

        List<CartItemDTO> itemDTOs = new ArrayList<>();
        BigDecimal itemTotal = BigDecimal.ZERO;

        for (CartItem ci : cart.getItems()) {
            CartItemDTO itemDTO = new CartItemDTO();
            itemDTO.setItemId(ci.getId());
            itemDTO.setDishId(ci.getDish().getId());
            itemDTO.setDishName(ci.getDish().getName());
            itemDTO.setImageUrl(ci.getDish().getImageUrl());
            itemDTO.setVeg(ci.getDish().isVeg());
            itemDTO.setQuantity(ci.getQuantity());
            itemDTO.setSelectedVariant(ci.getSelectedVariantName());
            itemDTO.setSelectedAddons(ci.getSelectedAddonsSummary());
            itemDTO.setUnitPrice(ci.getUnitPrice());
            itemDTO.setTotalPrice(ci.getTotalPrice());

            itemDTOs.add(itemDTO);
            itemTotal = itemTotal.add(ci.getTotalPrice());
        }

        dto.setItems(itemDTOs);

        BillSummaryDTO bill = new BillSummaryDTO();
        bill.setItemTotal(itemTotal);

        if (cart.getRestaurant() != null && !itemDTOs.isEmpty()) {
            Restaurant r = cart.getRestaurant();
            dto.setRestaurantId(r.getId());
            dto.setRestaurantName(r.getName());
            dto.setRestaurantArea(r.getArea());
            dto.setRestaurantLogo(r.getLogoUrl());

            BigDecimal packagingFee = r.getPackagingFee() != null ? r.getPackagingFee() : BigDecimal.valueOf(15.0);
            bill.setPackagingFee(packagingFee);

            BigDecimal taxPercentage = r.getTaxPercentage() != null ? r.getTaxPercentage() : BigDecimal.valueOf(5.0);
            BigDecimal taxAmount = itemTotal.multiply(taxPercentage).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
            bill.setTaxAmount(taxAmount);

            BigDecimal freeThreshold = r.getFreeDeliveryThreshold() != null ? r.getFreeDeliveryThreshold() : BigDecimal.valueOf(500.0);
            bill.setFreeDeliveryThreshold(freeThreshold);

            BigDecimal deliveryFee = BigDecimal.ZERO;
            if (itemTotal.compareTo(freeThreshold) < 0) {
                deliveryFee = r.getDeliveryFee() != null ? r.getDeliveryFee() : BigDecimal.valueOf(40.0);
                bill.setFreeDelivery(false);
            } else {
                bill.setFreeDelivery(true);
            }
            bill.setDeliveryFee(deliveryFee);

            BigDecimal grandTotal = itemTotal.add(deliveryFee).add(packagingFee).add(taxAmount);
            bill.setGrandTotal(grandTotal);
        } else {
            bill.setGrandTotal(BigDecimal.ZERO);
        }

        dto.setBill(bill);
        return dto;
    }
}
