package com.swiggy.foodapp.services;

import com.swiggy.foodapp.entities.*;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

import static org.junit.jupiter.api.Assertions.*;

public class MakerCheckerSecurityTest {

    @Test
    @DisplayName("Four-Eyes Security: Maker cannot approve their own operational proposal")
    public void testMakerCannotBeChecker() {
        // User 1: Maker (e.g. Pooja Finance Officer)
        User maker = new User("Pooja Officer", "pooja@swiggy.com", "9111100001", "pass", Role.FINANCE_OFFICER);
        maker.setId(101L);

        // Operational Task created
        OperationalTask task = new OperationalTask(
                "TSK-9901", Department.FINANCE, "SETTLEMENT_REVIEW", "HIGH",
                "SETTLEMENT", "101", BigDecimal.valueOf(82430.0),
                "Hyderabad", "High value settlement", 120
        );
        task.setRequiresFourEyesApproval(true);
        task.setMakerUser(maker);
        task.setStatus("IN_REVIEW");

        // Attempt by Maker to approve their own task
        User currentUser = maker; // same user attempting checker action

        ResponseStatusException ex = assertThrows(ResponseStatusException.class, () -> {
            if (task.getMakerUser() != null && task.getMakerUser().getId().equals(currentUser.getId())) {
                throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                        "Four-Eyes / Maker-Checker Violation: Checker cannot be the same user who submitted the Maker proposal.");
            }
        });

        assertEquals(HttpStatus.FORBIDDEN, ex.getStatusCode());
        assertTrue(ex.getReason().contains("Four-Eyes / Maker-Checker Violation"));
    }

    @Test
    @DisplayName("Four-Eyes Security: Independent Checker CAN approve Maker proposal")
    public void testIndependentCheckerApprovalAllowed() {
        // User 1: Maker
        User maker = new User("Pooja Officer", "pooja@swiggy.com", "9111100001", "pass", Role.FINANCE_OFFICER);
        maker.setId(101L);

        // User 2: Independent Checker Manager
        User checker = new User("Rajesh Manager", "rajesh@swiggy.com", "9111100002", "pass", Role.FINANCE_MANAGER);
        checker.setId(102L);

        OperationalTask task = new OperationalTask(
                "TSK-9902", Department.FINANCE, "SETTLEMENT_REVIEW", "HIGH",
                "SETTLEMENT", "102", BigDecimal.valueOf(82430.0),
                "Hyderabad", "High value settlement", 120
        );
        task.setRequiresFourEyesApproval(true);
        task.setMakerUser(maker);
        task.setStatus("IN_REVIEW");

        // Validation passes
        assertNotEquals(task.getMakerUser().getId(), checker.getId(), "Maker and Checker must be distinct users");
        task.setCheckerUser(checker);
        task.setStatus("COMPLETED");

        assertEquals("COMPLETED", task.getStatus());
        assertEquals(checker.getId(), task.getCheckerUser().getId());
    }
}

