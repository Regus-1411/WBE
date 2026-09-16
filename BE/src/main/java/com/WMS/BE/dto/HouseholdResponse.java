package com.WMS.BE.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HouseholdResponse {

    private Long id;
    private String unitNumber;
    private String floor;
    private String block;
    private Long apartmentId;
    private String apartmentName;
    private String meterSerialNumber;
    private LocalDate meterInstalledDate;
    private Boolean isActive;
    private Integer residentCount;
    private List<ResidentSummaryDto> residents;
    private LocalDateTime createdAt;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ResidentSummaryDto {
        private Long id;
        private String username;
        private String fullName;
        private String email;
        private String phone;
    }
}
