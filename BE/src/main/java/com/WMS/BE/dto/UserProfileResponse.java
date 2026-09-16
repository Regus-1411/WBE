package com.WMS.BE.dto;

import com.WMS.BE.model.User.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Role role;
    private Long apartmentId;
    private String apartmentName;
    private Long householdId;
    private String householdUnitNumber;
    private String householdBlock;
    private Boolean isActive;
    private LocalDateTime createdAt;
}
