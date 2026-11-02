package com.swiggy.foodapp.dtos.admin;

import com.swiggy.foodapp.entities.AdminPermission;
import com.swiggy.foodapp.entities.Department;
import com.swiggy.foodapp.entities.PermissionScope;
import com.swiggy.foodapp.entities.Role;

import java.util.Map;
import java.util.Set;

public class AdminQueueDTOs {

    public static class TaskActionRequest {
        private String notes;
        public String getNotes() { return notes; }
        public void setNotes(String notes) { this.notes = notes; }
    }

    public static class CreateTaskRequest {
        private Department department;
        private String taskType;
        private String priority = "MEDIUM";
        private String entityType;
        private String entityId;
        private java.math.BigDecimal amount;
        private String city;
        private String description;
        private Integer slaMinutes = 120;
        private boolean requiresFourEyes = false;

        public Department getDepartment() { return department; }
        public void setDepartment(Department department) { this.department = department; }
        public String getTaskType() { return taskType; }
        public void setTaskType(String taskType) { this.taskType = taskType; }
        public String getPriority() { return priority; }
        public void setPriority(String priority) { this.priority = priority; }
        public String getEntityType() { return entityType; }
        public void setEntityType(String entityType) { this.entityType = entityType; }
        public String getEntityId() { return entityId; }
        public void setEntityId(String entityId) { this.entityId = entityId; }
        public java.math.BigDecimal getAmount() { return amount; }
        public void setAmount(java.math.BigDecimal amount) { this.amount = amount; }
        public String getCity() { return city; }
        public void setCity(String city) { this.city = city; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
        public Integer getSlaMinutes() { return slaMinutes; }
        public void setSlaMinutes(Integer slaMinutes) { this.slaMinutes = slaMinutes; }
        public boolean isRequiresFourEyes() { return requiresFourEyes; }
        public void setRequiresFourEyes(boolean requiresFourEyes) { this.requiresFourEyes = requiresFourEyes; }
    }

    public static class MakerReviewRequest {
        private String proposalNotes;
        public String getProposalNotes() { return proposalNotes; }
        public void setProposalNotes(String proposalNotes) { this.proposalNotes = proposalNotes; }
    }

    public static class CheckerApproveRequest {
        private String approvalNotes;
        public String getApprovalNotes() { return approvalNotes; }
        public void setApprovalNotes(String approvalNotes) { this.approvalNotes = approvalNotes; }
    }

    public static class DepartmentQueueSummaryDTO {
        private Department department;
        private long totalQueued;
        private long inProgress;
        private long waiting;
        private long makerReviewed;
        private long escalated;
        private long slaBreached;
        private Map<String, Long> tasksByType;

        public Department getDepartment() { return department; }
        public void setDepartment(Department department) { this.department = department; }
        public long getTotalQueued() { return totalQueued; }
        public void setTotalQueued(long totalQueued) { this.totalQueued = totalQueued; }
        public long getInProgress() { return inProgress; }
        public void setInProgress(long inProgress) { this.inProgress = inProgress; }
        public long getWaiting() { return waiting; }
        public void setWaiting(long waiting) { this.waiting = waiting; }
        public long getMakerReviewed() { return makerReviewed; }
        public void setMakerReviewed(long makerReviewed) { this.makerReviewed = makerReviewed; }
        public long getEscalated() { return escalated; }
        public void setEscalated(long escalated) { this.escalated = escalated; }
        public long getSlaBreached() { return slaBreached; }
        public void setSlaBreached(long slaBreached) { this.slaBreached = slaBreached; }
        public Map<String, Long> getTasksByType() { return tasksByType; }
        public void setTasksByType(Map<String, Long> tasksByType) { this.tasksByType = tasksByType; }
    }

    public static class CreateAdminUserRequest {
        private String name;
        private String email;
        private String phone;
        private String password;
        private Role role;
        private Department department;
        private Set<AdminPermission> permissions;
        private PermissionScope scopeType = PermissionScope.GLOBAL;
        private String scopeValue = "ALL";

        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
        public Department getDepartment() { return department; }
        public void setDepartment(Department department) { this.department = department; }
        public Set<AdminPermission> getPermissions() { return permissions; }
        public void setPermissions(Set<AdminPermission> permissions) { this.permissions = permissions; }
        public PermissionScope getScopeType() { return scopeType; }
        public void setScopeType(PermissionScope scopeType) { this.scopeType = scopeType; }
        public String getScopeValue() { return scopeValue; }
        public void setScopeValue(String scopeValue) { this.scopeValue = scopeValue; }
    }

    public static class AdminUserResponseDTO {
        private Long id;
        private String name;
        private String email;
        private String phone;
        private Role role;
        private Department department;
        private Set<AdminPermission> permissions;
        private PermissionScope scopeType;
        private String scopeValue;

        public Long getId() { return id; }
        public void setId(Long id) { this.id = id; }
        public String getName() { return name; }
        public void setName(String name) { this.name = name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPhone() { return phone; }
        public void setPhone(String phone) { this.phone = phone; }
        public Role getRole() { return role; }
        public void setRole(Role role) { this.role = role; }
        public Department getDepartment() { return department; }
        public void setDepartment(Department department) { this.department = department; }
        public Set<AdminPermission> getPermissions() { return permissions; }
        public void setPermissions(Set<AdminPermission> permissions) { this.permissions = permissions; }
        public PermissionScope getScopeType() { return scopeType; }
        public void setScopeType(PermissionScope scopeType) { this.scopeType = scopeType; }
        public String getScopeValue() { return scopeValue; }
        public void setScopeValue(String scopeValue) { this.scopeValue = scopeValue; }
    }
}
