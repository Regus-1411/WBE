package com.WMS.BE.controller;

import com.WMS.BE.dto.ApiResponse;
import com.WMS.BE.dto.CsvUploadSummaryResponse;
import com.WMS.BE.dto.ManualWaterUsageRequest;
import com.WMS.BE.dto.WaterUsageResponse;
import com.WMS.BE.service.WaterUsageLogService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.List;

@RestController
@RequestMapping("/api/water-usage")
@RequiredArgsConstructor
public class WaterUsageLogController {

    private final WaterUsageLogService waterUsageLogService;

    @PostMapping("/manual")
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<WaterUsageResponse>> recordManualReading(
            @Valid @RequestBody ManualWaterUsageRequest request,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        WaterUsageResponse response = waterUsageLogService.recordManualReading(request, userDetails.getUsername());
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(ApiResponse.success("Water usage logged successfully", response));
    }

    @PostMapping(value = "/bulk-upload", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('APARTMENT_ADMIN')")
    public ResponseEntity<ApiResponse<CsvUploadSummaryResponse>> bulkUploadCsv(
            @RequestParam("file") MultipartFile file,
            @RequestParam("apartmentId") Long apartmentId,
            @AuthenticationPrincipal UserDetails userDetails
    ) {
        CsvUploadSummaryResponse summary = waterUsageLogService.bulkUploadCsv(file, apartmentId, userDetails.getUsername());
        return ResponseEntity.ok(ApiResponse.success("CSV bulk upload processed successfully", summary));
    }

    @GetMapping("/household/{householdId}")
    public ResponseEntity<ApiResponse<List<WaterUsageResponse>>> getLogsByHousehold(@PathVariable Long householdId) {
        List<WaterUsageResponse> logs = waterUsageLogService.getLogsByHousehold(householdId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }

    @GetMapping("/apartment/{apartmentId}")
    public ResponseEntity<ApiResponse<List<WaterUsageResponse>>> getLogsByApartment(@PathVariable Long apartmentId) {
        List<WaterUsageResponse> logs = waterUsageLogService.getLogsByApartment(apartmentId);
        return ResponseEntity.ok(ApiResponse.success(logs));
    }
}
