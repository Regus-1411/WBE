package com.WMS.BE.dto;

import com.WMS.BE.model.User.Role;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuthResponse {

    private String token;
    @Builder.Default
    private String tokenType = "Bearer";
    private Long id;
    private String username;
    private String email;
    private String fullName;
    private Role role;
    private Long apartmentId;
    private String apartmentName;
    private Long householdId;
    private String householdUnitNumber;
}
