package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.menu.MenuDTOs.DishDTO;
import com.swiggy.foodapp.dtos.restaurant.RestaurantDTOs.RestaurantSummaryDTO;
import com.swiggy.foodapp.dtos.search.SearchResponseDTO;
import com.swiggy.foodapp.entities.Dish;
import com.swiggy.foodapp.entities.Restaurant;
import com.swiggy.foodapp.repositories.DishRepository;
import com.swiggy.foodapp.repositories.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class SearchService {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DishRepository dishRepository;

    public SearchResponseDTO search(String query) {
        return search(query, null);
    }

    public SearchResponseDTO search(String query, com.swiggy.foodapp.entities.BusinessSector sector) {
        if (query == null || query.trim().isEmpty()) {
            return new SearchResponseDTO(query, Collections.emptyList(), Collections.emptyList());
        }

        String q = query.trim();
        List<Restaurant> restaurants;
        List<Dish> dishes;

        if (sector != null) {
            restaurants = restaurantRepository.searchRestaurantsBySector(q, sector);
            dishes = dishRepository.searchDishesBySector(q, sector);
        } else {
            restaurants = restaurantRepository.searchRestaurants(q);
            dishes = dishRepository.searchDishesAcrossRestaurants(q);
        }

        List<RestaurantSummaryDTO> restaurantDTOs = restaurants.stream()
                .map(RestaurantSummaryDTO::fromEntity)
                .collect(Collectors.toList());

        List<DishDTO> dishDTOs = dishes.stream()
                .map(DishDTO::fromEntity)
                .collect(Collectors.toList());

        return new SearchResponseDTO(q, restaurantDTOs, dishDTOs);
    }
}
