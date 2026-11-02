package com.swiggy.foodapp.dtos.menu;

import com.swiggy.foodapp.entities.Category;
import com.swiggy.foodapp.entities.Dish;
import com.swiggy.foodapp.entities.DishAddon;
import com.swiggy.foodapp.entities.DishVariant;

import java.math.BigDecimal;
import java.util.List;
import java.util.stream.Collectors;

public class MenuDTOs {

    public static class DishVariantDTO {
        private Long id;
        private String variantName;
        private BigDecimal price;

        public static DishVariantDTO fromEntity(DishVariant v) {
            DishVariantDTO dto = new DishVariantDTO();
            dto.setId(v.getId());
            dto.setVariantName(v.getVariantName());
            dto.setPrice(v.getPrice());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getVariantName() { return variantName; }
        public void setVariantName(String variantName) { this.variantName = variantName; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
    }

    public static class DishAddonDTO {
        private Long id;
        private String addonName;
        private BigDecimal price;

        public static DishAddonDTO fromEntity(DishAddon a) {
            DishAddonDTO dto = new DishAddonDTO();
            dto.setId(a.getId());
            dto.setAddonName(a.getAddonName());
            dto.setPrice(a.getPrice());
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getAddonName() { return addonName; }
        public void setAddonName(String addonName) { this.addonName = addonName; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
    }

    public static class DishDTO {
        private Long id;
        private Long restaurantId;
        private String restaurantName;
        private Long categoryId;
        private String categoryName;
        private String name;
        private String description;
        private BigDecimal price;
        private String imageUrl;
        private boolean isVeg;
        private boolean isAvailable;
        private boolean isBestseller;
        private Integer prepTimeMinutes;
        private BigDecimal mrp;
        private String unit;
        private String brand;
        private Integer stockQuantity;
        private boolean prescriptionRequired;
        private String barcode;
        private List<DishVariantDTO> variants;
        private List<DishAddonDTO> addons;

        public static DishDTO fromEntity(Dish d) {
            DishDTO dto = new DishDTO();
            dto.setId(d.getId());
            if (d.getRestaurant() != null) {
                dto.setRestaurantId(d.getRestaurant().getId());
                dto.setRestaurantName(d.getRestaurant().getName());
            }
            if (d.getCategory() != null) {
                dto.setCategoryId(d.getCategory().getId());
                dto.setCategoryName(d.getCategory().getName());
            }
            dto.setName(d.getName());
            dto.setDescription(d.getDescription());
            dto.setPrice(d.getPrice());
            dto.setImageUrl(d.getImageUrl());
            dto.setVeg(d.isVeg());
            dto.setAvailable(d.isAvailable());
            dto.setBestseller(d.isBestseller());
            dto.setPrepTimeMinutes(d.getPrepTimeMinutes());
            dto.setMrp(d.getMrp());
            dto.setUnit(d.getUnit());
            dto.setBrand(d.getBrand());
            dto.setStockQuantity(d.getStockQuantity());
            dto.setPrescriptionRequired(d.isPrescriptionRequired());
            dto.setBarcode(d.getBarcode());

            if (d.getVariants() != null) {
                dto.setVariants(d.getVariants().stream().map(DishVariantDTO::fromEntity).collect(Collectors.toList()));
            }
            if (d.getAddons() != null) {
                dto.setAddons(d.getAddons().stream().map(DishAddonDTO::fromEntity).collect(Collectors.toList()));
            }
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public Long getRestaurantId() { return restaurantId; }
        public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
        public String getRestaurantName() { return restaurantName; }
        public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
        public Long getCategoryId() { return categoryId; }
        public void setCategoryId(Long categoryId) { this.categoryId = categoryId; }
        public String getCategoryName() { return categoryName; }
        public void setCategoryName(String categoryName) { this.categoryName = categoryName; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public BigDecimal getPrice() { return price; }
        public void setPrice(BigDecimal price) { this.price = price; }
        public String getImageUrl() { return imageUrl; }
        public void setImageUrl(String imageUrl) { this.imageUrl = imageUrl; }
        public boolean isVeg() { return isVeg; }
        public void setVeg(boolean veg) { isVeg = veg; }
        public boolean isAvailable() { return isAvailable; }
        public void setAvailable(boolean available) { isAvailable = available; }
        public boolean isBestseller() { return isBestseller; }
        public void setBestseller(boolean bestseller) { isBestseller = bestseller; }
        public Integer getPrepTimeMinutes() { return prepTimeMinutes; }
        public void setPrepTimeMinutes(Integer prepTimeMinutes) { this.prepTimeMinutes = prepTimeMinutes; }
        public BigDecimal getMrp() { return mrp; }
        public void setMrp(BigDecimal mrp) { this.mrp = mrp; }
        public String getUnit() { return unit; }
        public void setUnit(String unit) { this.unit = unit; }
        public String getBrand() { return brand; }
        public void setBrand(String brand) { this.brand = brand; }
        public Integer getStockQuantity() { return stockQuantity; }
        public void setStockQuantity(Integer stockQuantity) { this.stockQuantity = stockQuantity; }
        public boolean isPrescriptionRequired() { return prescriptionRequired; }
        public void setPrescriptionRequired(boolean prescriptionRequired) { this.prescriptionRequired = prescriptionRequired; }
        public String getBarcode() { return barcode; }
        public void setBarcode(String barcode) { this.barcode = barcode; }
        public List<DishVariantDTO> getVariants() { return variants; }
        public void setVariants(List<DishVariantDTO> variants) { this.variants = variants; }
        public List<DishAddonDTO> getAddons() { return addons; }
        public void setAddons(List<DishAddonDTO> addons) { this.addons = addons; }
    }

    public static class CategoryWithDishesDTO {
        private Long id;
        private String name;
        private List<DishDTO> dishes;

        public static CategoryWithDishesDTO of(Category c, List<DishDTO> dishes) {
            CategoryWithDishesDTO dto = new CategoryWithDishesDTO();
            dto.setId(c.getId());
            dto.setName(c.getName());
            dto.setDishes(dishes);
            return dto;
        }

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public List<DishDTO> getDishes() { return dishes; }
        public void setDishes(List<DishDTO> dishes) { this.dishes = dishes; }
    }
}
