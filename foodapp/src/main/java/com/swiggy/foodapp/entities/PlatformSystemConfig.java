package com.swiggy.foodapp.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_system_configs")
public class PlatformSystemConfig {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private BigDecimal defaultCommissionRate = BigDecimal.valueOf(15.0); // 15% platform commission

    private boolean maintenanceMode = false;
    private String maintenanceMessage = "Swiggy is undergoing brief scheduled maintenance. We will be back shortly!";

    private boolean rainSurgeActive = false;
    private BigDecimal rainSurgeMultiplier = BigDecimal.valueOf(1.25); // +25% delivery fee during rain

    private boolean nightSurgeActive = false;
    private BigDecimal nightSurgeMultiplier = BigDecimal.valueOf(1.20); // +20% delivery fee past 11 PM

    private String globalAnnouncementBanner;
    private boolean bannerActive = false;

    private String supportPhone = "+91 1800-SWIGGY-HELP";
    private String supportEmail = "help@swiggy.com";

    private LocalDateTime updatedAt = LocalDateTime.now();

    public PlatformSystemConfig() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public BigDecimal getDefaultCommissionRate() { return defaultCommissionRate; }
    public void setDefaultCommissionRate(BigDecimal defaultCommissionRate) { this.defaultCommissionRate = defaultCommissionRate; }

    public boolean isMaintenanceMode() { return maintenanceMode; }
    public void setMaintenanceMode(boolean maintenanceMode) { this.maintenanceMode = maintenanceMode; }

    public String getMaintenanceMessage() { return maintenanceMessage; }
    public void setMaintenanceMessage(String maintenanceMessage) { this.maintenanceMessage = maintenanceMessage; }

    public boolean isRainSurgeActive() { return rainSurgeActive; }
    public void setRainSurgeActive(boolean rainSurgeActive) { this.rainSurgeActive = rainSurgeActive; }

    public BigDecimal getRainSurgeMultiplier() { return rainSurgeMultiplier; }
    public void setRainSurgeMultiplier(BigDecimal rainSurgeMultiplier) { this.rainSurgeMultiplier = rainSurgeMultiplier; }

    public boolean isNightSurgeActive() { return nightSurgeActive; }
    public void setNightSurgeActive(boolean nightSurgeActive) { this.nightSurgeActive = nightSurgeActive; }

    public BigDecimal getNightSurgeMultiplier() { return nightSurgeMultiplier; }
    public void setNightSurgeMultiplier(BigDecimal nightSurgeMultiplier) { this.nightSurgeMultiplier = nightSurgeMultiplier; }

    public String getGlobalAnnouncementBanner() { return globalAnnouncementBanner; }
    public void setGlobalAnnouncementBanner(String globalAnnouncementBanner) { this.globalAnnouncementBanner = globalAnnouncementBanner; }

    public boolean isBannerActive() { return bannerActive; }
    public void setBannerActive(boolean bannerActive) { this.bannerActive = bannerActive; }

    public String getSupportPhone() { return supportPhone; }
    public void setSupportPhone(String supportPhone) { this.supportPhone = supportPhone; }

    public String getSupportEmail() { return supportEmail; }
    public void setSupportEmail(String supportEmail) { this.supportEmail = supportEmail; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
