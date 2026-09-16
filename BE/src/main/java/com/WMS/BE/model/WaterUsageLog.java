package com.WMS.BE.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;
import org.hibernate.annotations.CreationTimestamp;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "water_usage_logs",
       uniqueConstraints = @UniqueConstraint(columnNames = {"household_id", "reading_date"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
public class WaterUsageLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "household_id", nullable = false)
    @JsonIgnore
    private Household household;

    @Column(name = "reading_date", nullable = false)
    private LocalDate readingDate;

    @Column(name = "meter_reading", nullable = false)
    private BigDecimal meterReading;

    @Column(name = "previous_reading", nullable = false)
    private BigDecimal previousReading = BigDecimal.ZERO;

    @Column(nullable = false)
    private BigDecimal consumption = BigDecimal.ZERO;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    @JsonIgnore
    private User recordedBy;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "billing_cycle_id")
    @JsonIgnore
    private BillingCycle billingCycle;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Source source = Source.MANUAL;

    @Column(name = "is_validated")
    private Boolean isValidated = false;

    @Column(length = 255)
    private String notes;

    @CreationTimestamp
    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    public enum Source {
        MANUAL,
        CSV_UPLOAD
    }
}
