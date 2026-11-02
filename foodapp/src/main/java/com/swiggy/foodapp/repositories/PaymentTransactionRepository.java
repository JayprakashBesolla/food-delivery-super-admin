package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.PaymentTransaction;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface PaymentTransactionRepository extends JpaRepository<PaymentTransaction, Long> {

    Optional<PaymentTransaction> findByTransactionReference(String transactionReference);

    List<PaymentTransaction> findByStatusOrderByCreatedAtDesc(String status);

    List<PaymentTransaction> findByProviderOrderByCreatedAtDesc(String provider);

    List<PaymentTransaction> findByDisputeStatusNotOrderByCreatedAtDesc(String disputeStatus);

    List<PaymentTransaction> findAllByOrderByCreatedAtDesc();

    List<PaymentTransaction> findByCreatedAtBetweenOrderByCreatedAtDesc(LocalDateTime start, LocalDateTime end);

    long countByStatus(String status);
}
