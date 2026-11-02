package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Long> {
    Optional<User> findByEmail(String email);
    Optional<User> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    long countByRole(com.swiggy.foodapp.entities.Role role);
    java.util.List<User> findByRole(com.swiggy.foodapp.entities.Role role);
    java.util.List<User> findByIsBlockedTrue();
    java.util.List<User> findByRoleAndIsBlockedFalse(com.swiggy.foodapp.entities.Role role);
    long countByIsBlockedTrue();
}
