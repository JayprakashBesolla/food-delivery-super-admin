package com.swiggy.foodapp.services;

import com.swiggy.foodapp.dtos.admin.AdminQueueDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class WorkQueueService {

    private static final Logger logger = LoggerFactory.getLogger(WorkQueueService.class);

    @Autowired
    private OperationalTaskRepository taskRepository;

    @Autowired
    private AuthorizationScopeService scopeService;

    @Autowired
    private AuditLogService auditLogService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private SettlementRepository settlementRepository;

    @Autowired
    private RestaurantRepository restaurantRepository;

    @Autowired
    private StripePaymentService stripePaymentService;

    // --- 1. Task Creation & Workload Balancing ---
    @Transactional
    public OperationalTask createTask(Department department, String taskType, String priority,
                                      String entityType, String entityId, BigDecimal amount,
                                      String city, String description, Integer slaMinutes,
                                      boolean requiresFourEyes) {
        String taskNumber = "TSK-" + (System.currentTimeMillis() % 1000000);
        OperationalTask task = new OperationalTask(
                taskNumber, department, taskType, priority,
                entityType, entityId, amount, city, description, slaMinutes
        );
        task.setRequiresFourEyesApproval(requiresFourEyes);

        // Auto-assign least busy employee if available
        User leastBusy = findLeastBusyEmployee(department, city);
        if (leastBusy != null) {
            task.setAssignedTo(leastBusy);
            task.setStatus("ASSIGNED");
        }

        return taskRepository.save(task);
    }

    public User findLeastBusyEmployee(Department department, String city) {
        List<User> employees = userRepository.findAll().stream()
                .filter(u -> u.getDepartment() == department && !u.isBlocked())
                .filter(u -> scopeService.isInScope(u, city, null, null))
                .toList();

        if (employees.isEmpty()) return null;

        User bestCandidate = null;
        long minTaskCount = Long.MAX_VALUE;

        for (User u : employees) {
            long count = taskRepository.countByAssignedTo_IdAndStatusIn(u.getId(), List.of("ASSIGNED", "IN_PROGRESS"));
            if (count < minTaskCount) {
                minTaskCount = count;
                bestCandidate = u;
            }
        }
        return bestCandidate;
    }

    // --- 2. Concurrency-Safe Atomic Claiming ---
    @Transactional
    public OperationalTask claimTask(Long taskId, User currentUser, String ip) {
        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + taskId));

        // 1. Role & Scope Check
        if (!scopeService.canAccessTask(currentUser, task)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Access denied: This task is outside your department or assigned geographical scope.");
        }

        // 2. Concurrency-safe atomic DB update
        int rowsUpdated = taskRepository.claimTaskAtomically(taskId, currentUser, LocalDateTime.now());
        if (rowsUpdated == 0) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "Task collision: This task has already been claimed or is in progress by another team member.");
        }

        OperationalTask updated = taskRepository.findById(taskId).get();
        auditLogService.recordAction(currentUser.getEmail(), currentUser.getRole().name(), "CLAIM_TASK",
                "OPERATIONAL_TASK", updated.getTaskNumber(), "Claimed task " + updated.getTaskNumber(), ip);

        return updated;
    }

    // --- 3. Maker Review (Four-Eyes Step 1) ---
    @Transactional
    public OperationalTask submitMakerReview(Long taskId, MakerReviewRequest req, User currentUser, String ip) {
        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + taskId));

        if (!scopeService.hasPermission(currentUser, AdminPermission.REVIEW_SETTLEMENTS)
                && !scopeService.hasPermission(currentUser, AdminPermission.PROPOSE_COMMISSION_CHANGE)
                && !scopeService.hasPermission(currentUser, AdminPermission.ALL_PERMISSIONS)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions to submit Maker Review.");
        }

        task.setMakerUser(currentUser);
        task.setMakerNotes(req.getProposalNotes());
        task.setStatus("MAKER_REVIEWED");
        OperationalTask saved = taskRepository.save(task);

        auditLogService.recordAction(currentUser.getEmail(), currentUser.getRole().name(), "MAKER_REVIEW_SUBMITTED",
                "OPERATIONAL_TASK", task.getTaskNumber(), "Submitted Maker Review for task: " + req.getProposalNotes(), ip);

        return saved;
    }

    // --- 4. Checker Approval (Four-Eyes Step 2: Maker != Checker) ---
    @Transactional
    public OperationalTask approveChecker(Long taskId, CheckerApproveRequest req, User currentUser, String ip) {
        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + taskId));

        // 1. Four-Eyes Rule: Checker CANNOT be the Maker!
        if (task.getMakerUser() != null && task.getMakerUser().getId().equals(currentUser.getId())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "Four-Eyes / Maker-Checker Violation: Checker cannot be the same user who submitted the Maker proposal.");
        }

        // 2. Permission Check
        if (!scopeService.hasPermission(currentUser, AdminPermission.APPROVE_SETTLEMENTS)
                && !scopeService.hasPermission(currentUser, AdminPermission.APPROVE_COMMISSION_CHANGE)
                && !scopeService.hasPermission(currentUser, AdminPermission.ALL_PERMISSIONS)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "Insufficient permissions to approve as Checker.");
        }

        task.setCheckerUser(currentUser);
        task.setCheckerNotes(req.getApprovalNotes());
        task.setStatus("COMPLETED");
        task.setCompletedAt(LocalDateTime.now());

        // Downstream Action Execution
        if ("SETTLEMENT_REVIEW".equalsIgnoreCase(task.getTaskType()) && task.getEntityId() != null) {
            try {
                Long settlementId = Long.parseLong(task.getEntityId());
                settlementRepository.findById(settlementId).ifPresent(s -> {
                    s.setCheckerManagerEmail(currentUser.getEmail());
                    s.setMakerEmployeeEmail(task.getMakerUser() != null ? task.getMakerUser().getEmail() : "officer@swiggy.com");
                    s.setStatus("PAID");
                    s.setPaidAt(LocalDateTime.now());

                    if ("STRIPE".equalsIgnoreCase(s.getPayoutProvider()) && s.getRestaurant() != null) {
                        String acctId = s.getRestaurant().getStripeAccountId() != null ? s.getRestaurant().getStripeAccountId() : "acct_sim_merchant";
                        Map<String, Object> payoutRes = stripePaymentService.transferPayout(acctId, s.getNetPayoutAmount(), "INR", "Maker-Checker approved settlement");
                        s.setStripeTransferId((String) payoutRes.get("transferId"));
                        s.setUtrNumber((String) payoutRes.get("transferId"));
                    }
                    settlementRepository.save(s);
                });
            } catch (Exception e) {
                logger.warn("Could not auto-process settlement downstream action: {}", e.getMessage());
            }
        } else if ("COMMISSION_CHANGE_APPROVAL".equalsIgnoreCase(task.getTaskType()) && task.getEntityId() != null) {
            try {
                Long restId = Long.parseLong(task.getEntityId());
                restaurantRepository.findById(restId).ifPresent(r -> {
                    if (r.getPendingCommissionRate() != null) {
                        r.setCommissionRate(r.getPendingCommissionRate());
                        r.setPendingCommissionRate(null);
                        r.setCommissionProposedBy(null);
                        restaurantRepository.save(r);
                    }
                });
            } catch (Exception e) {
                logger.warn("Could not auto-process commission downstream action: {}", e.getMessage());
            }
        }

        OperationalTask saved = taskRepository.save(task);

        auditLogService.recordAction(currentUser.getEmail(), currentUser.getRole().name(), "CHECKER_APPROVAL_EXECUTED",
                "OPERATIONAL_TASK", task.getTaskNumber(), "Checker approved task " + task.getTaskNumber() + ": " + req.getApprovalNotes(), ip);

        return saved;
    }

    // --- 5. Complete Normal Task ---
    @Transactional
    public OperationalTask completeTask(Long taskId, TaskActionRequest req, User currentUser, String ip) {
        OperationalTask task = taskRepository.findById(taskId)
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Task not found: " + taskId));

        // Enforce task ownership unless super admin
        if (currentUser.getRole() != Role.SUPER_ADMIN && (task.getAssignedTo() == null || !task.getAssignedTo().getId().equals(currentUser.getId()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "You can only complete tasks assigned to you.");
        }

        if (task.isRequiresFourEyesApproval() && !"MAKER_REVIEWED".equalsIgnoreCase(task.getStatus())) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "This high-value task requires Maker Review followed by Manager Checker approval.");
        }

        task.setStatus("COMPLETED");
        task.setCompletedAt(LocalDateTime.now());
        task.setResolutionNotes(req != null ? req.getNotes() : "Completed by " + currentUser.getEmail());
        OperationalTask saved = taskRepository.save(task);

        auditLogService.recordAction(currentUser.getEmail(), currentUser.getRole().name(), "COMPLETE_TASK",
                "OPERATIONAL_TASK", task.getTaskNumber(), "Completed task " + task.getTaskNumber(), ip);

        return saved;
    }

    // --- 6. SLA Auto-Escalation Engine ---
    @Transactional
    public List<OperationalTask> escalateOverdueTasks() {
        LocalDateTime now = LocalDateTime.now();
        List<OperationalTask> overdue = taskRepository.findByStatusNotInAndSlaDeadlineBefore(
                List.of("COMPLETED", "REJECTED", "ESCALATED"), now
        );

        for (OperationalTask t : overdue) {
            t.setEscalated(true);
            t.setStatus("ESCALATED");
            t.setPriority("URGENT");
            t.setEscalationReason("SLA breached! Exceeded " + t.getSlaMinutes() + " mins deadline at " + t.getSlaDeadline());

            // Re-assign to Department Manager
            User manager = userRepository.findAll().stream()
                    .filter(u -> u.getDepartment() == t.getDepartment())
                    .filter(u -> u.getRole().name().endsWith("_MANAGER") || u.getRole() == Role.SUPER_ADMIN)
                    .findFirst().orElse(null);
            if (manager != null) {
                t.setAssignedTo(manager);
            }
            taskRepository.save(t);

            auditLogService.recordAction("SYSTEM_SLA_ENGINE", "SYSTEM", "AUTO_ESCALATE_TASK",
                    "OPERATIONAL_TASK", t.getTaskNumber(), "Escalated task " + t.getTaskNumber() + " due to SLA breach", "127.0.0.1");
        }

        return overdue;
    }

    // --- 7. Queue Query & Summaries ---
    public List<OperationalTask> getDepartmentQueue(Department department, String status, User currentUser) {
        List<OperationalTask> tasks = (status != null && !status.trim().isEmpty())
                ? taskRepository.findByDepartmentAndStatusOrderByCreatedAtDesc(department, status.toUpperCase())
                : taskRepository.findByDepartmentOrderByCreatedAtDesc(department);

        // Filter by user's assigned scope
        return tasks.stream()
                .filter(t -> scopeService.canAccessTask(currentUser, t))
                .toList();
    }

    public List<OperationalTask> getMyClaimedTasks(User currentUser) {
        return taskRepository.findByAssignedTo_IdAndStatusOrderByCreatedAtDesc(currentUser.getId(), "IN_PROGRESS");
    }

    public List<OperationalTask> getSlaBreachedTasks(User currentUser) {
        return taskRepository.findByStatusNotInAndSlaDeadlineBefore(
                List.of("COMPLETED", "REJECTED"), LocalDateTime.now()
        ).stream().filter(t -> scopeService.canAccessTask(currentUser, t)).toList();
    }

    public DepartmentQueueSummaryDTO getQueueSummary(Department department, User currentUser) {
        DepartmentQueueSummaryDTO dto = new DepartmentQueueSummaryDTO();
        dto.setDepartment(department);

        List<OperationalTask> deptTasks = taskRepository.findByDepartmentOrderByCreatedAtDesc(department).stream()
                .filter(t -> scopeService.canAccessTask(currentUser, t))
                .toList();

        long queued = 0;
        long inProgress = 0;
        long waiting = 0;
        long makerReviewed = 0;
        long escalated = 0;
        long slaBreached = 0;
        Map<String, Long> byType = new HashMap<>();
        LocalDateTime now = LocalDateTime.now();

        for (OperationalTask t : deptTasks) {
            String s = t.getStatus();
            if ("QUEUED".equalsIgnoreCase(s) || "NEW".equalsIgnoreCase(s)) queued++;
            else if ("IN_PROGRESS".equalsIgnoreCase(s) || "ASSIGNED".equalsIgnoreCase(s)) inProgress++;
            else if ("WAITING".equalsIgnoreCase(s)) waiting++;
            else if ("MAKER_REVIEWED".equalsIgnoreCase(s)) makerReviewed++;
            else if ("ESCALATED".equalsIgnoreCase(s)) escalated++;

            if (!"COMPLETED".equalsIgnoreCase(s) && !"REJECTED".equalsIgnoreCase(s)
                    && t.getSlaDeadline() != null && t.getSlaDeadline().isBefore(now)) {
                slaBreached++;
            }

            byType.put(t.getTaskType(), byType.getOrDefault(t.getTaskType(), 0L) + 1);
        }

        dto.setTotalQueued(queued);
        dto.setInProgress(inProgress);
        dto.setWaiting(waiting);
        dto.setMakerReviewed(makerReviewed);
        dto.setEscalated(escalated);
        dto.setSlaBreached(slaBreached);
        dto.setTasksByType(byType);

        return dto;
    }
}
