package com.swiggy.foodapp.entities;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "users")
public class User {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false, unique = true)
    private String phone;

    @JsonIgnore
    @Column(nullable = false)
    private String password;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Role role = Role.CUSTOMER;

    private boolean isBlocked = false;

    private java.math.BigDecimal walletBalance = java.math.BigDecimal.ZERO;

    @Enumerated(EnumType.STRING)
    private Department department;

    @ElementCollection(fetch = FetchType.EAGER)
    @Enumerated(EnumType.STRING)
    @CollectionTable(name = "user_admin_permissions", joinColumns = @JoinColumn(name = "user_id"))
    @Column(name = "permission")
    private java.util.Set<AdminPermission> permissions = new java.util.HashSet<>();

    @Enumerated(EnumType.STRING)
    private PermissionScope scopeType = PermissionScope.GLOBAL;

    private String scopeValue = "ALL"; // e.g. "ALL", "Hyderabad", "Telangana", "1-1000"

    private LocalDateTime createdAt = LocalDateTime.now();

    public User() {}

    public User(String name, String email, String phone, String password, Role role) {
        this.name = name;
        this.email = email;
        this.phone = phone;
        this.password = password;
        this.role = role;
        this.isBlocked = false;
        this.walletBalance = java.math.BigDecimal.ZERO;
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getPassword() { return password; }
    public void setPassword(String password) { this.password = password; }

    public Role getRole() { return role; }
    public void setRole(Role role) { this.role = role; }

    public boolean isBlocked() { return isBlocked; }
    public void setBlocked(boolean blocked) { isBlocked = blocked; }

    public java.math.BigDecimal getWalletBalance() { return walletBalance; }
    public void setWalletBalance(java.math.BigDecimal walletBalance) { this.walletBalance = walletBalance; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public java.util.Set<AdminPermission> getPermissions() { return permissions; }
    public void setPermissions(java.util.Set<AdminPermission> permissions) { this.permissions = permissions; }
    public void addPermission(AdminPermission permission) { this.permissions.add(permission); }

    public PermissionScope getScopeType() { return scopeType; }
    public void setScopeType(PermissionScope scopeType) { this.scopeType = scopeType; }

    public String getScopeValue() { return scopeValue; }
    public void setScopeValue(String scopeValue) { this.scopeValue = scopeValue; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }
}
