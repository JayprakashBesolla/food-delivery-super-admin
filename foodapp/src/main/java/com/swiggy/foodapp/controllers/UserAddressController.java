package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.entities.User;
import com.swiggy.foodapp.entities.UserAddress;
import com.swiggy.foodapp.repositories.UserAddressRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/locations")
public class UserAddressController {

    @Autowired
    private UserAddressRepository userAddressRepository;

    @GetMapping
    public ResponseEntity<?> getSavedAddresses(@AuthenticationPrincipal User user) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();
        return ResponseEntity.ok(userAddressRepository.findByUser_Id(user.getId()));
    }

    @PostMapping
    public ResponseEntity<?> saveAddress(@AuthenticationPrincipal User user, @RequestBody UserAddress address) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        address.setUser(user);
        List<UserAddress> existing = userAddressRepository.findByUser_Id(user.getId());
        if (existing.isEmpty() || address.isDefault()) {
            existing.forEach(a -> a.setDefault(false));
            userAddressRepository.saveAll(existing);
            address.setDefault(true);
        }

        UserAddress saved = userAddressRepository.save(address);
        return ResponseEntity.ok(saved);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteAddress(@AuthenticationPrincipal User user, @PathVariable Long id) {
        if (user == null) return ResponseEntity.status(HttpStatus.UNAUTHORIZED).build();

        UserAddress addr = userAddressRepository.findById(id).orElse(null);
        if (addr != null && addr.getUser().getId().equals(user.getId())) {
            userAddressRepository.delete(addr);
            return ResponseEntity.ok(Map.of("message", "Address deleted successfully"));
        }
        return ResponseEntity.notFound().build();
    }
}
