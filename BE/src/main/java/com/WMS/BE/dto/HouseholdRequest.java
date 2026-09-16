package com.WMS.BE.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdRequest {

    @NotBlank(message = "Unit number is required")
    @Size(max = 20, message = "Unit number cannot exceed 20 characters")
    private String unitNumber;

    @Size(max = 10, message = "Floor cannot exceed 10 characters")
    private String floor;

    @Size(max = 20, message = "Block cannot exceed 20 characters")
    private String block;

    @NotNull(message = "Apartment ID is required")
    private Long apartmentId;

    @Size(max = 50, message = "Meter serial number cannot exceed 50 characters")
    private String meterSerialNumber;

    private LocalDate meterInstalledDate;
}
