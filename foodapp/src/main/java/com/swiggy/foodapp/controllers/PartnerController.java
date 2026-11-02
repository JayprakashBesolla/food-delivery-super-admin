package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.order.OrderDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import com.swiggy.foodapp.services.OrderService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.math.BigDecimal;
import java.util.*;

@RestController
@RequestMapping("/api/partner")
public class PartnerController {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private OrderService orderService;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private DishRepository dishRepository;

    @Autowired
    private CategoryRepository categoryRepository;

    @Autowired
    private com.swiggy.foodapp.services.FileStorageService fileStorageService;

    @Autowired
    private DishVariantRepository dishVariantRepository;

    @Autowired
    private DishAddonRepository dishAddonRepository;

    @GetMapping("/orders/{restaurantId}")
    public ResponseEntity<?> getRestaurantOrders(
            @PathVariable Long restaurantId,
            @RequestParam(required = false) OrderStatus status) {
        List<Order> orders;
        if (status != null) {
            orders = orderRepository.findByRestaurant_IdAndStatusOrderByCreatedAtDesc(restaurantId, status);
        } else {
            orders = orderRepository.findByRestaurant_IdOrderByCreatedAtDesc(restaurantId);
        }
        return ResponseEntity.ok(orders.stream().map(OrderResponseDTO::fromEntity).toList());
    }

    public static class UpdateStatusRequest {
        private OrderStatus status;
        private String riderName;
        private String riderPhone;
        private Integer etaMinutes;

        public OrderStatus getStatus() { return status; }
        public void setStatus(OrderStatus status) { this.status = status; }
        public String getRiderName() { return riderName; }
        public void setRiderName(String riderName) { this.riderName = riderName; }
        public String getRiderPhone() { return riderPhone; }
        public void setRiderPhone(String riderPhone) { this.riderPhone = riderPhone; }
        public Integer getEtaMinutes() { return etaMinutes; }
        public void setEtaMinutes(Integer etaMinutes) { this.etaMinutes = etaMinutes; }
    }

    @PatchMapping("/orders/{orderId}/status")
    public ResponseEntity<?> updateOrderStatus(
            @PathVariable String orderId,
            @RequestBody UpdateStatusRequest req) {
        try {
            OrderResponseDTO updated = orderService.updateOrderStatus(
                    orderId, req.getStatus(), req.getRiderName(), req.getRiderPhone(), req.getEtaMinutes());
            return ResponseEntity.ok(updated);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", e.getMessage()));
        }
    }

    @PatchMapping("/restaurants/{restaurantId}/toggle-open")
    public ResponseEntity<?> toggleStoreOpen(@PathVariable Long restaurantId) {
        Restaurant r = restaurantRepository.findById(restaurantId).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();

        r.setOpen(!r.isOpen());
        restaurantRepository.save(r);
        return ResponseEntity.ok(Map.of("isOpen", r.isOpen(), "message", "Store status updated to " + (r.isOpen() ? "OPEN" : "CLOSED")));
    }

    @PatchMapping("/dishes/{dishId}/toggle-stock")
    public ResponseEntity<?> toggleDishAvailability(@PathVariable Long dishId) {
        Dish dish = dishRepository.findById(dishId).orElse(null);
        if (dish == null) return ResponseEntity.notFound().build();

        dish.setAvailable(!dish.isAvailable());
        dishRepository.save(dish);
        return ResponseEntity.ok(Map.of("isAvailable", dish.isAvailable(), "dishName", dish.getName()));
    }

    @GetMapping("/analytics/{restaurantId}")
    public ResponseEntity<?> getPartnerAnalytics(@PathVariable Long restaurantId) {
        Restaurant r = restaurantRepository.findById(restaurantId).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();

        List<Order> orders = orderRepository.findByRestaurant_IdOrderByCreatedAtDesc(restaurantId);

        BigDecimal totalRevenue = BigDecimal.ZERO;
        long totalOrders = orders.size();
        long activeOrders = 0;
        long deliveredOrders = 0;

        for (Order o : orders) {
            if (o.getStatus() == OrderStatus.DELIVERED) {
                deliveredOrders++;
                totalRevenue = totalRevenue.add(o.getTotalAmount());
            } else if (o.getStatus() != OrderStatus.CANCELLED) {
                activeOrders++;
            }
        }

        return ResponseEntity.ok(Map.of(
                "restaurantName", r.getName(),
                "totalOrders", totalOrders,
                "activeOrders", activeOrders,
                "deliveredOrders", deliveredOrders,
                "totalRevenue", totalRevenue,
                "avgRating", r.getAvgRating(),
                "totalRatings", r.getTotalRatings(),
                "isOpen", r.isOpen()
        ));
    }

    // --- Menu Category Management ---
    @PostMapping("/restaurants/{restaurantId}/categories")
    public ResponseEntity<?> addCategory(
            @PathVariable Long restaurantId,
            @RequestBody Map<String, String> body) {
        Restaurant r = restaurantRepository.findById(restaurantId).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();

        String name = body.get("name");
        Category category = new Category(r, name, 0);
        return ResponseEntity.ok(categoryRepository.save(category));
    }

    @DeleteMapping("/categories/{categoryId}")
    public ResponseEntity<?> deleteCategory(@PathVariable Long categoryId) {
        categoryRepository.deleteById(categoryId);
        return ResponseEntity.ok(Map.of("message", "Category deleted"));
    }

