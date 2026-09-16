package com.WMS.BE.repository;

import com.WMS.BE.model.WaterUsageLog;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface WaterUsageLogRepository extends JpaRepository<WaterUsageLog, Long> {

    List<WaterUsageLog> findByHouseholdIdOrderByReadingDateDesc(Long householdId);

    Optional<WaterUsageLog> findTopByHouseholdIdOrderByReadingDateDesc(Long householdId);

    boolean existsByHouseholdIdAndReadingDate(Long householdId, LocalDate readingDate);
}
