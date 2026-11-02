package com.swiggy.foodapp.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.time.LocalTime;

@Entity
@Table(name = "restaurants")
public class Restaurant {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String name;

    @Column(unique = true, nullable = false)
    private String slug;

    @Column(length = 1000)
    private String description;

    private String cuisines; // e.g., "Biryani, North Indian, Fast Food"

    private String logoUrl;
    private String bannerUrl;

    private String phone;
    private String email;

    private String address;
    private String area; // e.g., "Madhapur", "Kondapur"
    private String city = "Hyderabad";
    private String pincode;

    private Double latitude;
    private Double longitude;

    private boolean isOpen = true;
    private LocalTime openingTime = LocalTime.of(10, 0);
    private LocalTime closingTime = LocalTime.of(23, 30);

    private Double avgRating = 4.3;
    private Integer totalRatings = 150;

    private String deliveryTimeEstimate = "25-35 mins";
    private Double distanceKm = 2.5;

    private BigDecimal costForTwo = BigDecimal.valueOf(350.00);

    private BigDecimal deliveryFee = BigDecimal.valueOf(40.00);
    private BigDecimal packagingFee = BigDecimal.valueOf(15.00);
    private BigDecimal taxPercentage = BigDecimal.valueOf(5.00);
    private BigDecimal freeDeliveryThreshold = BigDecimal.valueOf(500.00);

    private boolean isPureVeg = false;

    private boolean isKitchenBusy = false; // Rush mode: kitchen is overwhelmed, add extra prep time
    private Integer rushExtraMinutes = 15;

    private BigDecimal commissionRate = BigDecimal.valueOf(15.0); // SuperAdmin custom commission %

    private String fssaiNumber;
    private String gstin;
    private String drugLicenseNumber; // Compliance for Pharmacy sector

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private BusinessSector businessSector = BusinessSector.FOOD;

    private boolean isQuickCommerce = false; // e.g. 10-15 min Instamart badge
    private String sectorDisplayName; // e.g. "Instamart Dark Store", "24/7 Pharmacy"

    @Enumerated(EnumType.STRING)
    private RestaurantStatus status = RestaurantStatus.ACTIVE;

    private String razorpayKeyId;
    private String razorpayKeySecret;
    private String stripeAccountId; // Stripe Connect connected merchant account ID (e.g. acct_...)
    private String panNumber;
    private String bankAccountNumber;
    private String bankIfscCode;

    private BigDecimal pendingCommissionRate; // Maker-Checker proposed commission rate awaiting approval
    private String commissionProposedBy; // Email of admin who proposed the change

    @Version
    private Long version = 0L; // Optimistic record locking

    private LocalDateTime createdAt = LocalDateTime.now();

    public Restaurant() {}

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getName() { return name; }
    public void setName(String name) { this.name = name; }

    public String getSlug() { return slug; }
    public void setSlug(String slug) { this.slug = slug; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getCuisines() { return cuisines; }
    public void setCuisines(String cuisines) { this.cuisines = cuisines; }

    public String getLogoUrl() { return logoUrl; }
    public void setLogoUrl(String logoUrl) { this.logoUrl = logoUrl; }

    public String getBannerUrl() { return bannerUrl; }
    public void setBannerUrl(String bannerUrl) { this.bannerUrl = bannerUrl; }

    public String getPhone() { return phone; }
    public void setPhone(String phone) { this.phone = phone; }

    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }

    public String getAddress() { return address; }
    public void setAddress(String address) { this.address = address; }

