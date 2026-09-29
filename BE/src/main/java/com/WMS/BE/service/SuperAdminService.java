package com.WMS.BE.service;

import com.WMS.BE.dto.AdminApplicationResponse;
import com.WMS.BE.dto.ApartmentResponse;
import com.WMS.BE.dto.ResidentResponse;
import com.WMS.BE.dto.SuperAdminStatsResponse;
import com.WMS.BE.model.Apartment;
import com.WMS.BE.model.User;
import com.WMS.BE.repository.ApartmentRepository;
import com.WMS.BE.repository.BillingCycleRepository;
import com.WMS.BE.repository.HouseholdRepository;
import com.WMS.BE.repository.UserRepository;
import com.WMS.BE.repository.WaterUsageLogRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class SuperAdminService {

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final WaterUsageLogRepository waterUsageLogRepository;
    private final BillingCycleRepository billingCycleRepository;
    private final EmailService emailService;

    public SuperAdminStatsResponse getGlobalStats() {
        long totalSocieties = apartmentRepository.count();
        long totalApartmentAdmins = userRepository.countByRole(User.Role.APARTMENT_ADMIN);
        long totalPendingApprovals = userRepository.countByApprovalStatus(User.ApprovalStatus.PENDING);
        long totalHouseholds = householdRepository.count();
        long totalResidents = userRepository.countByRole(User.Role.RESIDENT);

        List<Map<String, Object>> activityList = new ArrayList<>();
        
        // Add pending applications into recent activity feed
        List<User> recentPending = userRepository.findByApprovalStatus(User.ApprovalStatus.PENDING);
        for (User u : recentPending) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", "ACT-" + u.getId());
            item.put("type", "REGISTRATION_SUBMITTED");
            item.put("title", "New Society Admin Registration");
            item.put("description", u.getFullName() + " submitted registration with documents for " + (u.getApartment() != null ? u.getApartment().getName() : "New Society"));
            item.put("timestamp", u.getCreatedAt());
            item.put("status", "PENDING_VERIFICATION");
            activityList.add(item);
        }

        // Add recent approved admins
        List<User> approvedAdmins = userRepository.findByRoleAndApprovalStatus(User.Role.APARTMENT_ADMIN, User.ApprovalStatus.APPROVED);
        for (User u : approvedAdmins) {
            Map<String, Object> item = new HashMap<>();
            item.put("id", "ACT-APP-" + u.getId());
            item.put("type", "ADMIN_APPROVED");
            item.put("title", "Apartment Admin Approved & Active");
            item.put("description", u.getFullName() + " approved for society " + (u.getApartment() != null ? u.getApartment().getName() : "Society"));
            item.put("timestamp", u.getApprovedAt() != null ? u.getApprovedAt() : u.getCreatedAt());
            item.put("status", "ACTIVE");
            activityList.add(item);
        }

        activityList.sort((a, b) -> {
            LocalDateTime t1 = (LocalDateTime) a.get("timestamp");
            LocalDateTime t2 = (LocalDateTime) b.get("timestamp");
            if (t1 == null || t2 == null) return 0;
            return t2.compareTo(t1);
        });

        return SuperAdminStatsResponse.builder()
                .totalSocieties(totalSocieties)
                .totalApartmentAdmins(totalApartmentAdmins)
                .totalPendingApprovals(totalPendingApprovals)
                .totalHouseholds(totalHouseholds)
                .totalResidents(totalResidents)
                .totalWaterUsageKL(0.0)
                .totalRevenueBilled(0.0)
                .recentActivity(activityList)
                .build();
    }

    public List<AdminApplicationResponse> getPendingApplications() {
        return userRepository.findByApprovalStatus(User.ApprovalStatus.PENDING).stream()
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());
    }

    public List<AdminApplicationResponse> getAllApartmentAdmins() {
        return userRepository.findByRole(User.Role.APARTMENT_ADMIN).stream()
                .map(this::mapToApplicationResponse)
                .collect(Collectors.toList());
    }

    public List<ResidentResponse> getAllResidentsAcrossSocieties() {
        return userRepository.findByRole(User.Role.RESIDENT).stream()
                .map(u -> ResidentResponse.builder()
                        .id(u.getId())
                        .username(u.getUsername())
                        .fullName(u.getFullName())
                        .email(u.getEmail())
                        .phone(u.getPhone())
                        .role(u.getRole())
                        .apartmentId(u.getApartment() != null ? u.getApartment().getId() : null)
                        .apartmentName(u.getApartment() != null ? u.getApartment().getName() : null)
                        .householdId(u.getHousehold() != null ? u.getHousehold().getId() : null)
                        .householdUnitNumber(u.getHousehold() != null ? u.getHousehold().getUnitNumber() : null)
                        .householdBlock(u.getHousehold() != null ? u.getHousehold().getBlock() : null)
                        .createdAt(u.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());
    }

    public List<ApartmentResponse> getAllApartments() {
        return apartmentRepository.findAll().stream()
                .map(a -> ApartmentResponse.builder()
                        .id(a.getId())
                        .name(a.getName())
                        .address(a.getAddress())
                        .city(a.getCity())
                        .state(a.getState())
                        .pincode(a.getPincode())
                        .postalCode(a.getPincode())
                        .totalUnits(a.getTotalUnits())
                        .createdAt(a.getCreatedAt())
                        .build()
                ).collect(Collectors.toList());
    }

    @Transactional
    public AdminApplicationResponse approveAdminApplication(Long userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setApprovalStatus(User.ApprovalStatus.APPROVED);
        user.setIsActive(true);
        user.setApprovedAt(LocalDateTime.now());
        user.setRejectionReason(null);

        User saved = userRepository.save(user);
        log.info("✅ [SuperAdmin] Approved Apartment Admin ID: {}, username: {}", saved.getId(), saved.getUsername());

        // Dispatch official account creation & approval confirmation email
        String aptName = saved.getApartment() != null ? saved.getApartment().getName() : "Your Apartment Society";
        emailService.sendAdminApprovalConfirmation(
                saved.getEmail(),
                saved.getFullName(),
                saved.getUsername(),
                aptName
        );

        return mapToApplicationResponse(saved);
    }

    @Transactional
    public AdminApplicationResponse rejectAdminApplication(Long userId, String reason) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found with ID: " + userId));

        user.setApprovalStatus(User.ApprovalStatus.REJECTED);
        user.setIsActive(false);
        user.setRejectionReason(reason != null ? reason.trim() : "Document verification failed");

        User saved = userRepository.save(user);
        log.info("❌ [SuperAdmin] Rejected Apartment Admin ID: {}, reason: {}", saved.getId(), reason);

        return mapToApplicationResponse(saved);
    }

    private AdminApplicationResponse mapToApplicationResponse(User user) {
        Apartment apt = user.getApartment();
        return AdminApplicationResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .apartmentId(apt != null ? apt.getId() : null)
                .apartmentName(apt != null ? apt.getName() : null)
                .societyAddress(apt != null ? apt.getAddress() : null)
                .city(apt != null ? apt.getCity() : null)
                .state(apt != null ? apt.getState() : null)
                .totalUnits(apt != null ? apt.getTotalUnits() : null)
                .approvalStatus(user.getApprovalStatus())
                .documentBond(user.getDocumentBond())
                .documentCertificate(user.getDocumentCertificate())
                .documentIdProof(user.getDocumentIdProof())
                .documentNotes(user.getDocumentNotes())
                .rejectionReason(user.getRejectionReason())
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .approvedAt(user.getApprovedAt())
                .build();
    }
}
