package com.fixitnow.dto;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class AnalyticsDTO {
    private List<Map<String, Object>> mostBookedServices;
    private List<Map<String, Object>> topProvidersByRating;
    private List<Map<String, Object>> topProvidersByJobs;
    private List<Map<String, Object>> topProvidersByProblemsSolved;
    private List<Map<String, Object>> topEarningProviders;
    private List<Map<String, Object>> locationTrends;
    private java.math.BigDecimal totalRevenue;
    private java.math.BigDecimal totalProviderWalletBalance;
    private Long openDisputesCount;
    private Long totalPaidBookings;
    private Long pendingProviderVerifications;
}
