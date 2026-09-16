package com.WMS.BE.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateResidentRequest {

    @NotBlank(message = "Resident full name is required")
    @Size(max = 100, message = "Full name cannot exceed 100 characters")
    private String fullName;

    @NotBlank(message = "Resident email is required")
    @Email(message = "Invalid email format")
    private String email;

    private String phone;

    private String username;

    private String password;

    @NotNull(message = "Apartment ID is required")
    private Long apartmentId;

    private Long householdId;

    private String unitNumber;

    private String block;

    @Builder.Default
    private Boolean sendEmail = true;
}
