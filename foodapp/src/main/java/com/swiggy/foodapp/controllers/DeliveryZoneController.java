package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.entities.DeliveryZone;
import com.swiggy.foodapp.repositories.DeliveryZoneRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/zones")
public class DeliveryZoneController {

    @Autowired
    private DeliveryZoneRepository deliveryZoneRepository;

    @GetMapping
    public ResponseEntity<List<DeliveryZone>> getAllZones() {
        return ResponseEntity.ok(deliveryZoneRepository.findAll());
    }

    @PostMapping
    public ResponseEntity<?> createZone(@RequestBody DeliveryZone zone) {
        return ResponseEntity.ok(deliveryZoneRepository.save(zone));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> deleteZone(@PathVariable Long id) {
        deliveryZoneRepository.deleteById(id);
        return ResponseEntity.ok().build();
    }
}
