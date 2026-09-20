package com.WMS.BE.service;

import com.WMS.BE.dto.CsvUploadSummaryResponse;
import com.WMS.BE.dto.ManualWaterUsageRequest;
import com.WMS.BE.dto.WaterUsageResponse;
import com.WMS.BE.model.Household;
import com.WMS.BE.model.User;
import com.WMS.BE.model.WaterUsageLog;
import com.WMS.BE.repository.HouseholdRepository;
import com.WMS.BE.repository.UserRepository;
import com.WMS.BE.repository.WaterUsageLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@Slf4j
@Service
@RequiredArgsConstructor
public class WaterUsageLogService {

    private final WaterUsageLogRepository waterUsageLogRepository;
    private final HouseholdRepository householdRepository;
    private final UserRepository userRepository;

    private static final DateTimeFormatter DATE_FORMATTER = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Transactional
    public WaterUsageResponse recordManualReading(ManualWaterUsageRequest request, String username) {
        Household household = householdRepository.findById(request.getHouseholdId())
                .orElseThrow(() -> new IllegalArgumentException("Household not found with ID: " + request.getHouseholdId()));

        if (waterUsageLogRepository.existsByHouseholdIdAndReadingDate(request.getHouseholdId(), request.getReadingDate())) {
            throw new IllegalArgumentException("A reading for unit " + household.getUnitNumber() + " on " + request.getReadingDate() + " already exists.");
        }

        Optional<WaterUsageLog> lastLogOpt = waterUsageLogRepository.findTopByHouseholdIdOrderByReadingDateDesc(request.getHouseholdId());
        BigDecimal previousReading = lastLogOpt.map(WaterUsageLog::getMeterReading).orElse(BigDecimal.ZERO);

        BigDecimal consumption = request.getMeterReading().subtract(previousReading);
        if (consumption.compareTo(BigDecimal.ZERO) < 0) {
            // If meter was replaced or rollover, treat as zero consumption
            consumption = BigDecimal.ZERO;
        }

        User recordedBy = userRepository.findByUsername(username).orElse(null);

        WaterUsageLog logEntity = new WaterUsageLog();
        logEntity.setHousehold(household);
        logEntity.setReadingDate(request.getReadingDate());
        logEntity.setMeterReading(request.getMeterReading());
        logEntity.setPreviousReading(previousReading);
        logEntity.setConsumption(consumption);
        logEntity.setRecordedBy(recordedBy);
        logEntity.setSource(WaterUsageLog.Source.MANUAL);
        logEntity.setIsValidated(true);
        logEntity.setNotes(request.getNotes());

        WaterUsageLog saved = waterUsageLogRepository.save(logEntity);
        return mapToResponse(saved);
    }

