package com.swiggy.foodapp.entities;

import jakarta.persistence.*;
import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "operational_tasks")
public class OperationalTask {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String taskNumber; // e.g. TSK-100928

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private Department department; // FINANCE, OPERATIONS, SUPPORT

    @Column(nullable = false)
    private String taskType; // SETTLEMENT_REVIEW, PAYMENT_FAILURE, REFUND_REQUEST, etc.

    @Column(nullable = false)
    private String priority = "MEDIUM"; // LOW, MEDIUM, HIGH, URGENT

    @Column(nullable = false)
    private String status = "QUEUED"; // NEW, QUEUED, ASSIGNED, IN_PROGRESS, MAKER_REVIEWED, WAITING, COMPLETED, REJECTED, ESCALATED

    private String entityType; // ORDER, SETTLEMENT, RESTAURANT, PAYMENT, USER, DISPUTE
    private String entityId;
    private BigDecimal entityAmount; // Useful for monetary threshold evaluation
    private String city; // Used for Level-3 Scope verification (Hyderabad, etc.)

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "assigned_to_id")
    private User assignedTo;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "maker_user_id")
    private User makerUser;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "checker_user_id")
    private User checkerUser;

    private boolean requiresFourEyesApproval = false; // High-value actions requiring Maker-Checker

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(columnDefinition = "TEXT")
    private String makerNotes;

    @Column(columnDefinition = "TEXT")
    private String checkerNotes;

    @Column(columnDefinition = "TEXT")
    private String resolutionNotes;

    private Integer slaMinutes;
    private LocalDateTime slaDeadline;
    private boolean isEscalated = false;
    private String escalationReason;

    private LocalDateTime createdAt = LocalDateTime.now();
    private LocalDateTime startedAt;
    private LocalDateTime completedAt;

    @Version
    private Long version = 0L; // Concurrency-safe optimistic record locking

    public OperationalTask() {}

    public OperationalTask(String taskNumber, Department department, String taskType,
                           String priority, String entityType, String entityId,
                           BigDecimal entityAmount, String city, String description, Integer slaMinutes) {
        this.taskNumber = taskNumber;
        this.department = department;
        this.taskType = taskType;
        this.priority = priority;
        this.entityType = entityType;
        this.entityId = entityId;
        this.entityAmount = entityAmount;
        this.city = city;
        this.description = description;
        this.slaMinutes = slaMinutes != null ? slaMinutes : 120;
        this.slaDeadline = LocalDateTime.now().plusMinutes(this.slaMinutes);
        this.status = "QUEUED";
        this.createdAt = LocalDateTime.now();
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }

    public String getTaskNumber() { return taskNumber; }
    public void setTaskNumber(String taskNumber) { this.taskNumber = taskNumber; }

    public Department getDepartment() { return department; }
    public void setDepartment(Department department) { this.department = department; }

    public String getTaskType() { return taskType; }
    public void setTaskType(String taskType) { this.taskType = taskType; }

    public String getPriority() { return priority; }
    public void setPriority(String priority) { this.priority = priority; }

    public String getStatus() { return status; }
    public void setStatus(String status) { this.status = status; }

    public String getEntityType() { return entityType; }
    public void setEntityType(String entityType) { this.entityType = entityType; }

    public String getEntityId() { return entityId; }
    public void setEntityId(String entityId) { this.entityId = entityId; }

    public BigDecimal getEntityAmount() { return entityAmount; }
    public void setEntityAmount(BigDecimal entityAmount) { this.entityAmount = entityAmount; }

    public String getCity() { return city; }
    public void setCity(String city) { this.city = city; }

    public User getAssignedTo() { return assignedTo; }
    public void setAssignedTo(User assignedTo) { this.assignedTo = assignedTo; }

    public User getMakerUser() { return makerUser; }
    public void setMakerUser(User makerUser) { this.makerUser = makerUser; }

    public User getCheckerUser() { return checkerUser; }
    public void setCheckerUser(User checkerUser) { this.checkerUser = checkerUser; }

    public boolean isRequiresFourEyesApproval() { return requiresFourEyesApproval; }
    public void setRequiresFourEyesApproval(boolean requiresFourEyesApproval) { this.requiresFourEyesApproval = requiresFourEyesApproval; }

    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }

    public String getMakerNotes() { return makerNotes; }
    public void setMakerNotes(String makerNotes) { this.makerNotes = makerNotes; }

    public String getCheckerNotes() { return checkerNotes; }
    public void setCheckerNotes(String checkerNotes) { this.checkerNotes = checkerNotes; }

    public String getResolutionNotes() { return resolutionNotes; }
    public void setResolutionNotes(String resolutionNotes) { this.resolutionNotes = resolutionNotes; }

    public Integer getSlaMinutes() { return slaMinutes; }
    public void setSlaMinutes(Integer slaMinutes) { this.slaMinutes = slaMinutes; }

    public LocalDateTime getSlaDeadline() { return slaDeadline; }
    public void setSlaDeadline(LocalDateTime slaDeadline) { this.slaDeadline = slaDeadline; }

    public boolean isEscalated() { return isEscalated; }
    public void setEscalated(boolean escalated) { isEscalated = escalated; }

    public String getEscalationReason() { return escalationReason; }
    public void setEscalationReason(String escalationReason) { this.escalationReason = escalationReason; }

    public LocalDateTime getCreatedAt() { return createdAt; }
    public void setCreatedAt(LocalDateTime createdAt) { this.createdAt = createdAt; }

    public LocalDateTime getStartedAt() { return startedAt; }
    public void setStartedAt(LocalDateTime startedAt) { this.startedAt = startedAt; }

    public LocalDateTime getCompletedAt() { return completedAt; }
    public void setCompletedAt(LocalDateTime completedAt) { this.completedAt = completedAt; }

    public Long getVersion() { return version; }
    public void setVersion(Long version) { this.version = version; }
}
