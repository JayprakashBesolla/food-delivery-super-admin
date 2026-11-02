package com.swiggy.foodapp.dtos.admin;

import java.math.BigDecimal;
import java.time.LocalTime;
import java.util.List;
import java.util.Map;

public class StoreAdminDTOs {

    public static class CreateBranchRequest {
        private String branchName;
        private String address;
        private String area;
        private String city;
        private String phone;
        private String managerName;
        private Double latitude;
        private Double longitude;
        private boolean isMainBranch;
        private boolean allowsTakeaway = true;

        public String getBranchName() { return branchName; }
        public void setBranchName(String branchName) { this.branchName = branchName; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getArea() { return area; }
        public void setArea(String area) { this.area = area; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getManagerName() { return managerName; }
        public void setManagerName(String managerName) { this.managerName = managerName; }
        public Double getLatitude() { return latitude; }
        public void setLatitude(Double latitude) { this.latitude = latitude; }
        public Double getLongitude() { return longitude; }
        public void setLongitude(Double longitude) { this.longitude = longitude; }
        public boolean isMainBranch() { return isMainBranch; }
        public void setMainBranch(boolean mainBranch) { isMainBranch = mainBranch; }
        public boolean isAllowsTakeaway() { return allowsTakeaway; }
        public void setAllowsTakeaway(boolean allowsTakeaway) { this.allowsTakeaway = allowsTakeaway; }
    }

    public static class CreateStaffRequest {
        private String name;
        private String email;
        private String phone;
        private String staffRole; // MANAGER, CHEF, CASHIER

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getStaffRole() { return staffRole; }
        public void setStaffRole(String staffRole) { this.staffRole = staffRole; }
    }

    public static class StoreOperationalUpdateRequest {
        private Boolean isOpen;
        private Boolean isKitchenBusy;
        private Integer rushExtraMinutes;
        private LocalTime openingTime;
        private LocalTime closingTime;
        private BigDecimal deliveryFee;
        private BigDecimal packagingFee;
        private BigDecimal freeDeliveryThreshold;

        public Boolean getIsOpen() { return isOpen; }
        public void setIsOpen(Boolean isOpen) { this.isOpen = isOpen; }
        public Boolean getIsKitchenBusy() { return isKitchenBusy; }
        public void setIsKitchenBusy(Boolean isKitchenBusy) { this.isKitchenBusy = isKitchenBusy; }
        public Integer getRushExtraMinutes() { return rushExtraMinutes; }
        public void setRushExtraMinutes(Integer rushExtraMinutes) { this.rushExtraMinutes = rushExtraMinutes; }
        public LocalTime getOpeningTime() { return openingTime; }
        public void setOpeningTime(LocalTime openingTime) { this.openingTime = openingTime; }
        public LocalTime getClosingTime() { return closingTime; }
        public void setClosingTime(LocalTime closingTime) { this.closingTime = closingTime; }
        public BigDecimal getDeliveryFee() { return deliveryFee; }
        public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }
        public BigDecimal getPackagingFee() { return packagingFee; }
        public void setPackagingFee(BigDecimal packagingFee) { this.packagingFee = packagingFee; }
        public BigDecimal getFreeDeliveryThreshold() { return freeDeliveryThreshold; }
        public void setFreeDeliveryThreshold(BigDecimal freeDeliveryThreshold) { this.freeDeliveryThreshold = freeDeliveryThreshold; }
    }

    public static class TopDishDTO {
        private String dishName;
        private Long quantitySold;
        private BigDecimal totalRevenue;

        public TopDishDTO(String dishName, Long quantitySold, BigDecimal totalRevenue) {
            this.dishName = dishName;
            this.quantitySold = quantitySold;
            this.totalRevenue = totalRevenue;
        }

        public String getDishName() { return dishName; }
        public Long getQuantitySold() { return quantitySold; }
        public BigDecimal getTotalRevenue() { return totalRevenue; }
    }

    public static class PartnerCockpitDTO {
        private Long restaurantId;
        private String restaurantName;
        private boolean isOpen;
        private boolean isKitchenBusy;
        private Integer rushExtraMinutes;
        private BigDecimal grossSales;
        private BigDecimal platformCommissionDeducted;
        private BigDecimal netEarnings;
        private long totalOrders;
        private long deliveredOrders;
        private long cancelledOrders;
        private BigDecimal averageOrderValue;
        private Double avgRating;
        private Integer totalRatings;
        private List<TopDishDTO> topSellingDishes;
        private Map<Integer, Long> hourlyOrderHeatmap;

        public Long getRestaurantId() { return restaurantId; }
        public void setRestaurantId(Long restaurantId) { this.restaurantId = restaurantId; }
        public String getRestaurantName() { return restaurantName; }
        public void setRestaurantName(String restaurantName) { this.restaurantName = restaurantName; }
        public boolean isOpen() { return isOpen; }
        public void setOpen(boolean open) { isOpen = open; }
        public boolean isKitchenBusy() { return isKitchenBusy; }
        public void setKitchenBusy(boolean kitchenBusy) { isKitchenBusy = kitchenBusy; }
        public Integer getRushExtraMinutes() { return rushExtraMinutes; }
        public void setRushExtraMinutes(Integer rushExtraMinutes) { this.rushExtraMinutes = rushExtraMinutes; }
        public BigDecimal getGrossSales() { return grossSales; }
        public void setGrossSales(BigDecimal grossSales) { this.grossSales = grossSales; }
        public BigDecimal getPlatformCommissionDeducted() { return platformCommissionDeducted; }
        public void setPlatformCommissionDeducted(BigDecimal platformCommissionDeducted) { this.platformCommissionDeducted = platformCommissionDeducted; }
        public BigDecimal getNetEarnings() { return netEarnings; }
        public void setNetEarnings(BigDecimal netEarnings) { this.netEarnings = netEarnings; }
        public long getTotalOrders() { return totalOrders; }
        public void setTotalOrders(long totalOrders) { this.totalOrders = totalOrders; }
        public long getDeliveredOrders() { return deliveredOrders; }
        public void setDeliveredOrders(long deliveredOrders) { this.deliveredOrders = deliveredOrders; }
        public long getCancelledOrders() { return cancelledOrders; }
        public void setCancelledOrders(long cancelledOrders) { this.cancelledOrders = cancelledOrders; }
        public BigDecimal getAverageOrderValue() { return averageOrderValue; }
        public void setAverageOrderValue(BigDecimal averageOrderValue) { this.averageOrderValue = averageOrderValue; }
        public Double getAvgRating() { return avgRating; }
        public void setAvgRating(Double avgRating) { this.avgRating = avgRating; }
        public Integer getTotalRatings() { return totalRatings; }
        public void setTotalRatings(Integer totalRatings) { this.totalRatings = totalRatings; }
        public List<TopDishDTO> getTopSellingDishes() { return topSellingDishes; }
        public void setTopSellingDishes(List<TopDishDTO> topSellingDishes) { this.topSellingDishes = topSellingDishes; }
        public Map<Integer, Long> getHourlyOrderHeatmap() { return hourlyOrderHeatmap; }
        public void setHourlyOrderHeatmap(Map<Integer, Long> hourlyOrderHeatmap) { this.hourlyOrderHeatmap = hourlyOrderHeatmap; }
    }
}
