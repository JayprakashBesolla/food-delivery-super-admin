package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.DeliveryZone;
import com.swiggy.foodapp.repositories.DeliveryZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.util.List;

@Service
public class DeliveryZoneService {

    @Autowired
    private DeliveryZoneRepository deliveryZoneRepository;

    public double calculateDistanceKm(double lat1, double lon1, double lat2, double lon2) {
        final int EARTH_RADIUS = 6371; // km
        double dLat = Math.toRadians(lat2 - lat1);
        double dLon = Math.toRadians(lon2 - lon1);

        double a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                Math.cos(Math.toRadians(lat1)) * Math.cos(Math.toRadians(lat2)) *
                        Math.sin(dLon / 2) * Math.sin(dLon / 2);

        double c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return Math.round(EARTH_RADIUS * c * 10.0) / 10.0;
    }

    public BigDecimal calculateDeliveryFee(Double customerLat, Double customerLng, Double restLat, Double restLng, String city) {
        if (customerLat == null || customerLng == null || restLat == null || restLng == null) {
            return BigDecimal.valueOf(40.0); // Standard fallback
        }

        double distance = calculateDistanceKm(customerLat, customerLng, restLat, restLng);

        List<DeliveryZone> zones = deliveryZoneRepository.findByCityIgnoreCaseAndIsActiveTrue(city != null ? city : "Hyderabad");
        DeliveryZone matchedZone = zones.isEmpty() ? null : zones.get(0);

        BigDecimal baseFee = matchedZone != null ? matchedZone.getBaseDeliveryFee() : BigDecimal.valueOf(35.0);
        BigDecimal extraPerKm = matchedZone != null ? matchedZone.getPerKmExtraFee() : BigDecimal.valueOf(10.0);

        if (distance <= 2.0) {
            return baseFee;
        } else {
            double extraKm = distance - 2.0;
            return baseFee.add(BigDecimal.valueOf(extraKm).multiply(extraPerKm));
        }
    }
}
