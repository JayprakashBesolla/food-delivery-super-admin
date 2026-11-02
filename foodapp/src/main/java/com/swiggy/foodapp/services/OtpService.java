package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.PasswordResetOtp;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.repositories.PasswordResetOtpRepository;
import com.swiggy.foodapp.repositories.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.time.LocalDateTime;
import java.util.Optional;

@Service
public class OtpService {

    @Autowired
    private PasswordResetOtpRepository otpRepository;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    public String sendOtp(String emailOrPhone) {
        String target = emailOrPhone.trim();

        // Verify user exists
        boolean exists = userRepository.findByEmail(target.toLowerCase()).isPresent() ||
                userRepository.findByPhone(target).isPresent();

        if (!exists) {
            throw new IllegalArgumentException("No account registered with: " + target);
        }

        // Generate 6-digit OTP
        SecureRandom random = new SecureRandom();
        int num = 100000 + random.nextInt(900000);
        String otp = String.valueOf(num);

        PasswordResetOtp record = new PasswordResetOtp(target, otp, LocalDateTime.now().plusMinutes(5));
        otpRepository.save(record);

        return otp; // In production, send via Twilio SMS / JavaMailSender
    }

    public boolean verifyOtp(String emailOrPhone, String otp) {
        Optional<PasswordResetOtp> opt = otpRepository.findTopByEmailOrPhoneAndIsUsedFalseOrderByExpiryTimeDesc(emailOrPhone.trim());
        if (opt.isEmpty()) return false;

        PasswordResetOtp record = opt.get();
        if (record.getExpiryTime().isBefore(LocalDateTime.now())) return false;

        return record.getOtp().equals(otp.trim());
    }

    @Transactional
    public void resetPassword(String emailOrPhone, String otp, String newPassword) {
        if (!verifyOtp(emailOrPhone, otp)) {
            throw new IllegalArgumentException("Invalid or expired OTP");
        }

        String target = emailOrPhone.trim();
        User user = userRepository.findByEmail(target.toLowerCase())
                .or(() -> userRepository.findByPhone(target))
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + target));

        user.setPassword(passwordEncoder.encode(newPassword));
        userRepository.save(user);

        // Mark OTP as used
        otpRepository.findTopByEmailOrPhoneAndIsUsedFalseOrderByExpiryTimeDesc(target)
                .ifPresent(record -> {
                    record.setUsed(true);
                    otpRepository.save(record);
                });
    }
}
