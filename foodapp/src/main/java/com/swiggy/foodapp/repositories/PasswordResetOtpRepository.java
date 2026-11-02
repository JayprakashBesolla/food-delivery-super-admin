package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.PasswordResetOtp;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface PasswordResetOtpRepository extends JpaRepository<PasswordResetOtp, Long> {
    @Query("SELECT p FROM PasswordResetOtp p WHERE p.emailOrPhone = :emailOrPhone AND p.isUsed = false ORDER BY p.expiryTime DESC LIMIT 1")
    Optional<PasswordResetOtp> findTopByEmailOrPhoneAndIsUsedFalseOrderByExpiryTimeDesc(@Param("emailOrPhone") String emailOrPhone);
}
