package com.swiggy.foodapp.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "cart_items")
public class CartItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "cart_id", nullable = false)
    @JsonIgnore
    private Cart cart;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dish_id", nullable = false)
    private Dish dish;

    @Column(nullable = false)
    private Integer quantity = 1;

    private String selectedVariantName;
    private BigDecimal selectedVariantPrice;

    private String selectedAddonsSummary;
    private BigDecimal addonsTotalPrice = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal unitPrice;

    @Column(nullable = false)
    private BigDecimal totalPrice;

    public CartItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Cart getCart() { return cart; }
    public void setCart(Cart cart) { this.cart = cart; }

    public Dish getDish() { return dish; }
    public void setDish(Dish dish) { this.dish = dish; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }

    public String getSelectedVariantName() { return selectedVariantName; }
    public void setSelectedVariantName(String selectedVariantName) { this.selectedVariantName = selectedVariantName; }

    public BigDecimal getSelectedVariantPrice() { return selectedVariantPrice; }
    public void setSelectedVariantPrice(BigDecimal selectedVariantPrice) { this.selectedVariantPrice = selectedVariantPrice; }

    public String getSelectedAddonsSummary() { return selectedAddonsSummary; }
    public void setSelectedAddonsSummary(String selectedAddonsSummary) { this.selectedAddonsSummary = selectedAddonsSummary; }

    public BigDecimal getAddonsTotalPrice() { return addonsTotalPrice; }
    public void setAddonsTotalPrice(BigDecimal addonsTotalPrice) { this.addonsTotalPrice = addonsTotalPrice; }

    public BigDecimal getUnitPrice() { return unitPrice; }
    public void setUnitPrice(BigDecimal unitPrice) { this.unitPrice = unitPrice; }

    public BigDecimal getTotalPrice() { return totalPrice; }
    public void setTotalPrice(BigDecimal totalPrice) { this.totalPrice = totalPrice; }
}
