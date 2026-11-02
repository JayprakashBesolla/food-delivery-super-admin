package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.services.SearchService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/search")
public class SearchController {

    @Autowired
    private SearchService searchService;

    @GetMapping
    public ResponseEntity<?> search(
            @RequestParam(name = "q", required = false) String query,
            @RequestParam(required = false) com.swiggy.foodapp.entities.BusinessSector sector) {
        return ResponseEntity.ok(searchService.search(query, sector));
    }
}
