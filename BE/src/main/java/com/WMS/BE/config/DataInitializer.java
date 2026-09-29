package com.WMS.BE.config;

import com.WMS.BE.model.Apartment;
import com.WMS.BE.model.User;
import com.WMS.BE.repository.ApartmentRepository;
import com.WMS.BE.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

@Component
@Slf4j
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final ApartmentRepository apartmentRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        log.info("🚀 [DataInitializer] Checking platform seed accounts...");

        // 1. Ensure default seed Apartment exists
        Apartment defaultApt = apartmentRepository.findAll().stream().findFirst().orElseGet(() -> {
            Apartment apt = new Apartment();
            apt.setName("Palm Meadows Society");
            apt.setCity("Bengaluru");
            apt.setState("Karnataka");
            apt.setTotalUnits(50);
            return apartmentRepository.save(apt);
        });

        // 2. Ensure Main Admin (Super Admin) exists
        if (!userRepository.existsByUsername("mainadmin")) {
            log.info("👑 [DataInitializer] Creating default MAIN_ADMIN account (username: mainadmin)");
            User mainAdmin = new User();
            mainAdmin.setUsername("mainadmin");
            mainAdmin.setEmail("mainadmin@dropwater.app");
            mainAdmin.setPassword(passwordEncoder.encode("password"));
            mainAdmin.setFullName("Platform Super Administrator");
            mainAdmin.setPhone("+91 99999 00000");
            mainAdmin.setRole(User.Role.MAIN_ADMIN);
            mainAdmin.setApprovalStatus(User.ApprovalStatus.APPROVED);
            mainAdmin.setApprovedAt(LocalDateTime.now());
            mainAdmin.setIsActive(true);
            userRepository.save(mainAdmin);
            log.info("✅ [DataInitializer] MAIN_ADMIN seeded successfully.");
        }

        // 3. Ensure default Apartment Admin exists
        if (!userRepository.existsByUsername("admin")) {
            log.info("🏢 [DataInitializer] Creating default APARTMENT_ADMIN account (username: admin)");
            User aptAdmin = new User();
            aptAdmin.setUsername("admin");
            aptAdmin.setEmail("admin@dropwater.app");
            aptAdmin.setPassword(passwordEncoder.encode("password"));
            aptAdmin.setFullName("Palm Meadows Admin");
            aptAdmin.setPhone("+91 98765 43210");
            aptAdmin.setRole(User.Role.APARTMENT_ADMIN);
            aptAdmin.setApprovalStatus(User.ApprovalStatus.APPROVED);
            aptAdmin.setApprovedAt(LocalDateTime.now());
            aptAdmin.setApartment(defaultApt);
            aptAdmin.setIsActive(true);
            userRepository.save(aptAdmin);
            log.info("✅ [DataInitializer] APARTMENT_ADMIN seeded successfully.");
        }
    }
}
