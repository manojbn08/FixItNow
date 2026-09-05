package com.fixitnow.dto;

import com.fixitnow.model.DisputeStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Data
@Builder
public class DisputeDTO {
    private Long id;
    private Long bookingId;
    private String serviceCategory;
    private String serviceSubcategory;
    private BigDecimal bookingAmount;
    private LocalDate bookingDate;
    private String bookingTimeSlot;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long providerId;
    private String providerName;
    private String providerEmail;
    private String issueDescription;
    private String providerResponse;
    private String adminNotes;
    private DisputeStatus status;
    private LocalDateTime resolvedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
