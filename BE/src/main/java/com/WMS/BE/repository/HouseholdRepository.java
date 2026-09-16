package com.WMS.BE.repository;

import com.WMS.BE.model.Household;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface HouseholdRepository extends JpaRepository<Household, Long> {

    List<Household> findByApartmentId(Long apartmentId);

    Optional<Household> findByUnitNumberAndApartmentId(String unitNumber, Long apartmentId);

    Optional<Household> findByMeterSerialNumber(String meterSerialNumber);
}
