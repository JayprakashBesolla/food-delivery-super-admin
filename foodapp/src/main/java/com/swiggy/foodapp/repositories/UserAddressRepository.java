package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.UserAddress;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UserAddressRepository extends JpaRepository<UserAddress, Long> {
    List<UserAddress> findByUser_Id(Long userId);
    Optional<UserAddress> findByUser_IdAndIsDefaultTrue(Long userId);
}
