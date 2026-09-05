package com.fixitnow.controller;

import com.fixitnow.dto.AnalyticsDTO;
import com.fixitnow.dto.ApiResponse;
import com.fixitnow.dto.UserInfoDTO;
import com.fixitnow.model.ApprovalStatus;
import com.fixitnow.model.Booking;
import com.fixitnow.model.BookingStatus;
import com.fixitnow.model.DisputeStatus;
import com.fixitnow.model.Payment;
import com.fixitnow.model.Review;
import com.fixitnow.model.User;
import com.fixitnow.model.UserRole;
import com.fixitnow.repository.BookingRepository;
import com.fixitnow.repository.DisputeRepository;
import com.fixitnow.repository.PaymentRepository;
import com.fixitnow.repository.ReviewRepository;
import com.fixitnow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Slf4j
@RestController
@RequestMapping("/admin")
@CrossOrigin(origins = "*", maxAge = 3600)
@PreAuthorize("hasAuthority('ADMIN')")
@RequiredArgsConstructor
public class AdminController {

    private final UserRepository userRepository;
    private final BookingRepository bookingRepository;
    private final ReviewRepository reviewRepository;
    private final PaymentRepository paymentRepository;
    private final DisputeRepository disputeRepository;

    @GetMapping("/providers/pending")
    public ResponseEntity<ApiResponse<List<UserInfoDTO>>> getPendingProviders() {
        List<UserInfoDTO> pending = userRepository
                .findByRoleAndApprovalStatus(UserRole.PROVIDER, ApprovalStatus.PENDING)
                .stream()
                .map(this::toUserInfo)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Pending providers fetched", pending));
    }

