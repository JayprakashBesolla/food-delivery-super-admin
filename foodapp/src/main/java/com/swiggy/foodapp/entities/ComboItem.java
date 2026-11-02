package com.swiggy.foodapp.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;

@Entity
@Table(name = "combo_items")
public class ComboItem {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "combo_id", nullable = false)
    @JsonIgnore
    private MealCombo mealCombo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "dish_id", nullable = false)
    private Dish dish;

    private Integer quantity = 1;

    public ComboItem() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public MealCombo getMealCombo() { return mealCombo; }
    public void setMealCombo(MealCombo mealCombo) { this.mealCombo = mealCombo; }

    public Dish getDish() { return dish; }
    public void setDish(Dish dish) { this.dish = dish; }

    public Integer getQuantity() { return quantity; }
    public void setQuantity(Integer quantity) { this.quantity = quantity; }
}
