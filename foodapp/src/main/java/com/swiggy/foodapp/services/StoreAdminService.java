package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.admin.StoreAdminDTOs.*;
import com.swiggy.foodapp.dtos.order.OrderDTOs.OrderResponseDTO;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.*;

@Service
public class StoreAdminService {

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private StoreBranchRepository branchRepository;

    @Autowired
    private RestaurantStaffRepository staffRepository;

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    // --- Branch Outlets ---
    public List<StoreBranch> getBranches(Long restaurantId) {
        return branchRepository.findByRestaurant_Id(restaurantId);
    }

    public StoreBranch createBranch(Long restaurantId, CreateBranchRequest req) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + restaurantId));

        StoreBranch branch = new StoreBranch();
        branch.setRestaurant(r);
        branch.setBranchName(req.getBranchName());
        branch.setAddress(req.getAddress());
        branch.setArea(req.getArea() != null ? req.getArea() : r.getArea());
        branch.setCity(req.getCity() != null ? req.getCity() : r.getCity());
        branch.setPhone(req.getPhone() != null ? req.getPhone() : r.getPhone());
        branch.setManagerName(req.getManagerName());
        branch.setLatitude(req.getLatitude());
        branch.setLongitude(req.getLongitude());
        branch.setMainBranch(req.isMainBranch());
        branch.setAllowsTakeaway(req.isAllowsTakeaway());
        branch.setActive(true);

        return branchRepository.save(branch);
    }

    public void deleteBranch(Long branchId) {
        branchRepository.deleteById(branchId);
    }

    // --- Restaurant Staff ---
    public List<RestaurantStaff> getStaff(Long restaurantId) {
        return staffRepository.findByRestaurant_Id(restaurantId);
    }

    public RestaurantStaff createStaff(Long restaurantId, CreateStaffRequest req) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + restaurantId));

        RestaurantStaff staff = new RestaurantStaff(r, req.getName(), req.getEmail(), req.getPhone(),
                req.getStaffRole() != null ? req.getStaffRole() : "CHEF");
        return staffRepository.save(staff);
    }

    public void deleteStaff(Long staffId) {
        staffRepository.deleteById(staffId);
    }

    // --- Store Operations & Rush Mode ---
    @Transactional
    public Restaurant updateOperations(Long restaurantId, StoreOperationalUpdateRequest req) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + restaurantId));

        if (req.getIsOpen() != null) r.setOpen(req.getIsOpen());
        if (req.getIsKitchenBusy() != null) r.setKitchenBusy(req.getIsKitchenBusy());
        if (req.getRushExtraMinutes() != null) r.setRushExtraMinutes(req.getRushExtraMinutes());
        if (req.getOpeningTime() != null) r.setOpeningTime(req.getOpeningTime());
        if (req.getClosingTime() != null) r.setClosingTime(req.getClosingTime());
        if (req.getDeliveryFee() != null) r.setDeliveryFee(req.getDeliveryFee());
        if (req.getPackagingFee() != null) r.setPackagingFee(req.getPackagingFee());
        if (req.getFreeDeliveryThreshold() != null) r.setFreeDeliveryThreshold(req.getFreeDeliveryThreshold());

        return restaurantRepository.save(r);
    }

    // --- Live Orders & Cancellation Decisions ---
    public List<OrderResponseDTO> getLiveOrders(Long restaurantId) {
        List<Order> orders = orderRepository.findByRestaurant_IdOrderByCreatedAtDesc(restaurantId);
        return orders.stream()
                .filter(o -> o.getStatus() != OrderStatus.DELIVERED && o.getStatus() != OrderStatus.CANCELLED)
                .map(OrderResponseDTO::fromEntity)
                .toList();
    }

    @Transactional
    public OrderResponseDTO respondToCancellation(String orderId, boolean approve, String notes) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        if (order.getStatus() != OrderStatus.CANCEL_REQUESTED) {
            throw new IllegalStateException("Order is not currently in CANCEL_REQUESTED state");
        }

        if (approve) {
            order.setStatus(OrderStatus.CANCELLED);
            order.setCancelReason(notes != null ? notes : "Cancelled upon customer request by restaurant");
            notificationService.sendOrderUpdate(orderId, OrderStatus.CANCELLED.name(),
                    "Your cancellation request was approved by the restaurant.", 0);
        } else {
            order.setStatus(OrderStatus.PREPARING);
            notificationService.sendOrderUpdate(orderId, OrderStatus.PREPARING.name(),
                    "Cancellation request declined as food preparation was already underway.", order.getEstimatedDeliveryMinutes());
        }

        return OrderResponseDTO.fromEntity(orderRepository.save(order));
    }

    // --- Partner Cockpit Analytics ---
    public PartnerCockpitDTO getPartnerCockpit(Long restaurantId) {
        Restaurant r = restaurantRepository.findById(restaurantId)
                .orElseThrow(() -> new NoSuchElementException("Restaurant not found: " + restaurantId));

        List<Order> allOrders = orderRepository.findByRestaurant_IdOrderByCreatedAtDesc(restaurantId);

        BigDecimal grossSales = BigDecimal.ZERO;
        long totalOrders = allOrders.size();
        long deliveredOrders = 0;
        long cancelledOrders = 0;

        Map<Integer, Long> hourlyHeatmap = new HashMap<>();
        Map<String, Long> dishQuantities = new HashMap<>();
        Map<String, BigDecimal> dishRevenues = new HashMap<>();

        for (Order o : allOrders) {
            int hour = o.getCreatedAt().getHour();
            hourlyHeatmap.put(hour, hourlyHeatmap.getOrDefault(hour, 0L) + 1);

            if (o.getStatus() == OrderStatus.DELIVERED) {
                deliveredOrders++;
                grossSales = grossSales.add(o.getItemTotal());

                if (o.getOrderItems() != null) {
                    for (OrderItem item : o.getOrderItems()) {
                        dishQuantities.put(item.getDishName(), dishQuantities.getOrDefault(item.getDishName(), 0L) + item.getQuantity());
                        dishRevenues.put(item.getDishName(), dishRevenues.getOrDefault(item.getDishName(), BigDecimal.ZERO).add(item.getTotalPrice()));
                    }
                }
            } else if (o.getStatus() == OrderStatus.CANCELLED) {
                cancelledOrders++;
            }
        }

        BigDecimal commRate = r.getCommissionRate() != null ? r.getCommissionRate() : BigDecimal.valueOf(15.0);
        BigDecimal commissionDeducted = grossSales.multiply(commRate).divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);
        BigDecimal netEarnings = grossSales.subtract(commissionDeducted);

        BigDecimal aov = deliveredOrders > 0
                ? grossSales.divide(BigDecimal.valueOf(deliveredOrders), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;

        List<TopDishDTO> topDishes = new ArrayList<>();
        dishQuantities.entrySet().stream()
                .sorted(Map.Entry.<String, Long>comparingByValue().reversed())
                .limit(5)
                .forEach(e -> topDishes.add(new TopDishDTO(e.getKey(), e.getValue(), dishRevenues.getOrDefault(e.getKey(), BigDecimal.ZERO))));

        PartnerCockpitDTO dto = new PartnerCockpitDTO();
        dto.setRestaurantId(r.getId());
        dto.setRestaurantName(r.getName());
        dto.setOpen(r.isCurrentlyAcceptingOrders());
        dto.setKitchenBusy(r.isKitchenBusy());
        dto.setRushExtraMinutes(r.getRushExtraMinutes());
        dto.setGrossSales(grossSales);
        dto.setPlatformCommissionDeducted(commissionDeducted);
        dto.setNetEarnings(netEarnings);
        dto.setTotalOrders(totalOrders);
        dto.setDeliveredOrders(deliveredOrders);
        dto.setCancelledOrders(cancelledOrders);
        dto.setAverageOrderValue(aov);
        dto.setAvgRating(r.getAvgRating());
        dto.setTotalRatings(r.getTotalRatings());
        dto.setTopSellingDishes(topDishes);
        dto.setHourlyOrderHeatmap(hourlyHeatmap);

        return dto;
    }
}
