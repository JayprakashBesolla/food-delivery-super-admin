package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.services.OrderReceiptService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/orders")
public class OrderReceiptController {

    @Autowired
    private OrderReceiptService orderReceiptService;

    @GetMapping(value = "/{orderId}/receipt", produces = MediaType.TEXT_HTML_VALUE)
    public ResponseEntity<String> getOrderReceipt(@PathVariable String orderId) {
        try {
            String receiptHtml = orderReceiptService.generateHtmlReceipt(orderId);
            return ResponseEntity.ok(receiptHtml);
        } catch (Exception e) {
            return ResponseEntity.notFound().build();
        }
    }
}
