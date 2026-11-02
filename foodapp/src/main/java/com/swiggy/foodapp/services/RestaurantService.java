package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.menu.MenuDTOs.*;
import com.swiggy.foodapp.dtos.restaurant.RestaurantDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.util.*;
import java.util.stream.Collectors;

@Service
public class RestaurantService {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private MealComboRepository mealComboRepository;

    public List<RestaurantSummaryDTO> getRestaurants(String city, String cuisine, Boolean isVeg, Double minRating, String sortBy, BusinessSector sector) {
        List<Restaurant> list;

        if (sector != null) {
            if (city != null && !city.trim().isEmpty()) {
                list = restaurantRepository.findByCityIgnoreCaseAndBusinessSectorAndStatus(city.trim(), sector, RestaurantStatus.ACTIVE);
            } else {
                list = restaurantRepository.findByBusinessSectorAndStatus(sector, RestaurantStatus.ACTIVE);
            }
        } else {
            if (city != null && !city.trim().isEmpty()) {
                list = restaurantRepository.findByCityIgnoreCaseAndStatus(city.trim(), RestaurantStatus.ACTIVE);
            } else {
                list = restaurantRepository.findByStatus(RestaurantStatus.ACTIVE);
            }
        }

        // Filter by cuisine
        if (cuisine != null && !cuisine.trim().isEmpty()) {
            String query = cuisine.trim().toLowerCase();
            list = list.stream()
                    .filter(r -> r.getCuisines() != null && r.getCuisines().toLowerCase().contains(query))
                    .collect(Collectors.toList());
        }

        // Filter pure veg
        if (Boolean.TRUE.equals(isVeg)) {
            list = list.stream()
                    .filter(Restaurant::isPureVeg)
                    .collect(Collectors.toList());
        }

        // Filter min rating
        if (minRating != null && minRating > 0) {
            list = list.stream()
                    .filter(r -> r.getAvgRating() != null && r.getAvgRating() >= minRating)
                    .collect(Collectors.toList());
        }

        // Sort
        if ("rating".equalsIgnoreCase(sortBy)) {
            list.sort(Comparator.comparing(Restaurant::getAvgRating, Comparator.nullsLast(Comparator.reverseOrder())));
        } else if ("cost_low".equalsIgnoreCase(sortBy)) {
            list.sort(Comparator.comparing(Restaurant::getCostForTwo, Comparator.nullsLast(Comparator.naturalOrder())));
        } else if ("cost_high".equalsIgnoreCase(sortBy)) {
            list.sort(Comparator.comparing(Restaurant::getCostForTwo, Comparator.nullsLast(Comparator.reverseOrder())));
        } else if ("delivery_time".equalsIgnoreCase(sortBy)) {
            list.sort(Comparator.comparing(Restaurant::getDistanceKm, Comparator.nullsLast(Comparator.naturalOrder())));
        }

        return list.stream().map(RestaurantSummaryDTO::fromEntity).collect(Collectors.toList());
    }

    public RestaurantDetailDTO getRestaurantById(Long id) {
        Restaurant r = restaurantRepository.findById(id)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found with id: " + id));
        return RestaurantDetailDTO.fromEntity(r);
    }

    public RestaurantDetailDTO getRestaurantBySlug(String slug) {
        Restaurant r = restaurantRepository.findBySlug(slug)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found with slug: " + slug));
        return RestaurantDetailDTO.fromEntity(r);
    }

    public Map<String, Object> getRestaurantMenu(Long restaurantId) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found with id: " + restaurantId));

        List<Category> categories = categoryRepository.findByRestaurant_IdOrderByDisplayOrderAsc(restaurantId);
        List<Dish> allDishes = dishRepository.findByRestaurant_Id(restaurantId);

        Map<Long, List<DishDTO>> dishMap = new HashMap<>();
        List<DishDTO> uncategorized = new ArrayList<>();

        for (Dish d : allDishes) {
            DishDTO dto = DishDTO.fromEntity(d);
            if (d.getCategory() != null) {
                dishMap.computeIfAbsent(d.getCategory().getId(), k -> new ArrayList<>()).add(dto);
            } else {
                uncategorized.add(dto);
            }
        }

        List<CategoryWithDishesDTO> categoryDTOs = new ArrayList<>();
        for (Category c : categories) {
            List<DishDTO> dishes = dishMap.getOrDefault(c.getId(), Collections.emptyList());
            categoryDTOs.add(CategoryWithDishesDTO.of(c, dishes));
        }

        if (!uncategorized.isEmpty()) {
            Category dummy = new Category();
            dummy.setId(0L);
            dummy.setName("More Dishes");
            categoryDTOs.add(CategoryWithDishesDTO.of(dummy, uncategorized));
        }

        List<MealCombo> combos = mealComboRepository.findByRestaurant_IdAndIsActiveTrue(restaurantId);

        Map<String, Object> response = new HashMap<>();
        response.put("restaurant", RestaurantDetailDTO.fromEntity(restaurant));
        response.put("categories", categoryDTOs);
        response.put("combos", combos);

        return response;
    }
}