    public String getArea() { return area; }
    public void setArea(String area) { this.area = area; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public String getPincode() { return pincode; }
    public void setPincode(String pincode) { this.pincode = pincode; }

    public Double getLatitude() { return latitude; }
    public void setLatitude(Double latitude) { this.latitude = latitude; }

    public Double getLongitude() { return longitude; }
    public void setLongitude(Double longitude) { this.longitude = longitude; }

    public boolean isOpen() { return isOpen; }
    public void setOpen(boolean open) { isOpen = open; }

    public LocalTime getOpeningTime() { return openingTime; }
    public void setOpeningTime(LocalTime openingTime) { this.openingTime = openingTime; }

    public LocalTime getClosingTime() { return closingTime; }
    public void setClosingTime(LocalTime closingTime) { this.closingTime = closingTime; }

    public Double getAvgRating() { return avgRating; }
    public void setAvgRating(Double avgRating) { this.avgRating = avgRating; }

    public Integer getTotalRatings() { return totalRatings; }
    public void setTotalRatings(Integer totalRatings) { this.totalRatings = totalRatings; }

    public String getDeliveryTimeEstimate() { return deliveryTimeEstimate; }
    public void setDeliveryTimeEstimate(String deliveryTimeEstimate) { this.deliveryTimeEstimate = deliveryTimeEstimate; }

    public Double getDistanceKm() { return distanceKm; }
    public void setDistanceKm(Double distanceKm) { this.distanceKm = distanceKm; }

    public BigDecimal getCostForTwo() { return costForTwo; }
    public void setCostForTwo(BigDecimal costForTwo) { this.costForTwo = costForTwo; }

    public BigDecimal getDeliveryFee() { return deliveryFee; }
    public void setDeliveryFee(BigDecimal deliveryFee) { this.deliveryFee = deliveryFee; }

    public BigDecimal getPackagingFee() { return packagingFee; }
    public void setPackagingFee(BigDecimal packagingFee) { this.packagingFee = packagingFee; }

    public BigDecimal getTaxPercentage() { return taxPercentage; }
    public void setTaxPercentage(BigDecimal taxPercentage) { this.taxPercentage = taxPercentage; }

    public BigDecimal getFreeDeliveryThreshold() { return freeDeliveryThreshold; }
    public void setFreeDeliveryThreshold(BigDecimal freeDeliveryThreshold) { this.freeDeliveryThreshold = freeDeliveryThreshold; }

    public boolean isPureVeg() { return isPureVeg; }
    public void setPureVeg(boolean pureVeg) { isPureVeg = pureVeg; }

    public RestaurantStatus getStatus() { return status; }
    public void setStatus(RestaurantStatus status) { this.status = status; }

    public String getRazorpayKeyId() { return razorpayKeyId; }
    public void setRazorpayKeyId(String razorpayKeyId) { this.razorpayKeyId = razorpayKeyId; }

    public String getRazorpayKeySecret() { return razorpayKeySecret; }
    public void setRazorpayKeySecret(String razorpayKeySecret) { this.razorpayKeySecret = razorpayKeySecret; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public boolean isKitchenBusy() { return isKitchenBusy; }
    public void setKitchenBusy(boolean kitchenBusy) { isKitchenBusy = kitchenBusy; }

    public Integer getRushExtraMinutes() { return rushExtraMinutes; }
    public void setRushExtraMinutes(Integer rushExtraMinutes) { this.rushExtraMinutes = rushExtraMinutes; }

    public BigDecimal getCommissionRate() { return commissionRate; }
    public void setCommissionRate(BigDecimal commissionRate) { this.commissionRate = commissionRate; }

    public String getFssaiNumber() { return fssaiNumber; }
    public void setFssaiNumber(String fssaiNumber) { this.fssaiNumber = fssaiNumber; }

    public String getGstin() { return gstin; }
    public void setGstin(String gstin) { this.gstin = gstin; }

    public String getDrugLicenseNumber() { return drugLicenseNumber; }
    public void setDrugLicenseNumber(String drugLicenseNumber) { this.drugLicenseNumber = drugLicenseNumber; }

    public BusinessSector getBusinessSector() { return businessSector; }
    public void setBusinessSector(BusinessSector businessSector) { this.businessSector = businessSector; }

    public boolean isQuickCommerce() { return isQuickCommerce; }
    public void setQuickCommerce(boolean quickCommerce) { isQuickCommerce = quickCommerce; }

    public String getSectorDisplayName() { return sectorDisplayName; }
    public void setSectorDisplayName(String sectorDisplayName) { this.sectorDisplayName = sectorDisplayName; }

    public String getStripeAccountId() { return stripeAccountId; }
    public void setStripeAccountId(String stripeAccountId) { this.stripeAccountId = stripeAccountId; }

    public String getPanNumber() { return panNumber; }
    public void setPanNumber(String panNumber) { this.panNumber = panNumber; }

    public String getBankAccountNumber() { return bankAccountNumber; }
    public void setBankAccountNumber(String bankAccountNumber) { this.bankAccountNumber = bankAccountNumber; }

    public String getBankIfscCode() { return bankIfscCode; }
    public void setBankIfscCode(String bankIfscCode) { this.bankIfscCode = bankIfscCode; }

    public BigDecimal getPendingCommissionRate() { return pendingCommissionRate; }
    public void setPendingCommissionRate(BigDecimal pendingCommissionRate) { this.pendingCommissionRate = pendingCommissionRate; }

    public String getCommissionProposedBy() { return commissionProposedBy; }
    public void setCommissionProposedBy(String commissionProposedBy) { this.commissionProposedBy = commissionProposedBy; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }

    public boolean isCurrentlyAcceptingOrders() {
        if (!isOpen || status != RestaurantStatus.ACTIVE) return false;
        LocalTime now = LocalTime.now();
        if (openingTime != null && closingTime != null) {
            if (openingTime.isBefore(closingTime)) {
                return !now.isBefore(openingTime) && !now.isAfter(closingTime);
            } else {
                // Overnight timings (e.g. 18:00 to 02:00)
                return !now.isBefore(openingTime) || !now.isAfter(closingTime);
            }
        }
        return true;
    }
}
