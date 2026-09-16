package com.WMS.BE.controller;

import com.WMS.BE.dto.ApiResponse;
import com.WMS.BE.dto.ApartmentRequest;
import com.WMS.BE.dto.ApartmentResponse;
import com.WMS.BE.service.ApartmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/apartments")
@RequiredArgsConstructor
public class ApartmentController {

    private final ApartmentService apartmentService;

    @PostMapping
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<ApartmentResponse>> createApartment(@Valid @RequestBody ApartmentRequest request) {
        ApartmentResponse response = apartmentService.createApartment(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Apartment onboarded successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ApartmentResponse>>> getAllApartments() {
        List<ApartmentResponse> list = apartmentService.getAllApartments();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ApartmentResponse>> getApartmentById(@PathVariable Long id) {
        ApartmentResponse response = apartmentService.getApartmentById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<ApartmentResponse>> updateApartment(
            @PathVariable Long id,
            @Valid @RequestBody ApartmentRequest request
    ) {
        ApartmentResponse response = apartmentService.updateApartment(id, request);
        return ResponseEntity.ok(ApiResponse.success("Apartment updated successfully", response));
    }
}
