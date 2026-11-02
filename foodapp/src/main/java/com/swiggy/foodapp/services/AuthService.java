package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.auth.AuthDTOs.*;
import com.swiggy.foodapp.entities.Role;
import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.repositories.UserRepository;
import com.swiggy.foodapp.security.JwtTokenProvider;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

@Service
public class AuthService {

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private JwtTokenProvider tokenProvider;

    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use: " + request.getEmail());
        }
        if (userRepository.existsByPhone(request.getPhone())) {
            throw new IllegalArgumentException("Phone number already in use: " + request.getPhone());
        }

        User user = new User();
        user.setName(request.getName());
        user.setEmail(request.getEmail().toLowerCase().trim());
        user.setPhone(request.getPhone().trim());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setRole(request.getRole() != null ? request.getRole() : Role.CUSTOMER);

        User saved = userRepository.save(user);

        String token = tokenProvider.generateToken(saved.getId(), saved.getEmail(), saved.getRole().name());

        return new AuthResponse(token, saved.getId(), saved.getName(), saved.getEmail(), saved.getPhone(), saved.getRole());
    }

    public AuthResponse login(LoginRequest request) {
        String identifier = request.getUsernameOrEmailOrPhone().trim();

        User user = userRepository.findByEmail(identifier.toLowerCase())
                .or(() -> userRepository.findByPhone(identifier))
                .orElseThrow(() -> new IllegalArgumentException("User not found with identifier: " + identifier));

        if (!passwordEncoder.matches(request.getPassword(), user.getPassword())) {
            throw new IllegalArgumentException("Invalid password credentials");
        }

        String token = tokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole().name());

        return new AuthResponse(token, user.getId(), user.getName(), user.getEmail(), user.getPhone(), user.getRole());
    }
}
