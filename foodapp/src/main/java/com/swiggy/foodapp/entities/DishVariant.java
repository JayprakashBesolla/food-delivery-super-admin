package com.swiggy.foodapp.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "dish_variants")
public class DishVariant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "dish_id", nullable = false)
    @JsonIgnore
    private Dish dish;

    @Column(nullable = false)
    private String variantName; // e.g., "Regular", "Large", "Full Portion"

    @Column(nullable = false)
    private BigDecimal price;

    public DishVariant() {}

    public DishVariant(Dish dish, String variantName, BigDecimal price) {
        this.dish = dish;
        this.variantName = variantName;
        this.price = price;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public Dish getDish() { return dish; }
    public void setDish(Dish dish) { this.dish = dish; }

    public String getVariantName() { return variantName; }
    public void setVariantName(String variantName) { this.variantName = variantName; }

    public BigDecimal getPrice() { return price; }
    public void setPrice(BigDecimal price) { this.price = price; }
}
