package com.WMS.BE.service;

import com.WMS.BE.dto.CreateResidentRequest;
import com.WMS.BE.dto.ResidentResponse;
import com.WMS.BE.model.Apartment;
import com.WMS.BE.model.Household;
import com.WMS.BE.model.User;
import com.WMS.BE.repository.ApartmentRepository;
import com.WMS.BE.repository.HouseholdRepository;
import com.WMS.BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.security.SecureRandom;
import java.util.List;
import java.util.Random;
import java.util.stream.Collectors;

@Service
@Slf4j
@RequiredArgsConstructor
public class AdminResidentService {

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final PasswordEncoder passwordEncoder;
    private final EmailService emailService;

    private static final String TEMP_PASS_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$";
    private static final Random RANDOM = new SecureRandom();

    @Transactional
    public ResidentResponse createResident(CreateResidentRequest request) {
        log.info("Creating resident account for email: {}, flat: {}", request.getEmail(), request.getUnitNumber());

        // 1. Check if email already exists
        if (userRepository.existsByEmail(request.getEmail().trim())) {
            throw new IllegalArgumentException("A user with email " + request.getEmail() + " already exists.");
        }

        // 2. Resolve Apartment
        Apartment apartment = apartmentRepository.findById(request.getApartmentId())
                .orElseThrow(() -> new IllegalArgumentException("Apartment not found with ID: " + request.getApartmentId()));

        // 3. Resolve or Link Household
        Household household = null;
        if (request.getHouseholdId() != null) {
            household = householdRepository.findById(request.getHouseholdId()).orElse(null);
        } else if (request.getUnitNumber() != null && !request.getUnitNumber().isBlank()) {
            household = householdRepository.findByUnitNumberAndApartmentId(request.getUnitNumber().trim(), apartment.getId())
                    .orElseGet(() -> {
                        // Create household if not present yet
                        Household newHousehold = new Household();
                        newHousehold.setUnitNumber(request.getUnitNumber().trim());
                        newHousehold.setBlock(request.getBlock() != null ? request.getBlock().trim() : "Main Block");
                        newHousehold.setApartment(apartment);
                        newHousehold.setIsActive(true);
                        return householdRepository.save(newHousehold);
                    });
        }

        // 4. Generate unique username if not specified
        String username = request.getUsername();
        if (username == null || username.isBlank()) {
            username = generateUniqueUsername(request.getEmail(), request.getUnitNumber());
        } else {
            username = username.trim().toLowerCase();
            if (userRepository.existsByUsername(username)) {
                throw new IllegalArgumentException("Username '" + username + "' is already taken.");
            }
        }

        // 5. Generate secure temporary password if not provided
        String plainPassword = request.getPassword();
        if (plainPassword == null || plainPassword.isBlank()) {
            plainPassword = generateTemporaryPassword();
        }

        // 6. Save Resident User
        User resident = new User();
        resident.setUsername(username);
        resident.setEmail(request.getEmail().trim().toLowerCase());
        resident.setPassword(passwordEncoder.encode(plainPassword));
        resident.setFullName(request.getFullName().trim());
        resident.setPhone(request.getPhone());
        resident.setRole(User.Role.RESIDENT);
        resident.setApartment(apartment);
        resident.setHousehold(household);
        resident.setIsActive(true);

        User savedUser = userRepository.save(resident);
        log.info("✅ Saved resident user ID: {}, username: {}", savedUser.getId(), savedUser.getUsername());

        // 7. Dispatch Confirmation & Credentials Email (Asynchronously)
        boolean emailDispatched = false;
        if (Boolean.TRUE.equals(request.getSendEmail())) {
            String unitDisplay = household != null ? household.getUnitNumber() : request.getUnitNumber();
            emailService.sendResidentCredentials(
                    savedUser.getEmail(),
                    savedUser.getFullName(),
                    savedUser.getUsername(),
                    plainPassword,
                    unitDisplay,
                    apartment.getName()
            );
            emailDispatched = true;
        }

        return mapToResponse(savedUser, emailDispatched, "Resident created successfully and credentials dispatched via email.");
    }

    @Transactional
    public ResidentResponse resendCredentials(Long residentId) {
        User user = userRepository.findById(residentId)
                .orElseThrow(() -> new IllegalArgumentException("Resident not found with ID: " + residentId));

        if (user.getRole() != User.Role.RESIDENT) {
            throw new IllegalArgumentException("User with ID " + residentId + " is not a resident.");
        }

        // Generate a new temporary password and update
        String newPlainPassword = generateTemporaryPassword();
        user.setPassword(passwordEncoder.encode(newPlainPassword));
        userRepository.save(user);

        String unitDisplay = user.getHousehold() != null ? user.getHousehold().getUnitNumber() : "Assigned Unit";
        String aptName = user.getApartment() != null ? user.getApartment().getName() : "DROP Water";

        emailService.sendResidentCredentials(
                user.getEmail(),
                user.getFullName(),
                user.getUsername(),
                newPlainPassword,
                unitDisplay,
                aptName
        );

        return mapToResponse(user, true, "New credentials generated and sent to " + user.getEmail());
    }

    public List<ResidentResponse> getResidentsByApartment(Long apartmentId) {
        return userRepository.findByApartmentIdAndRole(apartmentId, User.Role.RESIDENT).stream()
                .map(u -> mapToResponse(u, false, null))
                .collect(Collectors.toList());
    }

    public boolean isEmailAvailable(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        return !userRepository.existsByEmail(email.trim().toLowerCase());
    }


    private String generateUniqueUsername(String email, String unitNumber) {
        String base = "";
        if (unitNumber != null && !unitNumber.isBlank()) {
            base = "flat_" + unitNumber.replaceAll("[^a-zA-Z0-9]", "").toLowerCase();
        } else if (email != null && email.contains("@")) {
            base = email.split("@")[0].replaceAll("[^a-zA-Z0-9_]", "").toLowerCase();
        }

        if (base.isBlank()) {
            base = "resident";
        }

        String candidate = base;
        int count = 1;
        while (userRepository.existsByUsername(candidate)) {
            candidate = base + "_" + (100 + RANDOM.nextInt(900));
            count++;
            if (count > 20) {
                candidate = base + "_" + System.currentTimeMillis() % 10000;
                break;
            }
        }
        return candidate;
    }

    private String generateTemporaryPassword() {
        StringBuilder sb = new StringBuilder("Drop@");
        for (int i = 0; i < 5; i++) {
            sb.append(TEMP_PASS_CHARS.charAt(RANDOM.nextInt(TEMP_PASS_CHARS.length())));
        }
        return sb.toString();
    }

    private ResidentResponse mapToResponse(User user, boolean emailSent, String message) {
        return ResidentResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .fullName(user.getFullName())
                .email(user.getEmail())
                .phone(user.getPhone())
                .role(user.getRole())
                .apartmentId(user.getApartment() != null ? user.getApartment().getId() : null)
                .apartmentName(user.getApartment() != null ? user.getApartment().getName() : null)
                .householdId(user.getHousehold() != null ? user.getHousehold().getId() : null)
                .householdUnitNumber(user.getHousehold() != null ? user.getHousehold().getUnitNumber() : null)
                .householdBlock(user.getHousehold() != null ? user.getHousehold().getBlock() : null)
                .emailSent(emailSent)
                .message(message)
                .createdAt(user.getCreatedAt())
                .build();
    }
}
