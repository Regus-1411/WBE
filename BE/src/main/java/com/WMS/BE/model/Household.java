package com.WMS.BE.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;
import org.hibernate.annotations.UpdateTimestamp;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "households",
       uniqueConstraints = @UniqueConstraint(columnNames = {"unit_number", "apartment_id"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class Household {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "unit_number", nullable = false, length = 20)
    private String unitNumber;

    @Column(length = 10)
    private String floor;

    @Column(length = 20)
    private String block;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "apartment_id", nullable = false)
    @JsonIgnore
    private Apartment apartment;

    @Column(name = "meter_serial_number", unique = true, length = 50)
    private String meterSerialNumber;

    @Column(name = "meter_installed_date")
    private LocalDate meterInstalledDate;

    @OneToMany(mappedBy = "household")
    @JsonIgnore
    private List<User> residents = new ArrayList<>();

    @OneToMany(mappedBy = "household", cascade = CascadeType.ALL, orphanRemoval = true)
    @JsonIgnore
    private List<WaterUsageLog> waterUsageLogs = new ArrayList<>();

    @Column(name = "is_active")
    private Boolean isActive = true;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @UpdateTimestamp
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
