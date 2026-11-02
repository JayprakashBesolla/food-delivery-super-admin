package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.AuditLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;

@Repository
public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    List<AuditLog> findAllByOrderByTimestampDesc();

    List<AuditLog> findByActorEmailOrderByTimestampDesc(String actorEmail);

    List<AuditLog> findByActionOrderByTimestampDesc(String action);

    List<AuditLog> findByTargetEntityTypeOrderByTimestampDesc(String targetEntityType);

    List<AuditLog> findByTimestampBetweenOrderByTimestampDesc(LocalDateTime start, LocalDateTime end);
}
