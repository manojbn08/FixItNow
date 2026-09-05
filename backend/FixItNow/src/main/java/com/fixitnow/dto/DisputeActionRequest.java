package com.fixitnow.dto;

import com.fixitnow.model.DisputeStatus;
import lombok.Data;

@Data
public class DisputeActionRequest {
    private String message;
    private DisputeStatus status;
}
