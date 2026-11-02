package com.swiggy.foodapp.entities;

public enum BusinessSector {
    FOOD("Food Delivery", "Restaurants, cafes, cloud kitchens & bakeries", "25-35 MINS", "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=200", "https://images.unsplash.com/photo-1543353071-10c8ba85a904?w=1000"),
    GROCERY("Instamart", "Instant grocery, fresh veggies & daily essentials", "10-15 MINS", "https://images.unsplash.com/photo-1542838132-92c53300491e?w=200", "https://images.unsplash.com/photo-1608686207856-001b95cf60ca?w=1000"),
    PHARMACY("Pharmacy", "Medicines, wellness, health supplements & first aid", "25-35 MINS", "https://images.unsplash.com/photo-1587854692152-cbe660dbde88?w=200", "https://images.unsplash.com/photo-1576602976047-174e57a47881?w=1000"),
    MEAT_FISH("Meat & Seafood", "Fresh hygienically cut chicken, mutton & seafood", "30-40 MINS", "https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=200", "https://images.unsplash.com/photo-1544025162-d76694265947?w=1000"),
    PET_SUPPLIES("Pet Care", "Nutritious pet food, grooming & accessories", "30-45 MINS", "https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?w=200", "https://images.unsplash.com/photo-1548767797-d8c844163c4c?w=1000");

    private final String displayName;
    private final String tagline;
    private final String deliveryBadge;
    private final String iconUrl;
    private final String bannerUrl;

    BusinessSector(String displayName, String tagline, String deliveryBadge, String iconUrl, String bannerUrl) {
        this.displayName = displayName;
        this.tagline = tagline;
        this.deliveryBadge = deliveryBadge;
        this.iconUrl = iconUrl;
        this.bannerUrl = bannerUrl;
    }

    public String getDisplayName() {
        return displayName;
    }

    public String getTagline() {
        return tagline;
    }

    public String getDeliveryBadge() {
        return deliveryBadge;
    }

    public String getIconUrl() {
        return iconUrl;
    }

    public String getBannerUrl() {
        return bannerUrl;
    }
}
