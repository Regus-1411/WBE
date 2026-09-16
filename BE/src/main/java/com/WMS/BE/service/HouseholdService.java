package com.WMS.BE.service;

import com.WMS.BE.dto.HouseholdRequest;
import com.WMS.BE.dto.HouseholdResponse;
import com.WMS.BE.dto.MeterConfigRequest;
import com.WMS.BE.model.Apartment;
import com.WMS.BE.model.Household;
import com.WMS.BE.model.User;
import com.WMS.BE.repository.ApartmentRepository;
import com.WMS.BE.repository.HouseholdRepository;
import com.WMS.BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class HouseholdService {

    private final HouseholdRepository householdRepository;
    private final ApartmentRepository apartmentRepository;
    private final UserRepository userRepository;

    @Transactional
    public HouseholdResponse createHousehold(HouseholdRequest request) {
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found with ID: " + request.getApartmentId()));

        householdRepository.findByUnitNumberAndApartmentId(request.getUnitNumber(), request.getApartmentId())
                .ifPresent(h -> {
                    throw new IllegalArgumentException("Unit " + request.getUnitNumber() + " already exists in this apartment.");
                });

        if (request.getMeterSerialNumber() != null && !request.getMeterSerialNumber().isBlank()) {
            householdRepository.findByMeterSerialNumber(request.getMeterSerialNumber())
                    .ifPresent(h -> {
                        throw new IllegalArgumentException("Meter serial number " + request.getMeterSerialNumber() + " is already assigned to another household.");
                    });
        }

        Household household = new Household();
        household.setUnitNumber(request.getUnitNumber());
        household.setFloor(request.getFloor());
        household.setBlock(request.getBlock());
        household.setApartment(apartment);
        household.setMeterSerialNumber(request.getMeterSerialNumber());
        household.setMeterInstalledDate(request.getMeterInstalledDate());
        household.setIsActive(true);

        Household saved = householdRepository.save(household);
        return mapToResponse(saved);
    }

    public List<HouseholdResponse> getHouseholdsByApartment(Long apartmentId) {
        return householdRepository.findByApartmentId(apartmentId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public HouseholdResponse getHouseholdById(Long id) {
        Household household = householdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Household not found with ID: " + id));
        return mapToResponse(household);
    }

    @Transactional
    public HouseholdResponse updateHousehold(Long id, HouseholdRequest request) {
        Household household = householdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Household not found with ID: " + id));

        if (!household.getUnitNumber().equalsIgnoreCase(request.getUnitNumber())) {
            householdRepository.findByUnitNumberAndApartmentId(request.getUnitNumber(), household.getApartment().getId())
                    .ifPresent(h -> {
                        throw new IllegalArgumentException("Unit " + request.getUnitNumber() + " already exists in this apartment.");
                    });
            household.setUnitNumber(request.getUnitNumber());
        }

        household.setFloor(request.getFloor());
        household.setBlock(request.getBlock());

        if (request.getMeterSerialNumber() != null && !request.getMeterSerialNumber().isBlank()) {
            if (!request.getMeterSerialNumber().equalsIgnoreCase(household.getMeterSerialNumber())) {
                householdRepository.findByMeterSerialNumber(request.getMeterSerialNumber())
                        .ifPresent(h -> {
                            throw new IllegalArgumentException("Meter serial number is already assigned elsewhere.");
                        });
                household.setMeterSerialNumber(request.getMeterSerialNumber());
            }
        }

        if (request.getMeterInstalledDate() != null) {
            household.setMeterInstalledDate(request.getMeterInstalledDate());
        }

        Household updated = householdRepository.save(household);
        return mapToResponse(updated);
    }

    @Transactional
    public HouseholdResponse configureMeter(Long id, MeterConfigRequest request) {
        Household household = householdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Household not found with ID: " + id));

        householdRepository.findByMeterSerialNumber(request.getMeterSerialNumber())
                .ifPresent(existing -> {
                    if (!existing.getId().equals(id)) {
                        throw new IllegalArgumentException("Meter serial number " + request.getMeterSerialNumber() + " is already assigned to household " + existing.getUnitNumber());
                    }
                });

        household.setMeterSerialNumber(request.getMeterSerialNumber());
        household.setMeterInstalledDate(request.getMeterInstalledDate());

        Household updated = householdRepository.save(household);
        return mapToResponse(updated);
    }

    @Transactional
    public HouseholdResponse assignResident(Long householdId, Long userId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new IllegalArgumentException("Household not found with ID: " + householdId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setHousehold(household);
        user.setApartment(household.getApartment());
        userRepository.save(user);

        return mapToResponse(household);
    }

    @Transactional
    public HouseholdResponse removeResident(Long householdId, Long userId) {
        Household household = householdRepository.findById(householdId)
                .orElseThrow(() -> new IllegalArgumentException("Household not found with ID: " + householdId));

        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        if (user.getHousehold() != null && user.getHousehold().getId().equals(householdId)) {
            user.setHousehold(null);
            userRepository.save(user);
        }

        return mapToResponse(household);
    }

    @Transactional
    public void deleteHousehold(Long id) {
        Household household = householdRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Household not found with ID: " + id));

        if (household.getResidents() != null) {
            for (User resident : household.getResidents()) {
                resident.setHousehold(null);
                userRepository.save(resident);
            }
        }

        householdRepository.delete(household);
    }

    private HouseholdResponse mapToResponse(Household h) {
        List<HouseholdResponse.ResidentSummaryDto> residentDtos = h.getResidents() != null
                ? h.getResidents().stream()
                    .map(r -> HouseholdResponse.ResidentSummaryDto.builder()
                            .id(r.getId())
                            .username(r.getUsername())
                            .fullName(r.getFullName())
                            .email(r.getEmail())
                            .phone(r.getPhone())
                            .build())
                    .collect(Collectors.toList())
                : List.of();

        return HouseholdResponse.builder()
                .id(h.getId())
                .unitNumber(h.getUnitNumber())
                .floor(h.getFloor())
                .block(h.getBlock())
                .apartmentId(h.getApartment() != null ? h.getApartment().getId() : null)
                .apartmentName(h.getApartment() != null ? h.getApartment().getName() : null)
                .meterSerialNumber(h.getMeterSerialNumber())
                .meterInstalledDate(h.getMeterInstalledDate())
                .isActive(h.getIsActive())
                .residentCount(residentDtos.size())
                .residents(residentDtos)
                .createdAt(h.getCreatedAt())
                .build();
    }
}
