package com.WMS.BE.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ApartmentRequest {

    @NotBlank(message = "Apartment/community name is required")
    @Size(max = 100, message = "Name cannot exceed 100 characters")
    private String name;

    @NotBlank(message = "Address is required")
    private String address;

    @NotBlank(message = "City is required")
    @Size(max = 50, message = "City cannot exceed 50 characters")
    private String city;

    @NotBlank(message = "State is required")
    @Size(max = 50, message = "State cannot exceed 50 characters")
    private String state;

    @Size(max = 20, message = "Pincode cannot exceed 20 characters")
    private String pincode;

    @Size(max = 20, message = "Postal code cannot exceed 20 characters")
    private String postalCode;

    @Min(value = 1, message = "Total units must be at least 1")
    private Integer totalUnits;

    public String getEffectivePincode() {
        if (pincode != null && !pincode.isBlank()) {
            return pincode;
        }
        return postalCode;
    }
}
