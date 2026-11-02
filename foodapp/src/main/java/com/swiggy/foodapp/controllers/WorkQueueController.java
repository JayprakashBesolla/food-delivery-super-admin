package com.swiggy.foodapp.controllers;

import com.swiggy.foodapp.dtos.admin.AdminQueueDTOs.*;
import com.swiggy.foodapp.entities.*;
import com.swiggy.foodapp.repositories.UserRepository;
import com.swiggy.foodapp.services.AuditLogService;
import com.swiggy.foodapp.services.WorkQueueService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/work-queues")
public class WorkQueueController {

    @Autowired
    private WorkQueueService workQueueService;

    @Autowired
    private UserRepository userRepository;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private AuditLogService auditLogService;

    private User resolveUser(User user, Authentication auth) {
        if (user != null) return user;
        if (auth != null && auth.getName() != null) {
            return userRepository.findByEmail(auth.getName()).orElse(null);
        }
        throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "User authentication required");
    }

    private String getClientIp(HttpServletRequest req) {
        String xf = req.getHeader("X-Forwarded-For");
        return xf != null ? xf.split(",")[0] : req.getRemoteAddr();
    }

    // =========================================================================
    // 1. WORK QUEUES BY DEPARTMENT
    // =========================================================================
    @GetMapping("/{department}")
    public ResponseEntity<List<OperationalTask>> getDepartmentQueue(
            @PathVariable Department department,
            @RequestParam(required = false) String status,
            @AuthenticationPrincipal User user,
            Authentication auth) {
        User currentUser = resolveUser(user, auth);
        return ResponseEntity.ok(workQueueService.getDepartmentQueue(department, status, currentUser));
    }

    @GetMapping("/{department}/summary")
    public ResponseEntity<DepartmentQueueSummaryDTO> getDepartmentQueueSummary(
            @PathVariable Department department,
            @AuthenticationPrincipal User user,
            Authentication auth) {
        User currentUser = resolveUser(user, auth);
        return ResponseEntity.ok(workQueueService.getQueueSummary(department, currentUser));
    }

    // =========================================================================
    // 2. TASK CREATION
    // =========================================================================
    @PostMapping("/tasks")
    public ResponseEntity<OperationalTask> createTask(
            @RequestBody CreateTaskRequest req,
            @AuthenticationPrincipal User user,
            Authentication auth,
            HttpServletRequest servletReq) {
        User currentUser = resolveUser(user, auth);

        OperationalTask task = workQueueService.createTask(
                req.getDepartment(),
                req.getTaskType(),
                req.getPriority() != null ? req.getPriority() : "MEDIUM",
                req.getEntityType(),
                req.getEntityId(),
                req.getAmount(),
                req.getCity(),
                req.getDescription(),
                req.getSlaMinutes(),
                req.isRequiresFourEyes()
        );

        auditLogService.recordAction(currentUser.getEmail(), currentUser.getRole().name(), "CREATE_OPERATIONAL_TASK",
                "OPERATIONAL_TASK", task.getTaskNumber(), "Created task: " + task.getDescription(), getClientIp(servletReq));

        return ResponseEntity.status(HttpStatus.CREATED).body(task);
    }

    // =========================================================================
    // 3. CONCURRENCY-SAFE ATOMIC CLAIMING
    // =========================================================================
    @PostMapping("/{taskId}/claim")
    public ResponseEntity<OperationalTask> claimTask(
            @PathVariable Long taskId,
            @AuthenticationPrincipal User user,
            Authentication auth,
            HttpServletRequest servletReq) {
        User currentUser = resolveUser(user, auth);
        OperationalTask claimed = workQueueService.claimTask(taskId, currentUser, getClientIp(servletReq));
        return ResponseEntity.ok(claimed);
    }

    // =========================================================================
    // 4. TASK COMPLETION (NORMAL TASKS)
    // =========================================================================
    @PostMapping("/{taskId}/complete")
    public ResponseEntity<OperationalTask> completeTask(
            @PathVariable Long taskId,
            @RequestBody(required = false) TaskActionRequest req,
            @AuthenticationPrincipal User user,
            Authentication auth,
            HttpServletRequest servletReq) {
        User currentUser = resolveUser(user, auth);
        OperationalTask completed = workQueueService.completeTask(taskId, req, currentUser, getClientIp(servletReq));
        return ResponseEntity.ok(completed);
    }

    // =========================================================================
    // 5. MAKER REVIEW (FOUR-EYES STEP 1)
    // =========================================================================
    @PostMapping("/{taskId}/maker-review")
    public ResponseEntity<OperationalTask> submitMakerReview(
            @PathVariable Long taskId,
            @RequestBody MakerReviewRequest req,
            @AuthenticationPrincipal User user,
            Authentication auth,
            HttpServletRequest servletReq) {
        User currentUser = resolveUser(user, auth);
        OperationalTask updated = workQueueService.submitMakerReview(taskId, req, currentUser, getClientIp(servletReq));
        return ResponseEntity.ok(updated);
    }

    // =========================================================================
    // 6. CHECKER APPROVAL (FOUR-EYES STEP 2: MAKER != CHECKER)
    // =========================================================================
    @PostMapping("/{taskId}/checker-approve")
    public ResponseEntity<OperationalTask> approveChecker(
            @PathVariable Long taskId,
            @RequestBody CheckerApproveRequest req,
            @AuthenticationPrincipal User user,
            Authentication auth,
            HttpServletRequest servletReq) {
        User currentUser = resolveUser(user, auth);
        OperationalTask approved = workQueueService.approveChecker(taskId, req, currentUser, getClientIp(servletReq));
        return ResponseEntity.ok(approved);
    }

    // =========================================================================
    // 7. CURRENT EMPLOYEE'S CLAIMED TASKS
    // =========================================================================
    @GetMapping({"/my-tasks", "/tasks/claimed"})
    public ResponseEntity<List<OperationalTask>> getMyClaimedTasks(
            @AuthenticationPrincipal User user,
            Authentication auth) {
        User currentUser = resolveUser(user, auth);
        return ResponseEntity.ok(workQueueService.getMyClaimedTasks(currentUser));
    }

    // =========================================================================
    // 8. SLA MONITORING & AUTO-ESCALATION
    // =========================================================================
    @GetMapping("/sla-breached")
    public ResponseEntity<List<OperationalTask>> getSlaBreachedTasks(
            @AuthenticationPrincipal User user,
            Authentication auth) {
        User currentUser = resolveUser(user, auth);
        return ResponseEntity.ok(workQueueService.getSlaBreachedTasks(currentUser));
    }

    @PostMapping("/escalate-overdue")
    public ResponseEntity<Map<String, Object>> triggerSlaEscalation() {
        List<OperationalTask> escalated = workQueueService.escalateOverdueTasks();
        return ResponseEntity.ok(Map.of(
                "message", "SLA auto-escalation evaluation executed",
                "escalatedCount", escalated.size(),
                "escalatedTasks", escalated
        ));
    }

    // =========================================================================
    // 9. DEPARTMENTAL STAFF DIRECTORY & RBAC ONBOARDING
    // =========================================================================
    @GetMapping("/staff")
    public ResponseEntity<List<AdminUserResponseDTO>> listStaff() {
        List<AdminUserResponseDTO> staff = userRepository.findAll().stream()
                .filter(u -> u.getDepartment() != null || u.getRole() == Role.SUPER_ADMIN)
                .map(this::mapToAdminUserResponse)
                .toList();
        return ResponseEntity.ok(staff);
    }

    @PostMapping("/staff")
    @PreAuthorize("hasRole('SUPER_ADMIN')")
    public ResponseEntity<AdminUserResponseDTO> createStaff(
            @RequestBody CreateAdminUserRequest req,
            @AuthenticationPrincipal User user,
            Authentication auth,
            HttpServletRequest servletReq) {
        User currentUser = resolveUser(user, auth);

        if (userRepository.findByEmail(req.getEmail()).isPresent()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Email already in use: " + req.getEmail());
        }

        User staff = new User(
                req.getName(),
                req.getEmail(),
                req.getPhone(),
                passwordEncoder.encode(req.getPassword() != null ? req.getPassword() : "Password123!"),
                req.getRole()
        );
        staff.setDepartment(req.getDepartment());
        staff.setPermissions(req.getPermissions());
        staff.setScopeType(req.getScopeType() != null ? req.getScopeType() : PermissionScope.GLOBAL);
        staff.setScopeValue(req.getScopeValue() != null ? req.getScopeValue() : "ALL");

        User saved = userRepository.save(staff);

        auditLogService.recordAction(currentUser.getEmail(), currentUser.getRole().name(), "CREATE_DEPARTMENT_STAFF",
                "USER", String.valueOf(saved.getId()), "Created staff member " + saved.getEmail() + " with role " + saved.getRole(), getClientIp(servletReq));

        return ResponseEntity.status(HttpStatus.CREATED).body(mapToAdminUserResponse(saved));
    }

    private AdminUserResponseDTO mapToAdminUserResponse(User u) {
        AdminUserResponseDTO dto = new AdminUserResponseDTO();
        dto.setId(u.getId());
        dto.setName(u.getName());
        dto.setEmail(u.getEmail());
        dto.setPhone(u.getPhone());
        dto.setRole(u.getRole());
        dto.setDepartment(u.getDepartment());
        dto.setPermissions(u.getPermissions());
        dto.setScopeType(u.getScopeType());
        dto.setScopeValue(u.getScopeValue());
        return dto;
    }
}