    @GetMapping("/providers/all")
    public ResponseEntity<ApiResponse<List<UserInfoDTO>>> getAllProviders() {
        List<UserInfoDTO> all = userRepository
                .findByRole(UserRole.PROVIDER)
                .stream()
                .map(this::toUserInfo)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("All providers fetched", all));
    }

    @PutMapping("/providers/{id}/approve")
    public ResponseEntity<ApiResponse<UserInfoDTO>> approveProvider(@PathVariable Long id) {
        return updateProviderStatus(id, ApprovalStatus.APPROVED);
    }

    @PutMapping("/providers/{id}/hold")
    public ResponseEntity<ApiResponse<UserInfoDTO>> holdProvider(@PathVariable Long id) {
        return updateProviderStatus(id, ApprovalStatus.ON_HOLD);
    }

    @PutMapping("/providers/{id}/reject")
    public ResponseEntity<ApiResponse<UserInfoDTO>> rejectProvider(@PathVariable Long id) {
        return updateProviderStatus(id, ApprovalStatus.PENDING);
    }

    @GetMapping("/analytics")
    public ResponseEntity<ApiResponse<AnalyticsDTO>> getPlatformAnalytics() {
        List<Booking> allBookings = bookingRepository.findAll();
        List<Review> allReviews = reviewRepository.findAll();
        List<Payment> allPayments = paymentRepository.findAll();
        List<User> allProviders = userRepository.findByRole(UserRole.PROVIDER);

        Map<String, Long> serviceCounts = allBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> {
                            if (booking.getService() == null) return "Unknown";
                            String subcategory = safeText(booking.getService().getSubcategory());
                            if (!subcategory.isBlank()) return subcategory;
                            return safeText(booking.getService().getCategory(), "Unknown");
                        },
                        Collectors.counting()
                ));

        Map<String, Long> providerSolvedCounts = allBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.COMPLETED || booking.getStatus() == BookingStatus.PAID)
                .collect(Collectors.groupingBy(
                        booking -> booking.getProvider() != null
                                ? safeText(booking.getProvider().getName(), "Unknown")
                                : "Unknown",
                        Collectors.counting()
                ));

        Map<String, Long> locationCounts = allBookings.stream()
                .collect(Collectors.groupingBy(
                        booking -> {
                            if (booking.getCustomer() != null) {
                                String customerLocation = safeText(booking.getCustomer().getLocation());
                                if (!customerLocation.isBlank()) return customerLocation;
                            }
                            if (booking.getService() != null) {
                                String serviceLocation = safeText(booking.getService().getLocation());
                                if (!serviceLocation.isBlank()) return serviceLocation;
                            }
                            return "Unknown";
                        },
                        Collectors.counting()
                ));

        Map<String, BigDecimal> providerRatings = allReviews.stream()
                .collect(Collectors.groupingBy(
                        review -> review.getProvider() != null
                                ? safeText(review.getProvider().getName(), "Unknown")
                                : "Unknown",
                        Collectors.collectingAndThen(
                                Collectors.averagingDouble(review -> review.getRating() != null ? review.getRating() : 0.0),
                                avg -> BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP)
                        )
                ));

        Map<String, BigDecimal> providerEarnings = allPayments.stream()
                .collect(Collectors.groupingBy(
                        payment -> payment.getProvider() != null
                                ? safeText(payment.getProvider().getName(), "Unknown")
                                : "Unknown",
                        Collectors.reducing(
                                BigDecimal.ZERO,
                                payment -> payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO,
                                BigDecimal::add
                        )
                ));

        BigDecimal totalRevenue = allPayments.stream()
                .map(payment -> payment.getAmount() != null ? payment.getAmount() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        BigDecimal totalProviderWalletBalance = allProviders.stream()
                .map(provider -> provider.getWalletBalance() != null ? provider.getWalletBalance() : BigDecimal.ZERO)
                .reduce(BigDecimal.ZERO, BigDecimal::add);

        long openDisputesCount = disputeRepository.countByStatusIn(List.of(
                DisputeStatus.OPEN,
                DisputeStatus.UNDER_REVIEW,
                DisputeStatus.PROVIDER_RESPONDED,
                DisputeStatus.ESCALATED,
                DisputeStatus.REFUND_IN_PROGRESS
        ));

        long totalPaidBookings = allBookings.stream()
                .filter(booking -> booking.getStatus() == BookingStatus.PAID)
                .count();

        long pendingProviderVerifications = allProviders.stream()
                .filter(provider -> provider.getApprovalStatus() != ApprovalStatus.APPROVED)
                .count();

        AnalyticsDTO dto = AnalyticsDTO.builder()
                .mostBookedServices(toTopList(serviceCounts, 6))
                .topProvidersByRating(toTopList(providerRatings, 6))
                .topProvidersByJobs(toTopList(providerSolvedCounts, 6))
                .topProvidersByProblemsSolved(toTopList(providerSolvedCounts, 6))
                .topEarningProviders(toTopList(providerEarnings, 6))
                .locationTrends(toTopList(locationCounts, 6))
                .totalRevenue(totalRevenue)
                .totalProviderWalletBalance(totalProviderWalletBalance)
                .openDisputesCount(openDisputesCount)
                .totalPaidBookings(totalPaidBookings)
                .pendingProviderVerifications(pendingProviderVerifications)
                .build();

        return ResponseEntity.ok(ApiResponse.success("Analytics fetched successfully", dto));
    }

    private ResponseEntity<ApiResponse<UserInfoDTO>> updateProviderStatus(
            Long id, ApprovalStatus newStatus) {

        User user = userRepository.findById(id).orElse(null);
        if (user == null) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(ApiResponse.error("Provider not found with id: " + id));
        }

        if (user.getRole() != UserRole.PROVIDER) {
            return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                    .body(ApiResponse.error("User is not a provider"));
        }

        user.setApprovalStatus(newStatus);
        userRepository.save(user);
        log.info("Provider {} approval status updated to {}", user.getEmail(), newStatus);

        return ResponseEntity.ok(
                ApiResponse.success("Provider status updated to " + newStatus, toUserInfo(user)));
    }

    private UserInfoDTO toUserInfo(User user) {
        return UserInfoDTO.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole())
                .approvalStatus(user.getApprovalStatus())
                .location(user.getLocation())
                .phone(user.getPhone())
                .serviceType(user.getServiceType())
                .idProofType(user.getIdProofType())
                .idProofDocumentName(user.getIdProofDocumentName())
                .walletBalance(user.getWalletBalance())
                .createdAt(user.getCreatedAt())
                .isActive(user.getIsActive())
                .build();
    }

    private String safeText(String value) {
        return value == null ? "" : value.trim();
    }

    private String safeText(String value, String fallback) {
        String normalized = safeText(value);
        return normalized.isBlank() ? fallback : normalized;
    }

    private <T extends Number> List<Map<String, Object>> toTopList(Map<String, T> source, int limit) {
        return source.entrySet().stream()
                .sorted((left, right) -> {
                    double rightValue = right.getValue() != null ? right.getValue().doubleValue() : 0.0;
                    double leftValue = left.getValue() != null ? left.getValue().doubleValue() : 0.0;
                    return Double.compare(rightValue, leftValue);
                })
                .limit(limit)
                .map(entry -> {
                    Map<String, Object> map = new HashMap<>();
                    map.put("name", entry.getKey());
                    map.put("value", entry.getValue());
                    return map;
                })
                .collect(Collectors.toList());
    }
}
