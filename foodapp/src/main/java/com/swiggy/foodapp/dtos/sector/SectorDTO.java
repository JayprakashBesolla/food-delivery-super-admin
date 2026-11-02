package com.swiggy.foodapp.dtos.sector;

import com.swiggy.foodapp.entities.BusinessSector;

public class SectorDTO {
    private String id;
    private String name;
    private String tagline;
    private String deliveryBadge;
    private String iconUrl;
    private String bannerUrl;
    private long activeStoresCount;

    public SectorDTO() {}

    public SectorDTO(BusinessSector sector, long activeStoresCount) {
        this.id = sector.name();
        this.name = sector.getDisplayName();
        this.tagline = sector.getTagline();
        this.deliveryBadge = sector.getDeliveryBadge();
        this.iconUrl = sector.getIconUrl();
        this.bannerUrl = sector.getBannerUrl();
        this.activeStoresCount = activeStoresCount;
    }

    public String getId() { return id; }
    public void setId(String id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getTagline() { return tagline; }
    public void setTagline(String tagline) { this.tagline = tagline; }

    public String getDeliveryBadge() { return deliveryBadge; }
    public void setDeliveryBadge(String deliveryBadge) { this.deliveryBadge = deliveryBadge; }

    public String getIconUrl() { return iconUrl; }
    public void setIconUrl(String iconUrl) { this.iconUrl = iconUrl; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public long getActiveStoresCount() { return activeStoresCount; }
    public void setActiveStoresCount(long activeStoresCount) { this.activeStoresCount = activeStoresCount; }
}
