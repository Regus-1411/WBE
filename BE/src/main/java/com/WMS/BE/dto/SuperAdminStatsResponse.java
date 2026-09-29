package com.WMS.BE.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SuperAdminStatsResponse {

    private long totalSocieties;
    private long totalApartmentAdmins;
    private long totalPendingApprovals;
    private long totalHouseholds;
    private long totalResidents;
    private double totalWaterUsageKL;
    private double totalRevenueBilled;
    private List<Map<String, Object>> recentActivity;
}
