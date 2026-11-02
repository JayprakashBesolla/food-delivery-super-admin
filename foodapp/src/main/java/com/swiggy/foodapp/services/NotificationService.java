package com.swiggy.foodapp.services;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Service;

import java.util.Map;

@Service
public class NotificationService {

    private static final Logger logger = LoggerFactory.getLogger(NotificationService.class);

    @Autowired(required = false)
    private SimpMessagingTemplate messagingTemplate;

    public void sendOrderUpdate(String orderId, String status, String message, Integer etaMinutes) {
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/order/" + orderId, Map.of(
                        "orderId", orderId,
                        "status", status,
                        "message", message,
                        "etaMinutes", etaMinutes != null ? etaMinutes : 0
                ));
            } catch (Exception e) {
                logger.warn("Could not send WebSocket order update: {}", e.getMessage());
            }
        }
    }

    public void notifyRestaurantNewOrder(Long restaurantId, String orderId, String totalAmount) {
        if (messagingTemplate != null) {
            try {
                messagingTemplate.convertAndSend("/topic/restaurant/" + restaurantId, Map.of(
                        "type", "NEW_ORDER",
                        "orderId", orderId,
                        "totalAmount", totalAmount
                ));
            } catch (Exception e) {
                logger.warn("Could not send restaurant notification: {}", e.getMessage());
            }
        }
    }
}
