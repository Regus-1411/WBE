package com.WMS.BE.dto;

import com.WMS.BE.model.WaterUsageLog.Source;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class WaterUsageResponse {

    private Long id;
    private Long householdId;
    private String householdUnitNumber;
    private LocalDate readingDate;
    private BigDecimal meterReading;
    private BigDecimal previousReading;
    private BigDecimal consumption;
    private String recordedByUsername;
    private Source source;
    private Boolean isValidated;
    private String notes;
    private LocalDateTime createdAt;
}
