package com.WMS.BE.service;

import com.WMS.BE.dto.*;
import com.WMS.BE.model.Apartment;
import com.WMS.BE.model.Household;
import com.WMS.BE.model.User;
import com.WMS.BE.repository.ApartmentRepository;
import com.WMS.BE.repository.HouseholdRepository;
import com.WMS.BE.repository.UserRepository;
import com.WMS.BE.security.JwtUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final HouseholdRepository householdRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtils jwtUtils;
    private final AuthenticationManager authenticationManager;
    private final EmailService emailService;

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        // Default to APARTMENT_ADMIN for new registration signups.
        // MAIN_ADMIN cannot be self-assigned through the public register endpoint for security.
        User.Role role = request.getRole();
        if (role == null || role == User.Role.MAIN_ADMIN) {
            role = User.Role.APARTMENT_ADMIN;
        }

        Apartment apartment = null;
        if (request.getApartmentId() != null) {
            apartment = apartmentRepository.findById(request.getApartmentId()).orElse(null);
        }

        if (apartment == null) {
            String aptName = (request.getApartmentName() != null && !request.getApartmentName().isBlank())
                    ? request.getApartmentName().trim()
                    : "New Apartment Society";
            
            Apartment newApt = new Apartment();
            newApt.setName(aptName);
            newApt.setAddress(request.getSocietyAddress() != null ? request.getSocietyAddress().trim() : "Main Road");
            newApt.setCity(request.getCity() != null ? request.getCity().trim() : "Bengaluru");
            newApt.setState(request.getState() != null ? request.getState().trim() : "Karnataka");
            newApt.setTotalUnits(request.getTotalUnits() != null ? request.getTotalUnits() : 50);
            apartment = apartmentRepository.save(newApt);
        }

        Household household = null;
        if (request.getHouseholdId() != null) {
            household = householdRepository.findById(request.getHouseholdId()).orElse(null);
            if (household != null && household.getApartment() != null) {
                apartment = household.getApartment();
            }
        }

        User user = new User();
        user.setUsername(request.getUsername().trim());
        user.setEmail(request.getEmail().trim().toLowerCase());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName().trim());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setApartment(apartment);
        user.setHousehold(household);

        // Document submission handling
        user.setDocumentBond(request.getDocumentBond());
        user.setDocumentCertificate(request.getDocumentCertificate());
        user.setDocumentIdProof(request.getDocumentIdProof());
        user.setDocumentNotes(request.getDocumentNotes());

        boolean isAptAdmin = (role == User.Role.APARTMENT_ADMIN);
        if (isAptAdmin) {
            user.setApprovalStatus(User.ApprovalStatus.PENDING);
            user.setIsActive(false); // Pending verification by Main Admin
        } else {
            user.setApprovalStatus(User.ApprovalStatus.APPROVED);
            user.setIsActive(true);
        }

        User savedUser = userRepository.save(user);

        // If apartment admin, send submission receipt acknowledgement
        if (isAptAdmin) {
            String aptName = savedUser.getApartment() != null ? savedUser.getApartment().getName() : "Society";
            emailService.sendAdminRegistrationSubmitted(savedUser.getEmail(), savedUser.getFullName(), aptName);

            return AuthResponse.builder()
                    .token(null)
                    .id(savedUser.getId())
                    .username(savedUser.getUsername())
                    .email(savedUser.getEmail())
                    .fullName(savedUser.getFullName())
                    .role(savedUser.getRole())
                    .apartmentId(savedUser.getApartment() != null ? savedUser.getApartment().getId() : null)
                    .apartmentName(aptName)
                    .approvalStatus(User.ApprovalStatus.PENDING)
                    .message("Application submitted successfully with documents. Your account is pending Main Admin verification.")
                    .build();
        }

        Long aptId = savedUser.getApartment() != null ? savedUser.getApartment().getId() : null;
        String token = jwtUtils.generateToken(savedUser.getUsername(), savedUser.getRole().name(), aptId);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(savedUser.getId())
                .username(savedUser.getUsername())
                .email(savedUser.getEmail())
                .fullName(savedUser.getFullName())
                .role(savedUser.getRole())
                .apartmentId(aptId)
                .apartmentName(savedUser.getApartment() != null ? savedUser.getApartment().getName() : null)
                .householdId(savedUser.getHousehold() != null ? savedUser.getHousehold().getId() : null)
                .householdUnitNumber(savedUser.getHousehold() != null ? savedUser.getHousehold().getUnitNumber() : null)
                .householdBlock(savedUser.getHousehold() != null ? savedUser.getHousehold().getBlock() : null)
                .approvalStatus(User.ApprovalStatus.APPROVED)
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        User user = userRepository.findByUsername(request.getUsername())
                .or(() -> userRepository.findByEmail(request.getUsername()))
                .orElseThrow(() -> new IllegalArgumentException("Invalid username or password."));

        if (user.getRole() == User.Role.APARTMENT_ADMIN && user.getApprovalStatus() == User.ApprovalStatus.PENDING) {
            throw new IllegalArgumentException("Your Apartment Admin account is currently PENDING Main Admin verification. Submitted documents are under review. You will receive an email once approved.");
        }

        if (user.getRole() == User.Role.APARTMENT_ADMIN && user.getApprovalStatus() == User.ApprovalStatus.REJECTED) {
            throw new IllegalArgumentException("Your application was rejected: " + (user.getRejectionReason() != null ? user.getRejectionReason() : "Please contact Main Admin."));
        }

        if (Boolean.FALSE.equals(user.getIsActive())) {
            throw new IllegalArgumentException("Account is currently inactive or suspended. Please contact administrator.");
        }

        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(user.getUsername(), request.getPassword())
        );

        Long aptId = user.getApartment() != null ? user.getApartment().getId() : null;
        String token = jwtUtils.generateToken(user.getUsername(), user.getRole().name(), aptId);

        return AuthResponse.builder()
                .token(token)
                .tokenType("Bearer")
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .role(user.getRole())
                .apartmentId(aptId)
                .apartmentName(user.getApartment() != null ? user.getApartment().getName() : null)
                .householdId(user.getHousehold() != null ? user.getHousehold().getId() : null)
                .householdUnitNumber(user.getHousehold() != null ? user.getHousehold().getUnitNumber() : null)
                .householdBlock(user.getHousehold() != null ? user.getHousehold().getBlock() : null)
                .approvalStatus(user.getApprovalStatus())
                .build();
    }

    public UserProfileResponse getProfile(String username) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        return buildProfileResponse(user);
    }

    @Transactional
    public UserProfileResponse updateProfile(String username, UpdateProfileRequest request) {
        User user = userRepository.findByUsername(username)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + username));

        if (request.getFullName() != null && !request.getFullName().isBlank()) {
            user.setFullName(request.getFullName());
        }

        if (request.getEmail() != null && !request.getEmail().isBlank()) {
            if (!user.getEmail().equalsIgnoreCase(request.getEmail()) && userRepository.existsByEmail(request.getEmail())) {
                throw new IllegalArgumentException("Email is already taken: " + request.getEmail());
            }
            user.setEmail(request.getEmail());
        }

        if (request.getPhone() != null) {
            user.setPhone(request.getPhone());
        }

        if (request.getNewPassword() != null && !request.getNewPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getNewPassword()));
        }

        User updatedUser = userRepository.save(user);
        return buildProfileResponse(updatedUser);
    }

    private UserProfileResponse buildProfileResponse(User user) {
        return UserProfileResponse.builder()
                .id(user.getId())
                .username(user.getUsername())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .apartmentId(user.getApartment() != null ? user.getApartment().getId() : null)
                .apartmentName(user.getApartment() != null ? user.getApartment().getName() : null)
                .householdId(user.getHousehold() != null ? user.getHousehold().getId() : null)
                .householdUnitNumber(user.getHousehold() != null ? user.getHousehold().getUnitNumber() : null)
                .householdBlock(user.getHousehold() != null ? user.getHousehold().getBlock() : null)
                .isActive(user.getIsActive())
                .createdAt(user.getCreatedAt())
                .build();
    }
}
