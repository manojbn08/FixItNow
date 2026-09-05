package com.fixitnow.dto;

import lombok.Data;

@Data
public class PaymentRequest {
    private Long bookingId;
    private java.math.BigDecimal amount;
}
