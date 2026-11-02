package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.sector.SectorDTO;
import com.swiggy.foodapp.entities.BusinessSector;
import com.swiggy.foodapp.entities.RestaurantStatus;
import com.swiggy.foodapp.repositories.RestaurantRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
@RequestMapping("/api/sectors")
public class SectorController {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @GetMapping
    public ResponseEntity<List<SectorDTO>> getAllSectors() {
        List<SectorDTO> sectors = new ArrayList<>();
        for (BusinessSector sector : BusinessSector.values()) {
            long activeCount = restaurantRepository.countByBusinessSectorAndStatus(sector, RestaurantStatus.ACTIVE);
            sectors.add(new SectorDTO(sector, activeCount));
        }
        return ResponseEntity.ok(sectors);
    }
}
