package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.order.OrderDTOs.OrderResponseDTO;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.NoSuchElementException;

@Service
public class RiderService {

    @Autowired
    private OrderRepository orderRepository;

    @Autowired
    private NotificationService notificationService;

    @Autowired
    private LoyaltyService loyaltyService;

    public List<OrderResponseDTO> getAvailableOrders() {
        // Orders ready or being prepared with status ACCEPTED or PREPARING or READY_FOR_PICKUP
        List<Order> orders = orderRepository.findAll().stream()
                .filter(o -> (o.getStatus() == OrderStatus.ACCEPTED || o.getStatus() == OrderStatus.PREPARING || o.getStatus() == OrderStatus.READY_FOR_PICKUP))
                .filter(o -> o.getOrderType() == OrderType.DELIVERY)
                .toList();

        return orders.stream().map(OrderResponseDTO::fromEntity).toList();
    }

    @Transactional
    public OrderResponseDTO acceptDelivery(User rider, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        order.setRiderName(rider.getName() + " (Swiggy Rider)");
        order.setRiderPhone(rider.getPhone());
        order.setStatus(OrderStatus.OUT_FOR_DELIVERY);
        orderRepository.save(order);

        notificationService.sendOrderUpdate(orderId, OrderStatus.OUT_FOR_DELIVERY.name(),
                rider.getName() + " picked up your order and is heading towards your location!", order.getEstimatedDeliveryMinutes());

        return OrderResponseDTO.fromEntity(order);
    }

    @Transactional
    public void updateLiveLocation(User rider, String orderId, Double lat, Double lng) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        notificationService.sendOrderUpdate(orderId, "LIVE_LOCATION",
                String.format("{\"lat\": %f, \"lng\": %f}", lat, lng), order.getEstimatedDeliveryMinutes());
    }

    @Transactional
    public OrderResponseDTO markDelivered(User rider, String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        order.setStatus(OrderStatus.DELIVERED);
        order.setDeliveredAt(LocalDateTime.now());
        order.setPaymentStatus(PaymentStatus.COMPLETED);
        orderRepository.save(order);

        // Award loyalty points to the customer
        loyaltyService.earnPoints(order.getUser(), order.getTotalAmount());

        notificationService.sendOrderUpdate(orderId, OrderStatus.DELIVERED.name(),
                "Your order has been safely delivered by " + rider.getName() + ". Enjoy your food!", 0);

        return OrderResponseDTO.fromEntity(order);
    }
}
