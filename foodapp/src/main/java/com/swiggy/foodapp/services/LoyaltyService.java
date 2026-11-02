package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.LoyaltyAccount;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.repositories.LoyaltyRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Service
public class LoyaltyService {

    @Autowired
    private LoyaltyRepository loyaltyRepository;

    public LoyaltyAccount getOrCreateAccount(User user) {
        return loyaltyRepository.findByUser_Id(user.getId())
                .orElseGet(() -> loyaltyRepository.save(new LoyaltyAccount(user)));
    }

    @Transactional
    public void earnPoints(User user, BigDecimal orderTotal) {
        if (orderTotal == null || orderTotal.compareTo(BigDecimal.ZERO) <= 0) return;

        int pointsToEarn = orderTotal.divide(BigDecimal.valueOf(100), 0, java.math.RoundingMode.FLOOR).intValue();
        if (pointsToEarn <= 0) return;

        LoyaltyAccount account = getOrCreateAccount(user);
        account.setPointsBalance(account.getPointsBalance() + pointsToEarn);
        account.setLifetimeEarned(account.getLifetimeEarned() + pointsToEarn);
        account.setUpdatedAt(LocalDateTime.now());
        loyaltyRepository.save(account);
    }

    @Transactional
    public BigDecimal redeemPoints(User user, int pointsToRedeem, BigDecimal maxAllowedDiscount) {
        if (pointsToRedeem <= 0) return BigDecimal.ZERO;

        LoyaltyAccount account = getOrCreateAccount(user);
        if (account.getPointsBalance() < pointsToRedeem) {
            throw new IllegalArgumentException("Insufficient loyalty points. Balance: " + account.getPointsBalance());
        }

        BigDecimal discount = BigDecimal.valueOf(pointsToRedeem); // 1 point = ₹1
        if (maxAllowedDiscount != null && discount.compareTo(maxAllowedDiscount) > 0) {
            discount = maxAllowedDiscount;
            pointsToRedeem = discount.intValue();
        }

        account.setPointsBalance(account.getPointsBalance() - pointsToRedeem);
        account.setLifetimeRedeemed(account.getLifetimeRedeemed() + pointsToRedeem);
        account.setUpdatedAt(LocalDateTime.now());
        loyaltyRepository.save(account);

        return discount;
    }
}
