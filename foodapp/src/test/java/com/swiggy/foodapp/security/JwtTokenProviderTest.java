package com.swiggy.foodapp.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.test.util.ReflectionTestUtils;

import static org.junit.jupiter.api.Assertions.*;

public class JwtTokenProviderTest {

    private JwtTokenProvider jwtTokenProvider;
    private final String testSecret = "swiggy-secret-key-super-secure-production-ready-foodapp-jwt-secret-key-123456789";
    private final long testExpiration = 3600000; // 1 hour

    @BeforeEach
    public void setup() {
        jwtTokenProvider = new JwtTokenProvider();
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtSecret", testSecret);
        ReflectionTestUtils.setField(jwtTokenProvider, "jwtExpirationInMs", testExpiration);
    }

    @Test
    @DisplayName("Should generate valid JWT token for authenticated User")
    public void testGenerateToken() {
        String token = jwtTokenProvider.generateToken(1L, "admin@swiggy.com", "SUPER_ADMIN");
        assertNotNull(token);
        assertTrue(token.length() > 20);

        // Verify email extraction
        String email = jwtTokenProvider.getEmailFromToken(token);
        assertEquals("admin@swiggy.com", email);

        // Verify token validity
        assertTrue(jwtTokenProvider.validateToken(token));
    }

    @Test
    @DisplayName("Should reject invalid or tampered JWT token")
    public void testInvalidTokenRejection() {
        String tamperedToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.invalidpayload.invalidsignature";
        assertFalse(jwtTokenProvider.validateToken(tamperedToken));
    }

    @Test
    @DisplayName("Should extract correct user role and ID claims")
    public void testRoleAndIdClaims() {
        String token = jwtTokenProvider.generateToken(42L, "customer@swiggy.com", "CUSTOMER");
        assertEquals("customer@swiggy.com", jwtTokenProvider.getEmailFromToken(token));
        assertEquals(42L, jwtTokenProvider.getUserIdFromToken(token));
        assertEquals("CUSTOMER", jwtTokenProvider.getRoleFromToken(token));
    }
}