    // --- Dish Management with Multipart Image Upload ---
    @PostMapping(value = "/restaurants/{restaurantId}/dishes", consumes = org.springframework.http.MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<?> addDish(
            @PathVariable Long restaurantId,
            @RequestParam("name") String name,
            @RequestParam("price") BigDecimal price,
            @RequestParam(value = "description", required = false) String description,
            @RequestParam(value = "categoryId", required = false) Long categoryId,
            @RequestParam(value = "isVeg", defaultValue = "true") boolean isVeg,
            @RequestParam(value = "isBestseller", defaultValue = "false") boolean isBestseller,
            @RequestParam(value = "prepTimeMinutes", defaultValue = "20") int prepTimeMinutes,
            @RequestParam(value = "mrp", required = false) BigDecimal mrp,
            @RequestParam(value = "unit", required = false) String unit,
            @RequestParam(value = "brand", required = false) String brand,
            @RequestParam(value = "stockQuantity", defaultValue = "100") Integer stockQuantity,
            @RequestParam(value = "prescriptionRequired", defaultValue = "false") boolean prescriptionRequired,
            @RequestParam(value = "barcode", required = false) String barcode,
            @RequestParam(value = "image", required = false) org.springframework.web.multipart.MultipartFile image) {

        Restaurant r = restaurantRepository.findById(restaurantId).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();

        Dish dish = new Dish();
        dish.setRestaurant(r);
        dish.setName(name);
        dish.setPrice(price);
        dish.setDescription(description);
        dish.setVeg(isVeg);
        dish.setBestseller(isBestseller);
        dish.setPrepTimeMinutes(prepTimeMinutes);
        dish.setMrp(mrp != null ? mrp : price);
        dish.setUnit(unit);
        dish.setBrand(brand);
        dish.setStockQuantity(stockQuantity);
        dish.setPrescriptionRequired(prescriptionRequired);
        dish.setBarcode(barcode);
        dish.setAvailable(stockQuantity > 0);

        if (categoryId != null) {
            categoryRepository.findById(categoryId).ifPresent(dish::setCategory);
        }

        if (image != null && !image.isEmpty()) {
            String imageUrl = fileStorageService.storeFile(image);
            dish.setImageUrl(imageUrl);
        }

        Dish saved = dishRepository.save(dish);
        return ResponseEntity.ok(com.swiggy.foodapp.dtos.menu.MenuDTOs.DishDTO.fromEntity(saved));
    }

    @PostMapping("/dishes/{dishId}/variants")
    public ResponseEntity<?> addVariant(
            @PathVariable Long dishId,
            @RequestBody Map<String, Object> body) {
        Dish dish = dishRepository.findById(dishId).orElse(null);
        if (dish == null) return ResponseEntity.notFound().build();

        String name = (String) body.get("variantName");
        BigDecimal price = new BigDecimal(body.get("price").toString());

        DishVariant variant = new DishVariant(dish, name, price);
        return ResponseEntity.ok(dishVariantRepository.save(variant));
    }

    @PostMapping("/dishes/{dishId}/addons")
    public ResponseEntity<?> addAddon(
            @PathVariable Long dishId,
            @RequestBody Map<String, Object> body) {
        Dish dish = dishRepository.findById(dishId).orElse(null);
        if (dish == null) return ResponseEntity.notFound().build();

        String name = (String) body.get("addonName");
        BigDecimal price = new BigDecimal(body.get("price").toString());

        DishAddon addon = new DishAddon(dish, name, price);
        return ResponseEntity.ok(dishAddonRepository.save(addon));
    }

    @DeleteMapping("/dishes/{dishId}")
    public ResponseEntity<?> deleteDish(@PathVariable Long dishId) {
        dishRepository.deleteById(dishId);
        return ResponseEntity.ok(Map.of("message", "Dish deleted successfully"));
    }

    // --- Partner KYC Submission ---
    @Autowired
    private com.swiggy.foodapp.repositories.MerchantKycRepository merchantKycRepository;

    @PostMapping("/kyc/{restaurantId}")
    public ResponseEntity<?> submitKyc(
            @PathVariable Long restaurantId,
            @RequestBody MerchantKycRecord req) {
        Restaurant r = restaurantRepository.findById(restaurantId).orElse(null);
        if (r == null) return ResponseEntity.notFound().build();

        MerchantKycRecord kyc = merchantKycRepository.findByRestaurant_Id(restaurantId)
                .orElse(new MerchantKycRecord());

        kyc.setRestaurant(r);
        kyc.setBusinessName(req.getBusinessName());
        kyc.setGstin(req.getGstin());
        kyc.setFssaiLicense(req.getFssaiLicense());
        kyc.setPanNumber(req.getPanNumber());
        kyc.setBankAccountNumber(req.getBankAccountNumber());
        kyc.setBankIfsc(req.getBankIfsc());
        kyc.setStatus("PENDING");
        kyc.setSubmittedAt(java.time.LocalDateTime.now());

        return ResponseEntity.ok(merchantKycRepository.save(kyc));
    }

    @GetMapping("/kyc/{restaurantId}")
    public ResponseEntity<?> getKycStatus(@PathVariable Long restaurantId) {
        return ResponseEntity.ok(merchantKycRepository.findByRestaurant_Id(restaurantId)
                .orElse(null));
    }
}
