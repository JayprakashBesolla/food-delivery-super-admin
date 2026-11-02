package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.admin.StoreAdminDTOs.*;
import com.swiggy.foodapp.entities.Restaurant;
import com.swiggy.foodapp.entities.RestaurantStaff;
import com.swiggy.foodapp.entities.StoreBranch;
import com.swiggy.foodapp.services.StoreAdminService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/store-admin")
public class StoreAdminController {

    @Autowired
    private StoreAdminService storeAdminService;

    // --- Partner Cockpit ---
    @GetMapping("/cockpit/{restaurantId}")
    public ResponseEntity<PartnerCockpitDTO> getPartnerCockpit(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(storeAdminService.getPartnerCockpit(restaurantId));
    }

    // --- Multi-Branch Outlet Management ---
    @GetMapping("/branches/{restaurantId}")
    public ResponseEntity<List<StoreBranch>> getBranches(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(storeAdminService.getBranches(restaurantId));
    }

    @PostMapping("/branches/{restaurantId}")
    public ResponseEntity<StoreBranch> createBranch(
            @PathVariable Long restaurantId,
            @RequestBody CreateBranchRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(storeAdminService.createBranch(restaurantId, req));
    }

    @DeleteMapping("/branches/{branchId}")
    public ResponseEntity<?> deleteBranch(@PathVariable Long branchId) {
        storeAdminService.deleteBranch(branchId);
        return ResponseEntity.ok(Map.of("message", "Branch deleted successfully", "branchId", branchId));
    }

    // --- Restaurant Staff Management ---
    @GetMapping("/staff/{restaurantId}")
    public ResponseEntity<List<RestaurantStaff>> getStaff(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(storeAdminService.getStaff(restaurantId));
    }

    @PostMapping("/staff/{restaurantId}")
    public ResponseEntity<RestaurantStaff> createStaff(
            @PathVariable Long restaurantId,
            @RequestBody CreateStaffRequest req) {
        return ResponseEntity.status(HttpStatus.CREATED).body(storeAdminService.createStaff(restaurantId, req));
    }

    @DeleteMapping("/staff/{staffId}")
    public ResponseEntity<?> deleteStaff(@PathVariable Long staffId) {
        storeAdminService.deleteStaff(staffId);
        return ResponseEntity.ok(Map.of("message", "Staff member removed", "staffId", staffId));
    }

    // --- Store Operations & Rush Hour Mode ---
    @PatchMapping("/operations/{restaurantId}")
    public ResponseEntity<Restaurant> updateOperations(
            @PathVariable Long restaurantId,
            @RequestBody StoreOperationalUpdateRequest req) {
        return ResponseEntity.ok(storeAdminService.updateOperations(restaurantId, req));
    }

    // --- Live Kitchen Orders Stream ---
    @GetMapping("/orders/live/{restaurantId}")
    public ResponseEntity<?> getLiveOrders(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(storeAdminService.getLiveOrders(restaurantId));
    }

    // --- Cancellation Decision Engine ---
    public static class CancellationDecisionRequest {
        private boolean approve;
        private String notes;

        public boolean isApprove() { return approve; }
        public void setApprove(boolean approve) { this.approve = approve; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    @PostMapping("/orders/{orderId}/cancellation-response")
    public ResponseEntity<?> respondToCancellation(
            @PathVariable String orderId,
            @RequestBody CancellationDecisionRequest req) {
        try {
            return ResponseEntity.ok(storeAdminService.respondToCancellation(orderId, req.isApprove(), req.getNotes()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @Autowired
    private com.swiggy.foodapp.services.OrderService orderService;

    public static class PrescriptionVerificationRequest {
        private boolean approve;
        private String notes;

        public boolean isApprove() { return approve; }
        public void setApprove(boolean approve) { this.approve = approve; }
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    @PatchMapping("/orders/{orderId}/verify-prescription")
    public ResponseEntity<?> verifyPrescription(
            @PathVariable String orderId,
            @RequestBody PrescriptionVerificationRequest req) {
        try {
            return ResponseEntity.ok(orderService.verifyPrescription(orderId, req.isApprove(), req.getNotes()));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }
}
