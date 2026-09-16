package com.WMS.BE.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ManualWaterUsageRequest {

    @NotNull(message = "Household ID is required")
    private Long householdId;

    @NotNull(message = "Reading date is required")
    private LocalDate readingDate;

    @NotNull(message = "Meter reading is required")
    @DecimalMin(value = "0.0", inclusive = true, message = "Meter reading cannot be negative")
    private BigDecimal meterReading;

    @Size(max = 255, message = "Notes cannot exceed 255 characters")
    private String notes;
}
