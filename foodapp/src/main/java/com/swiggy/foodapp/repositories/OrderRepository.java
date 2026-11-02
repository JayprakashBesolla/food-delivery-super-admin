package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.Order;
import com.swiggy.foodapp.entities.OrderStatus;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface OrderRepository extends JpaRepository<Order, String> {
    List<Order> findByUser_IdOrderByCreatedAtDesc(Long userId);
    Page<Order> findByUser_IdOrderByCreatedAtDesc(Long userId, Pageable pageable);

    List<Order> findByRestaurant_IdOrderByCreatedAtDesc(Long restaurantId);
    Page<Order> findByRestaurant_IdOrderByCreatedAtDesc(Long restaurantId, Pageable pageable);

    List<Order> findByRestaurant_IdAndStatusOrderByCreatedAtDesc(Long restaurantId, OrderStatus status);
    List<Order> findByStatusOrderByCreatedAtDesc(OrderStatus status);
    List<Order> findByStatusInOrderByCreatedAtDesc(List<OrderStatus> statuses);
    List<Order> findAllByOrderByCreatedAtDesc();
    List<Order> findByCreatedAtBetweenOrderByCreatedAtDesc(java.time.LocalDateTime start, java.time.LocalDateTime end);

    long countByRestaurant_Id(Long restaurantId);
    long countByRestaurant_IdAndStatus(Long restaurantId, OrderStatus status);
    long countByStatus(OrderStatus status);
    long countByUser_Id(Long userId);
}
