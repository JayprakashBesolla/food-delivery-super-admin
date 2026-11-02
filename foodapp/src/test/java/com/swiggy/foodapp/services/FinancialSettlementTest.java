package com.swiggy.foodapp.services;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.math.RoundingMode;

import static org.junit.jupiter.api.Assertions.*;

public class FinancialSettlementTest {

    @Test
    @DisplayName("Should reconcile Gross Sales, Platform Commission, TDS and Net Merchant Payout")
    public void testFinancialSettlementReconciliation() {
        // Given a restaurant with Gross Delivered Order Sales of ₹50,000.00
        BigDecimal grossSales = BigDecimal.valueOf(50000.00);
        BigDecimal commissionRate = BigDecimal.valueOf(15.00); // 15%

        // 1. Commission Calculation: ₹50,000 * 15% = ₹7,500.00
        BigDecimal platformCommission = grossSales.multiply(commissionRate)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("7500.00"), platformCommission);

        // 2. TDS Statutory Deduction: 1% Section 194-O e-commerce operator: ₹50,000 * 1% = ₹500.00
        BigDecimal tds = grossSales.multiply(BigDecimal.valueOf(1.0))
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        assertEquals(new BigDecimal("500.00"), tds);

        // 3. Net Merchant Payout: Gross (50,000) - Commission (7,500) - TDS (500) = ₹42,000.00
        BigDecimal netPayout = grossSales.subtract(platformCommission).subtract(tds);
        assertEquals(new BigDecimal("42000.00"), netPayout);

        // 4. Exact Mathematical Balance Sheet Identity: Gross = Commission + TDS + NetPayout
        BigDecimal reconstructedGross = platformCommission.add(tds).add(netPayout);
        assertEquals(grossSales, reconstructedGross, "Financial balance sheet must exactly balance without discrepancy");
    }

    @Test
    @DisplayName("Should handle zero gross sales without negative payout or division error")
    public void testZeroSalesSettlement() {
        BigDecimal grossSales = BigDecimal.ZERO;
        BigDecimal commRate = BigDecimal.valueOf(15.0);

        BigDecimal commission = grossSales.multiply(commRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal tds = grossSales.multiply(BigDecimal.valueOf(1.0)).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal netPayout = grossSales.subtract(commission).subtract(tds);

        if (netPayout.compareTo(BigDecimal.ZERO) < 0) {
            netPayout = BigDecimal.ZERO;
        }

        assertEquals(BigDecimal.ZERO.setScale(2), commission);
        assertEquals(BigDecimal.ZERO.setScale(2), tds);
        assertEquals(BigDecimal.ZERO.setScale(2), netPayout);
    }
}
