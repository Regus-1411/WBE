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
public class ResidentResponse {

    private Long id;
    private String username;
    private String fullName;
    private String email;
    private String phone;
    private Role role;
    private Long apartmentId;
    private String apartmentName;
    private Long householdId;
    private String householdUnitNumber;
    private String householdBlock;
    private Boolean emailSent;
    private String message;
    private LocalDateTime createdAt;
}
