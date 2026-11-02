package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class SettlementService {

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Transactional
    public SettlementRecord calculateSettlement(Long restaurantId, BigDecimal commissionPercentage) {
        Restaurant restaurant = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + restaurantId));

        List<Order> deliveredOrders = orderRepository.findByRestaurant_IdAndStatusOrderByCreatedAtDesc(restaurantId, OrderStatus.DELIVERED);

        BigDecimal grossSales = BigDecimal.ZERO;
        for (Order o : deliveredOrders) {
            grossSales = grossSales.add(o.getItemTotal());
        }

        BigDecimal commRate = commissionPercentage != null ? commissionPercentage : BigDecimal.valueOf(15.0);
        BigDecimal commission = grossSales.multiply(commRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal tds = grossSales.multiply(BigDecimal.valueOf(1.0)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal netPayout = grossSales.subtract(commission).subtract(tds);

        SettlementRecord record = new SettlementRecord();
        record.setRestaurant(restaurant);
        record.setGrossSales(grossSales);
        record.setPlatformCommissionPercentage(commRate);
        record.setPlatformCommissionAmount(commission);
        record.setTaxDeducted(tds);
        record.setNetPayoutAmount(netPayout.compareTo(BigDecimal.ZERO) > 0 ? netPayout : BigDecimal.ZERO);
        record.setStatus("PENDING");
        record.setProcessedAt(LocalDateTime.now());

        return settlementRepository.save(record);
    }

    @Transactional
    public SettlementRecord markPaid(Long settlementId, String utrNumber) {
        SettlementRecord record = settlementRepository.findById(settlementId)
                .orElseThrow(() -> new NoSuchElementException("Settlement record not found: " + settlementId));

        record.setStatus("PAID");
        record.setUtrNumber(utrNumber);
        record.setPaidAt(LocalDateTime.now());

        return settlementRepository.save(record);
    }
}
