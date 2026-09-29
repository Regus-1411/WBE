package com.WMS.BE.controller;

import com.WMS.BE.dto.AdminApplicationResponse;
import com.WMS.BE.dto.ApiResponse;
import com.WMS.BE.dto.ApartmentResponse;
import com.WMS.BE.dto.ResidentResponse;
import com.WMS.BE.dto.SuperAdminStatsResponse;
import com.WMS.BE.service.SuperAdminService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/superadmin")
@RequiredArgsConstructor
public class SuperAdminController {

    private final SuperAdminService superAdminService;

    @GetMapping("/stats")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<ApiResponse<SuperAdminStatsResponse>> getStats() {
        SuperAdminStatsResponse stats = superAdminService.getGlobalStats();
        return ResponseEntity.ok(ApiResponse.success(stats));
    }

    @GetMapping("/pending-admins")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminApplicationResponse>>> getPendingAdmins() {
        List<AdminApplicationResponse> list = superAdminService.getPendingApplications();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/all-admins")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<ApiResponse<List<AdminApplicationResponse>>> getAllAdmins() {
        List<AdminApplicationResponse> list = superAdminService.getAllApartmentAdmins();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/all-residents")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<ApiResponse<List<ResidentResponse>>> getAllResidents() {
        List<ResidentResponse> list = superAdminService.getAllResidentsAcrossSocieties();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @GetMapping("/all-apartments")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<ApiResponse<List<ApartmentResponse>>> getAllApartments() {
        List<ApartmentResponse> list = superAdminService.getAllApartments();
        return ResponseEntity.ok(ApiResponse.success(list));
    }

    @PostMapping("/approve-admin/{id}")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<ApiResponse<AdminApplicationResponse>> approveAdmin(@PathVariable Long id) {
        AdminApplicationResponse response = superAdminService.approveAdminApplication(id);
        return ResponseEntity.ok(ApiResponse.success("Apartment Admin approved and activation confirmation email sent", response));
    }

    @PostMapping("/reject-admin/{id}")
    @PreAuthorize("hasRole('MAIN_ADMIN')")
    public ResponseEntity<ApiResponse<AdminApplicationResponse>> rejectAdmin(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, String> payload
    ) {
        String reason = payload != null ? payload.get("reason") : "Documents did not meet criteria";
        AdminApplicationResponse response = superAdminService.rejectAdminApplication(id, reason);
        return ResponseEntity.ok(ApiResponse.success("Application rejected", response));
    }
}
