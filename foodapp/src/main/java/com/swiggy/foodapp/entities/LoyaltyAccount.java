package com.swiggy.foodapp.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "loyalty_accounts")
public class LoyaltyAccount {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false, unique = true)
    @JsonIgnore
    private User user;

    private Integer pointsBalance = 0;
    private Integer lifetimeEarned = 0;
    private Integer lifetimeRedeemed = 0;

    private LocalDateTime updatedAt = LocalDateTime.now();

    public LoyaltyAccount() {}

    public LoyaltyAccount(User user) {
        this.user = user;
        this.pointsBalance = 0;
        this.lifetimeEarned = 0;
        this.lifetimeRedeemed = 0;
        this.updatedAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }

    public Integer getPointsBalance() { return pointsBalance; }
    public void setPointsBalance(Integer pointsBalance) { this.pointsBalance = pointsBalance; }

    public Integer getLifetimeEarned() { return lifetimeEarned; }
    public void setLifetimeEarned(Integer lifetimeEarned) { this.lifetimeEarned = lifetimeEarned; }

    public Integer getLifetimeRedeemed() { return lifetimeRedeemed; }
    public void setLifetimeRedeemed(Integer lifetimeRedeemed) { this.lifetimeRedeemed = lifetimeRedeemed; }

    public LocalDateTime getUpdatedAt() { return updatedAt; }
    public void setUpdatedAt(LocalDateTime updatedAt) { this.updatedAt = updatedAt; }
}