    @Transactional
    public CsvUploadSummaryResponse bulkUploadCsv(MultipartFile file, Long apartmentId, String username) {
        if (file.isEmpty()) {
            throw new IllegalArgumentException("Uploaded file is empty.");
        }

        User recordedBy = userRepository.findByUsername(username).orElse(null);
        List<String> errors = new ArrayList<>();
        List<WaterUsageResponse> imported = new ArrayList<>();
        int totalRows = 0;
        int successfulRows = 0;
        int skippedDuplicates = 0;
        int failedRows = 0;

        try (BufferedReader reader = new BufferedReader(new InputStreamReader(file.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            int lineNumber = 0;

            while ((line = reader.readLine()) != null) {
                lineNumber++;
                if (line.trim().isEmpty()) {
                    continue;
                }

                if (lineNumber == 1 && (line.toLowerCase().contains("unit") || line.toLowerCase().contains("meter"))) {
                    continue; // Skip CSV header row
                }

                totalRows++;
                String[] tokens = line.split(",");

                if (tokens.length < 3) {
                    errors.add("Line " + lineNumber + ": Invalid column count (expected at least unit_number, reading_date, meter_reading)");
                    failedRows++;
                    continue;
                }

                String unitNumber = tokens[0].trim();
                String dateStr = tokens[1].trim();
                String readingStr = tokens[2].trim();
                String notes = tokens.length > 3 ? tokens[3].trim() : null;

                Optional<Household> householdOpt = householdRepository.findByUnitNumberAndApartmentId(unitNumber, apartmentId);
                if (householdOpt.isEmpty()) {
                    errors.add("Line " + lineNumber + ": Unit number '" + unitNumber + "' not found in apartment ID " + apartmentId);
                    failedRows++;
                    continue;
                }
                Household household = householdOpt.get();

                LocalDate readingDate;
                try {
                    readingDate = LocalDate.parse(dateStr, DATE_FORMATTER);
                } catch (Exception e) {
                    errors.add("Line " + lineNumber + ": Invalid date format '" + dateStr + "' (expected yyyy-MM-dd)");
                    failedRows++;
                    continue;
                }

                BigDecimal meterReading;
                try {
                    meterReading = new BigDecimal(readingStr);
                    if (meterReading.compareTo(BigDecimal.ZERO) < 0) {
                        errors.add("Line " + lineNumber + ": Negative meter reading not allowed: " + readingStr);
                        failedRows++;
                        continue;
                    }
                } catch (Exception e) {
                    errors.add("Line " + lineNumber + ": Invalid meter reading number '" + readingStr + "'");
                    failedRows++;
                    continue;
                }

                if (waterUsageLogRepository.existsByHouseholdIdAndReadingDate(household.getId(), readingDate)) {
                    skippedDuplicates++;
                    continue;
                }

                Optional<WaterUsageLog> lastLogOpt = waterUsageLogRepository.findTopByHouseholdIdOrderByReadingDateDesc(household.getId());
                BigDecimal previousReading = lastLogOpt.map(WaterUsageLog::getMeterReading).orElse(BigDecimal.ZERO);
                BigDecimal consumption = meterReading.subtract(previousReading);
                if (consumption.compareTo(BigDecimal.ZERO) < 0) {
                    consumption = BigDecimal.ZERO;
                }

                WaterUsageLog logEntity = new WaterUsageLog();
                logEntity.setHousehold(household);
                logEntity.setReadingDate(readingDate);
                logEntity.setMeterReading(meterReading);
                logEntity.setPreviousReading(previousReading);
                logEntity.setConsumption(consumption);
                logEntity.setRecordedBy(recordedBy);
                logEntity.setSource(WaterUsageLog.Source.CSV_UPLOAD);
                logEntity.setIsValidated(true);
                logEntity.setNotes(notes);

                WaterUsageLog saved = waterUsageLogRepository.save(logEntity);
                imported.add(mapToResponse(saved));
                successfulRows++;
            }
        } catch (Exception e) {
            log.error("Error parsing CSV file", e);
            throw new IllegalArgumentException("Failed to parse CSV file: " + e.getMessage());
        }

        return CsvUploadSummaryResponse.builder()
                .totalRows(totalRows)
                .successfulRows(successfulRows)
                .skippedDuplicates(skippedDuplicates)
                .failedRows(failedRows)
                .errors(errors)
                .importedLogs(imported)
                .build();
    }

    public List<WaterUsageResponse> getLogsByHousehold(Long householdId) {
        return waterUsageLogRepository.findByHouseholdIdOrderByReadingDateDesc(householdId).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<WaterUsageResponse> getLogsByApartment(Long apartmentId) {
        List<Household> households = householdRepository.findByApartmentId(apartmentId);
        List<WaterUsageResponse> allLogs = new ArrayList<>();
        for (Household h : households) {
            allLogs.addAll(getLogsByHousehold(h.getId()));
        }
        return allLogs;
    }

    private WaterUsageResponse mapToResponse(WaterUsageLog log) {
        return WaterUsageResponse.builder()
                .id(log.getId())
                .householdId(log.getHousehold() != null ? log.getHousehold().getId() : null)
                .householdUnitNumber(log.getHousehold() != null ? log.getHousehold().getUnitNumber() : null)
                .readingDate(log.getReadingDate())
                .meterReading(log.getMeterReading())
                .previousReading(log.getPreviousReading())
                .consumption(log.getConsumption())
                .recordedByUsername(log.getRecordedBy() != null ? log.getRecordedBy().getUsername() : "System")
                .source(log.getSource())
                .isValidated(log.getIsValidated())
                .notes(log.getNotes())
                .createdAt(log.getCreatedAt())
                .build();
    }
}
