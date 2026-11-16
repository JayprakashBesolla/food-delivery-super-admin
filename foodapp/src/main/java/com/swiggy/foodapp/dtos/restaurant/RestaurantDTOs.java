package com.swiggy.foodapp.dtos.restaurant;

import com.swiggy.foodapp.entities.Restaurant;

import java.math.BigDecimal;
import java.time.LocalTime;

public class RestaurantDTOs {

    public static class RestaurantSummaryDTO {
        private Long id;
        private String name;
        private String slug;
        private String description;
        private String cuisines;
        private String logoUrl;
        private String bannerUrl;
        private String area;
        private String city;
        private boolean isOpen;
        private Double avgRating;
        private Integer totalRatings;
        private String deliveryTimeEstimate;
        private Double distanceKm;
        private BigDecimal costForTwo;
        private BigDecimal deliveryFee;
        private BigDecimal freeDeliveryThreshold;
        private boolean isPureVeg;
        private com.swiggy.foodapp.entities.BusinessSector businessSector;
        private boolean isQuickCommerce;
        private String sectorDisplayName;

        public static RestaurantSummaryDTO fromEntity(Restaurant r) {
            RestaurantSummaryDTO dto = new RestaurantSummaryDTO();
            dto.setId(r.getId());
            dto.setName(r.getName());
            dto.setSlug(r.getSlug());
            dto.setDescription(r.getDescription());
            dto.setCuisines(r.getCuisines());
            dto.setLogoUrl(r.getLogoUrl());
            dto.setBannerUrl(r.getBannerUrl());
            dto.setArea(r.getArea());
            dto.setCity(r.getCity());
            dto.setOpen(r.isCurrentlyAcceptingOrders());
            dto.setAvgRating(r.getAvgRating());
            dto.setTotalRatings(r.getTotalRatings());
            dto.setDeliveryTimeEstimate(r.getDeliveryTimeEstimate());
            dto.setDistanceKm(r.getDistanceKm());
            dto.setCostForTwo(r.getCostForTwo());
            dto.setDeliveryFee(r.getDeliveryFee());
            dto.setFreeDeliveryThreshold(r.getFreeDeliveryThreshold());
            dto.setPureVeg(r.isPureVeg());
            dto.setBusinessSector(r.getBusinessSector());
            dto.setQuickCommerce(r.isQuickCommerce());
            dto.setSectorDisplayName(r.getSectorDisplayName());
            return dto;
        }

        public Long getId() {
            return id;
        }

        public void setId(Long id) {
            this.id = id;
        }

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getSlug() {
            return slug;
        }

