package com.fixitnow.dto;

import lombok.Data;

@Data
public class DisputeRequest {
    private Long bookingId;
    private String issueDescription;
}
