package com.WMS.BE.repository;

import com.WMS.BE.model.TariffPlan;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface TariffPlanRepository extends JpaRepository<TariffPlan, Long> {

    List<TariffPlan> findByApartmentId(Long apartmentId);

    List<TariffPlan> findByApartmentIdAndIsActiveTrue(Long apartmentId);
}
