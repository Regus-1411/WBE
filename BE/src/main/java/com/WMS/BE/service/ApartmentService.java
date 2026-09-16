package com.WMS.BE.service;

import com.WMS.BE.dto.ApartmentRequest;
import com.WMS.BE.dto.ApartmentResponse;
import com.WMS.BE.model.Apartment;
import com.WMS.BE.repository.ApartmentRepository;
import com.WMS.BE.repository.HouseholdRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ApartmentService {

    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;

    @Transactional
    public ApartmentResponse createApartment(ApartmentRequest request) {
        Apartment apartment = new Apartment();
        apartment.setName(request.getName());
        apartment.setAddress(request.getAddress());
        apartment.setCity(request.getCity());
        apartment.setState(request.getState());
        apartment.setPincode(request.getEffectivePincode());
        apartment.setTotalUnits(request.getTotalUnits() != null ? request.getTotalUnits() : 0);

        Apartment saved = apartmentRepository.save(apartment);
        return mapToResponse(saved);
    }

    public List<ApartmentResponse> getAllApartments() {
        return apartmentRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public ApartmentResponse getApartmentById(Long id) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found with ID: " + id));
        return mapToResponse(apartment);
    }

    @Transactional
    public ApartmentResponse updateApartment(Long id, ApartmentRequest request) {
        Apartment apartment = apartmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found with ID: " + id));

        apartment.setName(request.getName());
        apartment.setAddress(request.getAddress());
        apartment.setCity(request.getCity());
        apartment.setState(request.getState());
        if (request.getEffectivePincode() != null) {
            apartment.setPincode(request.getEffectivePincode());
        }
        if (request.getTotalUnits() != null) {
            apartment.setTotalUnits(request.getTotalUnits());
        }

        Apartment updated = apartmentRepository.save(apartment);
        return mapToResponse(updated);
    }

    private ApartmentResponse mapToResponse(Apartment apartment) {
        long count = householdRepository.findByApartmentId(apartment.getId()).size();
        return ApartmentResponse.builder()
                .id(apartment.getId())
                .name(apartment.getName())
                .address(apartment.getAddress())
                .city(apartment.getCity())
                .state(apartment.getState())
                .pincode(apartment.getPincode())
                .postalCode(apartment.getPincode())
                .totalUnits(apartment.getTotalUnits())
                .activeHouseholdsCount(count)
                .createdAt(apartment.getCreatedAt())
                .build();
    }
}
