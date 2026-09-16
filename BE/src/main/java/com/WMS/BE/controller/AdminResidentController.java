package com.WMS.BE.controller;

import com.WMS.BE.dto.ApiResponse;
import com.WMS.BE.dto.CreateResidentRequest;
import com.WMS.BE.dto.ResidentResponse;
import com.WMS.BE.service.AdminResidentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/residents")
@RequiredArgsConstructor
public class AdminResidentController {

    private final AdminResidentService adminResidentService;

    @PostMapping
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<ResidentResponse>> createResident(
            @Valid @RequestBody CreateResidentRequest request
    ) {
        ResidentResponse response = adminResidentService.createResident(request);
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Resident registered and credentials email dispatched", response));
    }

    @PostMapping("/{id}/resend-credentials")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<ResidentResponse>> resendCredentials(
            @PathVariable Long id
    ) {
        ResidentResponse response = adminResidentService.resendCredentials(id);
        return ResponseEntity.ok(ApiResponse.success("Credentials re-dispatched to resident email", response));
    }

    @GetMapping
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<List<ResidentResponse>>> getResidents(
            @RequestParam Long apartmentId
    ) {
        List<ResidentResponse> list = adminResidentService.getResidentsByApartment(apartmentId);
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/check-email")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<Boolean>> checkEmail(@RequestParam String email) {
        boolean available = adminResidentService.isEmailAvailable(email);
        String msg = available ? "Email is available for registration" : "Email is already registered";
        return ResponseEntity.ok(ApiResponse.success(msg, available));
    }
}

