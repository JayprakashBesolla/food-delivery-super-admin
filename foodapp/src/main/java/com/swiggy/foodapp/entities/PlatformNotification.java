package com.swiggy.foodapp.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_notifications")
public class PlatformNotification {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(nullable = false, length = 2000)
    private String message;

    @Column(nullable = false)
    private String targetAudience = "ALL"; // ALL, CUSTOMERS, RESTAURANT_PARTNERS, RIDERS

    @Enumerated(EnumType.STRING)
    private BusinessSector sector; // Optional sector filter (FOOD, GROCERY, PHARMACY, MEAT_FISH)

    private String actionUrl;

    private String sentByAdminEmail;

    private LocalDateTime sentAt = LocalDateTime.now();

    public PlatformNotification() {}

    public PlatformNotification(String title, String message, String targetAudience,
                                BusinessSector sector, String actionUrl, String sentByAdminEmail) {
        this.title = title;
        this.message = message;
        this.targetAudience = targetAudience;
        this.sector = sector;
        this.actionUrl = actionUrl;
        this.sentByAdminEmail = sentByAdminEmail;
        this.sentAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }

    public String getMessage() { return message; }
    public void setMessage(String message) { this.message = message; }

    public String getTargetAudience() { return targetAudience; }
    public void setTargetAudience(String targetAudience) { this.targetAudience = targetAudience; }

    public BusinessSector getSector() { return sector; }
    public void setSector(BusinessSector sector) { this.sector = sector; }

    public String getActionUrl() { return actionUrl; }
    public void setActionUrl(String actionUrl) { this.actionUrl = actionUrl; }

    public String getSentByAdminEmail() { return sentByAdminEmail; }
    public void setSentByAdminEmail(String sentByAdminEmail) { this.sentByAdminEmail = sentByAdminEmail; }

    public LocalDateTime getSentAt() { return sentAt; }
    public void setSentAt(LocalDateTime sentAt) { this.sentAt = sentAt; }
}
