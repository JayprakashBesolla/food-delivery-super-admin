package com.swiggy.foodapp.exceptions;

import com.swiggy.foodapp.entities.BusinessSector;

public class RestaurantConflictException extends RuntimeException {

    private final Long existingRestaurantId;
    private final String existingRestaurantName;
    private final Long newRestaurantId;
    private final String newRestaurantName;
    private final BusinessSector existingSector;
    private final BusinessSector newSector;

    public RestaurantConflictException(Long existingRestaurantId, String existingRestaurantName,
                                       Long newRestaurantId, String newRestaurantName) {
        this(existingRestaurantId, existingRestaurantName, BusinessSector.FOOD, newRestaurantId, newRestaurantName, BusinessSector.FOOD);
    }

    public RestaurantConflictException(Long existingRestaurantId, String existingRestaurantName, BusinessSector existingSector,
                                       Long newRestaurantId, String newRestaurantName, BusinessSector newSector) {
        super(formatMessage(existingRestaurantName, existingSector, newRestaurantName, newSector));
        this.existingRestaurantId = existingRestaurantId;
        this.existingRestaurantName = existingRestaurantName;
        this.existingSector = existingSector;
        this.newRestaurantId = newRestaurantId;
        this.newRestaurantName = newRestaurantName;
        this.newSector = newSector;
    }

    private static String formatMessage(String existingName, BusinessSector existingSector, String newName, BusinessSector newSector) {
        if (existingSector != null && newSector != null && existingSector != newSector) {
            return String.format("Cart contains items from '%s' (%s). Items from '%s' (%s) must be ordered separately as delivery logistics differ. Discard cart to proceed?",
                    existingName, existingSector.getDisplayName(), newName, newSector.getDisplayName());
        }
        return String.format("Cart already contains items from '%s'. Discard cart to add from '%s'?",
                existingName, newName);
    }

    public Long getExistingRestaurantId() { return existingRestaurantId; }
    public String getExistingRestaurantName() { return existingRestaurantName; }
    public Long getNewRestaurantId() { return newRestaurantId; }
    public String getNewRestaurantName() { return newRestaurantName; }
    public BusinessSector getExistingSector() { return existingSector; }
    public BusinessSector getNewSector() { return newSector; }
}
