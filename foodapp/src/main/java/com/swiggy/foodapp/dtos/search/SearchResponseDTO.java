package com.swiggy.foodapp.dtos.search;

import com.swiggy.foodapp.dtos.menu.MenuDTOs.DishDTO;
import com.swiggy.foodapp.dtos.restaurant.RestaurantDTOs.RestaurantSummaryDTO;

import java.util.List;

public class SearchResponseDTO {
    private String query;
    private List<RestaurantSummaryDTO> restaurants;
    private List<DishDTO> dishes;

    public SearchResponseDTO(String query, List<RestaurantSummaryDTO> restaurants, List<DishDTO> dishes) {
        this.query = query;
        this.restaurants = restaurants;
        this.dishes = dishes;
    }

    public String getQuery() { return query; }
    public void setQuery(String query) { this.query = query; }
    public List<RestaurantSummaryDTO> getRestaurants() { return restaurants; }
    public void setRestaurants(List<RestaurantSummaryDTO> restaurants) { this.restaurants = restaurants; }
    public List<DishDTO> getDishes() { return dishes; }
    public void setDishes(List<DishDTO> dishes) { this.dishes = dishes; }
}
