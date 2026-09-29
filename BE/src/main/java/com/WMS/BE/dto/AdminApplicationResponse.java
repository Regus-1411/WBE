package com.WMS.BE.dto;

import com.WMS.BE.model.User.ApprovalStatus;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminApplicationResponse {

    private Long id;
    private String username;
    private String email;
    private String fullName;
    private String phone;
    private Long apartmentId;
    private String apartmentName;
    private String societyAddress;
    private String city;
    private String state;
    private Integer totalUnits;
    private ApprovalStatus approvalStatus;
    private String documentBond;
    private String documentCertificate;
    private String documentIdProof;
    private String documentNotes;
    private String rejectionReason;
    private Boolean isActive;
    private LocalDateTime createdAt;
    private LocalDateTime approvedAt;
}
