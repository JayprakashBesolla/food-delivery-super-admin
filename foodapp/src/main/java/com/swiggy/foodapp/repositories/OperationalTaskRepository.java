package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.Department;
import com.swiggy.foodapp.entities.OperationalTask;
import com.swiggy.foodapp.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface OperationalTaskRepository extends JpaRepository<OperationalTask, Long> {

    Optional<OperationalTask> findByTaskNumber(String taskNumber);

    List<OperationalTask> findByDepartmentOrderByCreatedAtDesc(Department department);

    List<OperationalTask> findByDepartmentAndStatusOrderByCreatedAtDesc(Department department, String status);

    List<OperationalTask> findByAssignedTo_IdAndStatusOrderByCreatedAtDesc(Long userId, String status);

    List<OperationalTask> findByAssignedTo_IdOrderByCreatedAtDesc(Long userId);

    List<OperationalTask> findByStatusNotInAndSlaDeadlineBefore(List<String> finishedStatuses, LocalDateTime now);

    List<OperationalTask> findByDepartmentAndStatusIn(Department department, List<String> statuses);

    List<OperationalTask> findByRequiresFourEyesApprovalTrueAndStatusOrderByCreatedAtDesc(String status);

    long countByDepartmentAndStatus(Department department, String status);

    long countByAssignedTo_IdAndStatusIn(Long userId, List<String> activeStatuses);

    // Concurrency-safe atomic claim query
    @Modifying
    @Query("UPDATE OperationalTask t SET t.assignedTo = :user, t.status = 'IN_PROGRESS', t.startedAt = :now, t.version = t.version + 1 " +
           "WHERE t.id = :taskId AND (t.status = 'QUEUED' OR t.status = 'NEW') AND t.assignedTo IS NULL")
    int claimTaskAtomically(@Param("taskId") Long taskId, @Param("user") User user, @Param("now") LocalDateTime now);
}