        public void setSlug(String slug) {
            this.slug = slug;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCuisines() {
            return cuisines;
        }

        public void setCuisines(String cuisines) {
            this.cuisines = cuisines;
        }

        public String getLogoUrl() {
            return logoUrl;
        }

        public void setLogoUrl(String logoUrl) {
            this.logoUrl = logoUrl;
        }

        public String getBannerUrl() {
            return bannerUrl;
        }

        public void setBannerUrl(String bannerUrl) {
            this.bannerUrl = bannerUrl;
        }

        public String getArea() {
            return area;
        }

        public void setArea(String area) {
            this.area = area;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public boolean isOpen() {
            return isOpen;
        }

        public void setOpen(boolean open) {
            isOpen = open;
        }

        public Double getAvgRating() {
            return avgRating;
        }

        public void setAvgRating(Double avgRating) {
            this.avgRating = avgRating;
        }

        public Integer getTotalRatings() {
            return totalRatings;
        }

        public void setTotalRatings(Integer totalRatings) {
            this.totalRatings = totalRatings;
        }

        public String getDeliveryTimeEstimate() {
            return deliveryTimeEstimate;
        }

        public void setDeliveryTimeEstimate(String deliveryTimeEstimate) {
            this.deliveryTimeEstimate = deliveryTimeEstimate;
        }

        public Double getDistanceKm() {
            return distanceKm;
        }

        public void setDistanceKm(Double distanceKm) {
            this.distanceKm = distanceKm;
        }

        public BigDecimal getCostForTwo() {
            return costForTwo;
        }

        public void setCostForTwo(BigDecimal costForTwo) {
            this.costForTwo = costForTwo;
        }

        public BigDecimal getDeliveryFee() {
            return deliveryFee;
        }

        public void setDeliveryFee(BigDecimal deliveryFee) {
            this.deliveryFee = deliveryFee;
        }

        public BigDecimal getFreeDeliveryThreshold() {
            return freeDeliveryThreshold;
        }

        public void setFreeDeliveryThreshold(BigDecimal freeDeliveryThreshold) {
            this.freeDeliveryThreshold = freeDeliveryThreshold;
        }

        public boolean isPureVeg() {
            return isPureVeg;
        }

        public void setPureVeg(boolean pureVeg) {
            isPureVeg = pureVeg;
        }

        public com.swiggy.foodapp.entities.BusinessSector getBusinessSector() {
            return businessSector;
        }

        public void setBusinessSector(com.swiggy.foodapp.entities.BusinessSector businessSector) {
            this.businessSector = businessSector;
        }

        public boolean isQuickCommerce() {
            return isQuickCommerce;
        }

        public void setQuickCommerce(boolean quickCommerce) {
            isQuickCommerce = quickCommerce;
        }

        public String getSectorDisplayName() {
            return sectorDisplayName;
        }

        public void setSectorDisplayName(String sectorDisplayName) {
            this.sectorDisplayName = sectorDisplayName;
        }
    }

    public static class RestaurantDetailDTO extends RestaurantSummaryDTO {
        private String address;
        private String phone;
        private String email;
        private LocalTime openingTime;
        private LocalTime closingTime;
        private BigDecimal packagingFee;
        private BigDecimal taxPercentage;

        public static RestaurantDetailDTO fromEntity(Restaurant r) {
            RestaurantDetailDTO dto = new RestaurantDetailDTO();
            dto.setId(r.getId());
            dto.setName(r.getName());
            dto.setSlug(r.getSlug());
            dto.setDescription(r.getDescription());
            dto.setCuisines(r.getCuisines());
            dto.setLogoUrl(r.getLogoUrl());
            dto.setBannerUrl(r.getBannerUrl());
            dto.setArea(r.getArea());
            dto.setCity(r.getCity());
            dto.setOpen(r.isCurrentlyAcceptingOrders());
            dto.setAvgRating(r.getAvgRating());
            dto.setTotalRatings(r.getTotalRatings());
            dto.setDeliveryTimeEstimate(r.getDeliveryTimeEstimate());
            dto.setDistanceKm(r.getDistanceKm());
            dto.setCostForTwo(r.getCostForTwo());
            dto.setDeliveryFee(r.getDeliveryFee());
            dto.setFreeDeliveryThreshold(r.getFreeDeliveryThreshold());
            dto.setPureVeg(r.isPureVeg());
            dto.setBusinessSector(r.getBusinessSector());
            dto.setQuickCommerce(r.isQuickCommerce());
            dto.setSectorDisplayName(r.getSectorDisplayName());

            dto.setAddress(r.getAddress());
            dto.setPhone(r.getPhone());
            dto.setEmail(r.getEmail());
            dto.setOpeningTime(r.getOpeningTime());
            dto.setClosingTime(r.getClosingTime());
            dto.setPackagingFee(r.getPackagingFee());
            dto.setTaxPercentage(r.getTaxPercentage());
            dto.setDrugLicenseNumber(r.getDrugLicenseNumber());
            dto.setFssaiNumber(r.getFssaiNumber());
            return dto;
        }

        private String drugLicenseNumber;
        private String fssaiNumber;

        public String getDrugLicenseNumber() {
            return drugLicenseNumber;
        }

        public void setDrugLicenseNumber(String drugLicenseNumber) {
            this.drugLicenseNumber = drugLicenseNumber;
        }

        public String getFssaiNumber() {
            return fssaiNumber;
        }

        public void setFssaiNumber(String fssaiNumber) {
            this.fssaiNumber = fssaiNumber;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public LocalTime getOpeningTime() {
            return openingTime;
        }

        public void setOpeningTime(LocalTime openingTime) {
            this.openingTime = openingTime;
        }

        public LocalTime getClosingTime() {
            return closingTime;
        }

        public void setClosingTime(LocalTime closingTime) {
            this.closingTime = closingTime;
        }

        public BigDecimal getPackagingFee() {
            return packagingFee;
        }

        public void setPackagingFee(BigDecimal packagingFee) {
            this.packagingFee = packagingFee;
        }

        public BigDecimal getTaxPercentage() {
            return taxPercentage;
        }

        public void setTaxPercentage(BigDecimal taxPercentage) {
            this.taxPercentage = taxPercentage;
        }
    }

    public static class CreateRestaurantRequest {
        private String name;
        private String description;
        private String cuisines;
        private String phone;
        private String email;
        private String address;
        private String area;
        private String city;
        private String pincode;
        private BigDecimal costForTwo;
        private boolean isPureVeg;
        private com.swiggy.foodapp.entities.BusinessSector businessSector = com.swiggy.foodapp.entities.BusinessSector.FOOD;
        private boolean isQuickCommerce;
        private String drugLicenseNumber;
        private String sectorDisplayName;

        public String getName() {
            return name;
        }

        public void setName(String name) {
            this.name = name;
        }

        public String getDescription() {
            return description;
        }

        public void setDescription(String description) {
            this.description = description;
        }

        public String getCuisines() {
            return cuisines;
        }

        public void setCuisines(String cuisines) {
            this.cuisines = cuisines;
        }

        public String getPhone() {
            return phone;
        }

        public void setPhone(String phone) {
            this.phone = phone;
        }

        public String getEmail() {
            return email;
        }

        public void setEmail(String email) {
            this.email = email;
        }

        public String getAddress() {
            return address;
        }

        public void setAddress(String address) {
            this.address = address;
        }

        public String getArea() {
            return area;
        }

        public void setArea(String area) {
            this.area = area;
        }

        public String getCity() {
            return city;
        }

        public void setCity(String city) {
            this.city = city;
        }

        public String getPincode() {
            return pincode;
        }

        public void setPincode(String pincode) {
            this.pincode = pincode;
        }

        public BigDecimal getCostForTwo() {
            return costForTwo;
        }

        public void setCostForTwo(BigDecimal costForTwo) {
            this.costForTwo = costForTwo;
        }

        public boolean isPureVeg() {
            return isPureVeg;
        }

        public void setPureVeg(boolean pureVeg) {
            isPureVeg = pureVeg;
        }

        public com.swiggy.foodapp.entities.BusinessSector getBusinessSector() {
            return businessSector;
        }

        public void setBusinessSector(com.swiggy.foodapp.entities.BusinessSector businessSector) {
            this.businessSector = businessSector;
        }

        public boolean isQuickCommerce() {
            return isQuickCommerce;
        }

        public void setQuickCommerce(boolean quickCommerce) {
            isQuickCommerce = quickCommerce;
        }

        public String getDrugLicenseNumber() {
            return drugLicenseNumber;
        }

        public void setDrugLicenseNumber(String drugLicenseNumber) {
            this.drugLicenseNumber = drugLicenseNumber;
        }

        public String getSectorDisplayName() {
            return sectorDisplayName;
        }

        public void setSectorDisplayName(String sectorDisplayName) {
            this.sectorDisplayName = sectorDisplayName;
        }
    }
}
