package com.WMS.BE.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CsvUploadSummaryResponse {

    private int totalRows;
    private int successfulRows;
    private int skippedDuplicates;
    private int failedRows;
    @Builder.Default
    private List<String> errors = new ArrayList<>();
    @Builder.Default
    private List<WaterUsageResponse> importedLogs = new ArrayList<>();
}
