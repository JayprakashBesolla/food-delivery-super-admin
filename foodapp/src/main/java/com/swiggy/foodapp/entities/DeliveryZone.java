package com.swiggy.foodapp.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;

@Entity
@Table(name = "delivery_zones")
public class DeliveryZone {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String zoneName; // e.g. "Madhapur-Hitech Zone", "Gachibowli Zone"

    @Column(nullable = false)
    private String city = "Hyderabad";

    private Double centerLatitude;
    private Double centerLongitude;
    private Double radiusKm = 10.0;

    private BigDecimal baseDeliveryFee = BigDecimal.valueOf(35.0);
    private BigDecimal perKmExtraFee = BigDecimal.valueOf(10.0);

    private boolean isActive = true;

    public DeliveryZone() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getZoneName() { return zoneName; }
    public void setZoneName(String zoneName) { this.zoneName = zoneName; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public Double getCenterLatitude() { return centerLatitude; }
    public void setCenterLatitude(Double centerLatitude) { this.centerLatitude = centerLatitude; }

    public Double getCenterLongitude() { return centerLongitude; }
    public void setCenterLongitude(Double centerLongitude) { this.centerLongitude = centerLongitude; }

    public Double getRadiusKm() { return radiusKm; }
    public void setRadiusKm(Double radiusKm) { this.radiusKm = radiusKm; }

    public BigDecimal getBaseDeliveryFee() { return baseDeliveryFee; }
    public void setBaseDeliveryFee(BigDecimal baseDeliveryFee) { this.baseDeliveryFee = baseDeliveryFee; }

    public BigDecimal getPerKmExtraFee() { return perKmExtraFee; }
    public void setPerKmExtraFee(BigDecimal perKmExtraFee) { this.perKmExtraFee = perKmExtraFee; }

    public boolean isActive() { return isActive; }
    public void setActive(boolean active) { isActive = active; }
}
