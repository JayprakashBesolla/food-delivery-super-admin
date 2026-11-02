package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.PlatformNotification;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface PlatformNotificationRepository extends JpaRepository<PlatformNotification, Long> {

    List<PlatformNotification> findAllByOrderBySentAtDesc();

    List<PlatformNotification> findByTargetAudienceOrderBySentAtDesc(String targetAudience);
}
