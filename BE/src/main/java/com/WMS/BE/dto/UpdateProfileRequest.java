package com.WMS.BE.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class UpdateProfileRequest {

    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    @Size(min = 6, max = 50, message = "Password must be at least 6 characters")
    private String newPassword;
}
