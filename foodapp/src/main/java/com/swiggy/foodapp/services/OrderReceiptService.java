package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.Order;
import com.swiggy.foodapp.entities.OrderItem;
import com.swiggy.foodapp.entities.Restaurant;
import com.swiggy.foodapp.repositories.OrderRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

import java.time.format.DateTimeFormatter;
import java.util.NoSuchElementException;

@Service
public class OrderReceiptService {

    @Autowired
    private OrderRepository orderRepository;

    public String generateHtmlReceipt(String orderId) {
        Order order = orderRepository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("Order not found: " + orderId));

        Restaurant r = order.getRestaurant();
        DateTimeFormatter dtf = DateTimeFormatter.ofPattern("dd MMM yyyy, hh:mm a");

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset='UTF-8'><title>Invoice - ").append(order.getOrderId()).append("</title>");
        html.append("<style>");
        html.append("body { font-family: 'Helvetica Neue', Arial, sans-serif; color: #333; margin: 40px; }");
        html.append(".receipt-box { max-width: 600px; margin: auto; padding: 30px; border: 1px solid #eee; box-shadow: 0 0 10px rgba(0,0,0,0.15); border-radius: 8px; }");
        html.append(".header { text-align: center; border-bottom: 2px solid #fc8019; padding-bottom: 20px; }");
        html.append(".header h1 { color: #fc8019; margin: 0; font-size: 26px; }");
        html.append(".header p { margin: 5px 0 0; color: #777; font-size: 14px; }");
        html.append(".meta { margin: 20px 0; font-size: 14px; line-height: 1.6; }");
        html.append(".meta strong { color: #111; }");
        html.append("table { width: 100%; border-collapse: collapse; margin: 20px 0; }");
        html.append("th, td { padding: 10px; border-bottom: 1px solid #ddd; text-align: left; font-size: 14px; }");
        html.append("th { background: #fafafa; font-weight: 600; }");
        html.append(".totals { text-align: right; margin-top: 20px; font-size: 14px; line-height: 1.8; }");
        html.append(".grand-total { font-size: 18px; font-weight: bold; color: #111; border-top: 2px solid #333; padding-top: 10px; }");
        html.append(".footer { text-align: center; margin-top: 30px; font-size: 12px; color: #aaa; }");
        html.append("</style></head><body>");

        html.append("<div class='receipt-box'>");
        html.append("<div class='header'>");
        html.append("<h1>").append(r != null ? r.getName() : "Swiggy Food").append("</h1>");
        html.append("<p>").append(r != null ? r.getAddress() + ", " + r.getCity() : "").append("</p>");
        html.append("<p>Tax Invoice / Food Order Receipt</p>");
        html.append("</div>");

        html.append("<div class='meta'>");
        html.append("<strong>Order ID:</strong> ").append(order.getOrderId()).append("<br/>");
        html.append("<strong>Date & Time:</strong> ").append(order.getCreatedAt().format(dtf)).append("<br/>");
        html.append("<strong>Customer:</strong> ").append(order.getUser().getName()).append(" (").append(order.getUser().getPhone()).append(")<br/>");
        html.append("<strong>Delivery Address:</strong> ").append(order.getDeliveryAddress()).append("<br/>");
        html.append("<strong>Payment:</strong> ").append(order.getPaymentMethod()).append(" (").append(order.getPaymentStatus()).append(")");
        html.append("</div>");

        html.append("<table>");
        html.append("<tr><th>Item</th><th>Qty</th><th>Price</th><th>Total</th></tr>");

        if (order.getOrderItems() != null) {
            for (OrderItem item : order.getOrderItems()) {
                html.append("<tr>");
                html.append("<td><strong>").append(item.getDishName()).append("</strong>");
                if (item.getSelectedVariant() != null) {
                    html.append("<br/><small style='color:#666'>Size: ").append(item.getSelectedVariant()).append("</small>");
                }
                if (item.getSelectedAddons() != null) {
                    html.append("<br/><small style='color:#666'>Add-ons: ").append(item.getSelectedAddons()).append("</small>");
                }
                html.append("</td>");
                html.append("<td>").append(item.getQuantity()).append("</td>");
                html.append("<td>₹").append(item.getPricePerUnit()).append("</td>");
                html.append("<td>₹").append(item.getTotalPrice()).append("</td>");
                html.append("</tr>");
            }
        }

        html.append("</table>");

        html.append("<div class='totals'>");
        html.append("Item Total: ₹").append(order.getItemTotal()).append("<br/>");
        html.append("Packaging Charges: ₹").append(order.getPackagingFee()).append("<br/>");
        html.append("Delivery Charges: ₹").append(order.getDeliveryFee()).append("<br/>");
        html.append("Taxes (GST): ₹").append(order.getTaxAmount()).append("<br/>");
        if (order.getDiscountAmount() != null && order.getDiscountAmount().compareTo(java.math.BigDecimal.ZERO) > 0) {
            html.append("<span style='color:green'>Discount: -₹").append(order.getDiscountAmount()).append("</span><br/>");
        }
        html.append("<div class='grand-total'>Total Paid: ₹").append(order.getTotalAmount()).append("</div>");
        html.append("</div>");

        html.append("<div class='footer'>");
        html.append("Thank you for ordering with Swiggy Food! For any queries, contact support@swiggy.com.");
        html.append("</div>");

        html.append("</div></body></html>");

        return html.toString();
    }
}
