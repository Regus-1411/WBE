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

    @Transactional
    public AuthResponse register(RegisterRequest request) {
        // 1. Check if username or email already exists
        if (userRepository.existsByUsername(request.getUsername())) {
            throw new IllegalArgumentException("Username is already taken: " + request.getUsername());
        }
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email is already registered: " + request.getEmail());
        }

        // Determine role (default to APARTMENT_ADMIN for new registration signups)
        User.Role role = request.getRole() != null ? request.getRole() : User.Role.APARTMENT_ADMIN;

        // 2. Resolve or create apartment for admin
        Apartment apartment = null;
        if (request.getApartmentId() != null) {
            apartment = apartmentRepository.findById(request.getApartmentId()).orElse(null);
        }

        if (apartment == null) {
            apartment = apartmentRepository.findAll().stream().findFirst().orElse(null);
            if (apartment == null) {
                Apartment newApt = new Apartment();
                String aptName = (request.getApartmentName() != null && !request.getApartmentName().isBlank())
                        ? request.getApartmentName()
                        : "Palm Meadows Society";
                newApt.setName(aptName);
                newApt.setCity("Bengaluru");
                newApt.setState("Karnataka");
                newApt.setTotalUnits(50);
                apartment = apartmentRepository.save(newApt);
            }
        }

        // 3. Resolve household if provided
        Household household = null;
        if (request.getHouseholdId() != null) {
            household = householdRepository.findById(request.getHouseholdId()).orElse(null);
            if (household != null && household.getApartment() != null) {
                apartment = household.getApartment();
            }
        }

        // 4. Create User entity
        User user = new User();
        user.setUsername(request.getUsername());
        user.setEmail(request.getEmail());
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setRole(role);
        user.setApartment(apartment);
        user.setHousehold(household);
        user.setIsActive(true);

        User savedUser = userRepository.save(user);

        // 5. Generate JWT token
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
                .build();
    }

    public AuthResponse login(LoginRequest request) {
        // 1. Authenticate with Spring Security's AuthenticationManager
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getUsername(), request.getPassword())
        );

        // 2. Fetch user
        User user = userRepository.findByUsername(request.getUsername())
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + request.getUsername()));

        // 3. Generate token
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
