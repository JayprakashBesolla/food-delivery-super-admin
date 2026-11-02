package com.swiggy.foodapp.repositories;

import com.swiggy.foodapp.entities.ComboItem;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface ComboItemRepository extends JpaRepository<ComboItem, Long> {
    List<ComboItem> findByMealCombo_Id(Long comboId);
}
