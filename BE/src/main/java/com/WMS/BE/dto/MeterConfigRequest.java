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
public class MeterConfigRequest {

    @NotBlank(message = "Meter serial number is required")
    @Size(max = 50, message = "Meter serial number cannot exceed 50 characters")
    private String meterSerialNumber;

    @NotNull(message = "Meter installed date is required")
    private LocalDate meterInstalledDate;
}
