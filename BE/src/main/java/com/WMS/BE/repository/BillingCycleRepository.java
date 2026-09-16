package com.WMS.BE.repository;

import com.WMS.BE.model.BillingCycle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface BillingCycleRepository extends JpaRepository<BillingCycle, Long> {

    List<BillingCycle> findByApartmentId(Long apartmentId);

    List<BillingCycle> findByApartmentIdAndStatus(Long apartmentId, BillingCycle.Status status);
}
