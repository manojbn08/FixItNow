package com.fixitnow.dto;

import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Data
@Builder
public class PaymentDTO {
    private Long id;
    private Long bookingId;
    private String serviceCategory;
    private String serviceSubcategory;
    private Long customerId;
    private String customerName;
    private String customerEmail;
    private Long providerId;
    private String providerName;
    private String providerEmail;
    private BigDecimal amount;
    private LocalDateTime paymentDate;
}
