package com.swiggy.foodapp.entities;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String actorEmail; // admin who performed the action

    @Column(nullable = false)
    private String actorRole; // SUPER_ADMIN

    @Column(nullable = false)
    private String action; // UPDATE_COMMISSION, BLOCK_USER, UNBLOCK_USER, APPROVE_KYC, REJECT_KYC, TRIGGER_REFUND, TRIGGER_PAYOUT, UPDATE_SETTINGS, RESOLVE_DISPUTE, BROADCAST_NOTIFICATION

    @Column(nullable = false)
    private String targetEntityType; // RESTAURANT, USER, ORDER, SETTLEMENT, PAYMENT, CONFIG, TICKET

    private String targetEntityId; // ID of the affected entity

    @Column(columnDefinition = "TEXT")
    private String details; // JSON or human readable details of the change

    private String ipAddress;

    private LocalDateTime timestamp = LocalDateTime.now();

    public AuditLog() {}

    public AuditLog(String actorEmail, String actorRole, String action, String targetEntityType,
                    String targetEntityId, String details, String ipAddress) {
        this.actorEmail = actorEmail;
        this.actorRole = actorRole;
        this.action = action;
        this.targetEntityType = targetEntityType;
        this.targetEntityId = targetEntityId;
        this.details = details;
        this.ipAddress = ipAddress;
        this.timestamp = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getActorEmail() { return actorEmail; }
    public void setActorEmail(String actorEmail) { this.actorEmail = actorEmail; }

    public String getActorRole() { return actorRole; }
    public void setActorRole(String actorRole) { this.actorRole = actorRole; }

    public String getAction() { return action; }
    public void setAction(String action) { this.action = action; }

    public String getTargetEntityType() { return targetEntityType; }
    public void setTargetEntityType(String targetEntityType) { this.targetEntityType = targetEntityType; }

    public String getTargetEntityId() { return targetEntityId; }
    public void setTargetEntityId(String targetEntityId) { this.targetEntityId = targetEntityId; }

    public String getDetails() { return details; }
    public void setDetails(String details) { this.details = details; }

    public String getIpAddress() { return ipAddress; }
    public void setIpAddress(String ipAddress) { this.ipAddress = ipAddress; }

    public LocalDateTime getTimestamp() { return timestamp; }
    public void setTimestamp(LocalDateTime timestamp) { this.timestamp = timestamp; }
}
