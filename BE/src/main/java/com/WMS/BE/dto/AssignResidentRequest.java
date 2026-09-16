package com.WMS.BE.dto;

import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AssignResidentRequest {

    @NotNull(message = "User ID is required")
    private Long userId;
}
