package com.fixitnow.dto;

import com.fixitnow.model.ApprovalStatus;
import com.fixitnow.model.UserRole;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;
import java.math.BigDecimal;

@NoArgsConstructor
@AllArgsConstructor
@Builder
@Getter
@Setter
public class UserInfoDTO {

    private Long id;
    private String name;
    private String email;
    private UserRole role;
    private ApprovalStatus approvalStatus;
    private String location;
    private String phone;
    private String serviceType;
    private String idProofType;
    private String idProofDocumentName;
    private BigDecimal walletBalance;
    private LocalDateTime createdAt;
    private Boolean isActive;
}
