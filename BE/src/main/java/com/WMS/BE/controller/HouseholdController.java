package com.WMS.BE.controller;

import com.WMS.BE.dto.*;
import com.WMS.BE.service.HouseholdService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/households")
@RequiredArgsConstructor
public class HouseholdController {

    private final HouseholdService householdService;

    @PostMapping
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<HouseholdResponse>> createHousehold(@Valid @RequestBody HouseholdRequest request) {
        HouseholdResponse response = householdService.createHousehold(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Household registered successfully", response));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<HouseholdResponse>>> getHouseholdsByApartment(@RequestParam Long apartmentId) {
        List<HouseholdResponse> list = householdService.getHouseholdsByApartment(apartmentId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<HouseholdResponse>> getHouseholdById(@PathVariable Long id) {
        HouseholdResponse response = householdService.getHouseholdById(id);
        return ResponseEntity.ok(ApiResponse.success(response));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<HouseholdResponse>> updateHousehold(
            @PathVariable Long id,
            @Valid @RequestBody HouseholdRequest request
    ) {
        HouseholdResponse response = householdService.updateHousehold(id, request);
        return ResponseEntity.ok(ApiResponse.success("Household updated successfully", response));
    }

    @PutMapping("/{id}/meter")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<HouseholdResponse>> configureMeter(
            @PathVariable Long id,
            @Valid @RequestBody MeterConfigRequest request
    ) {
        HouseholdResponse response = householdService.configureMeter(id, request);
        return ResponseEntity.ok(ApiResponse.success("Meter configured successfully", response));
    }

    @PostMapping("/{id}/residents")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<HouseholdResponse>> assignResident(
            @PathVariable Long id,
            @Valid @RequestBody AssignResidentRequest request
    ) {
        HouseholdResponse response = householdService.assignResident(id, request.getUserId());
        return ResponseEntity.ok(ApiResponse.success("Resident assigned to household", response));
    }

    @DeleteMapping("/{id}/residents/{userId}")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<HouseholdResponse>> removeResident(
            @PathVariable Long id,
            @PathVariable Long userId
    ) {
        HouseholdResponse response = householdService.removeResident(id, userId);
        return ResponseEntity.ok(ApiResponse.success("Resident removed from household", response));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<Void>> deleteHousehold(@PathVariable Long id) {
        householdService.deleteHousehold(id);
        return ResponseEntity.ok(ApiResponse.success("Household deleted successfully", null));
    }
}
