package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.AuditLog;
import com.swiggy.foodapp.repositories.AuditLogRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Service;

@Service
public class AuditLogService {

    @Autowired
    private AuditLogRepository auditLogRepository;

    public AuditLog recordAction(String actorEmail, String actorRole, String action,
                                 String targetEntityType, String targetEntityId,
                                 String details, String ipAddress) {
        AuditLog log = new AuditLog(
                actorEmail != null ? actorEmail : "system@swiggy.com",
                actorRole != null ? actorRole : "SUPER_ADMIN",
                action,
                targetEntityType,
                targetEntityId,
                details,
                ipAddress != null ? ipAddress : "127.0.0.1"
        );
        return auditLogRepository.save(log);
    }
}
