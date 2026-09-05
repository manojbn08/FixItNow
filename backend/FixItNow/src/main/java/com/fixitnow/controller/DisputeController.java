package com.fixitnow.controller;

import com.fixitnow.dto.ApiResponse;
import com.fixitnow.dto.DisputeActionRequest;
import com.fixitnow.dto.DisputeDTO;
import com.fixitnow.dto.DisputeRequest;
import com.fixitnow.model.Booking;
import com.fixitnow.model.Dispute;
import com.fixitnow.model.DisputeStatus;
import com.fixitnow.model.User;
import com.fixitnow.repository.BookingRepository;
import com.fixitnow.repository.DisputeRepository;
import com.fixitnow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/disputes")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class DisputeController {

    private final DisputeRepository disputeRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @PostMapping("/raise")
    @PreAuthorize("hasAuthority('CUSTOMER')")
    public ResponseEntity<ApiResponse<DisputeDTO>> raiseDispute(
            @RequestBody DisputeRequest request,
            Principal principal) {

        if (request == null || request.getBookingId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Booking ID is required"));
        }
        if (request.getIssueDescription() == null || request.getIssueDescription().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Issue description is required"));
        }

        User customer = getCurrentUser(principal);
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You can only raise disputes for your own bookings"));
        }

        boolean activeDisputeExists = disputeRepository.existsByBookingIdAndStatusIn(
                booking.getId(),
                List.of(
                        DisputeStatus.OPEN,
                        DisputeStatus.UNDER_REVIEW,
                        DisputeStatus.PROVIDER_RESPONDED,
                        DisputeStatus.ESCALATED,
                        DisputeStatus.REFUND_IN_PROGRESS
                )
        );
        if (activeDisputeExists) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("An active dispute already exists for this booking"));
        }

        Dispute dispute = Dispute.builder()
                .booking(booking)
                .customer(booking.getCustomer())
                .provider(booking.getProvider())
                .issueDescription(request.getIssueDescription().trim())
                .status(DisputeStatus.OPEN)
                .build();

        Dispute saved = disputeRepository.save(dispute);
        return ResponseEntity.ok(ApiResponse.success("Dispute raised successfully", toDto(saved)));
    }

    @GetMapping("/customer/{id}")
    @PreAuthorize("hasAuthority('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<DisputeDTO>>> getCustomerDisputes(
            @PathVariable Long id,
            Principal principal) {
        User customer = getCurrentUser(principal);
        if (!customer.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not allowed to view other customers' disputes"));
        }

        List<DisputeDTO> result = disputeRepository.findByCustomerIdOrderByCreatedAtDesc(id)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Customer disputes fetched", result));
    }

    @GetMapping("/provider/{id}")
    @PreAuthorize("hasAuthority('PROVIDER')")
    public ResponseEntity<ApiResponse<List<DisputeDTO>>> getProviderDisputes(
            @PathVariable Long id,
            Principal principal) {
        User provider = getCurrentUser(principal);
        if (!provider.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not allowed to view other providers' disputes"));
        }

        List<DisputeDTO> result = disputeRepository.findByProviderIdOrderByCreatedAtDesc(id)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Provider disputes fetched", result));
    }

    @GetMapping("/all")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<List<DisputeDTO>>> getAllDisputes() {
        List<DisputeDTO> result = disputeRepository.findAllByOrderByCreatedAtDesc()
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("All disputes fetched", result));
    }

    @PutMapping("/{id}/respond")
    @PreAuthorize("hasAuthority('PROVIDER')")
    public ResponseEntity<ApiResponse<DisputeDTO>> respondToDispute(
            @PathVariable Long id,
            @RequestBody DisputeActionRequest request,
            Principal principal) {

        if (request == null || request.getMessage() == null || request.getMessage().trim().isEmpty()) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Provider response is required"));
        }

        User provider = getCurrentUser(principal);
        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));

        if (!dispute.getProvider().getId().equals(provider.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not allowed to respond to this dispute"));
        }

        dispute.setProviderResponse(request.getMessage().trim());
        dispute.setStatus(request.getStatus() != null ? request.getStatus() : DisputeStatus.PROVIDER_RESPONDED);
        Dispute saved = disputeRepository.save(dispute);

        return ResponseEntity.ok(ApiResponse.success("Provider response submitted", toDto(saved)));
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAuthority('ADMIN')")
    public ResponseEntity<ApiResponse<DisputeDTO>> resolveDispute(
            @PathVariable Long id,
            @RequestBody(required = false) DisputeActionRequest request) {

        Dispute dispute = disputeRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("Dispute not found"));

        if (request != null && request.getMessage() != null && !request.getMessage().trim().isEmpty()) {
            dispute.setAdminNotes(request.getMessage().trim());
        }
        DisputeStatus nextStatus = request != null && request.getStatus() != null
                ? request.getStatus()
                : DisputeStatus.RESOLVED;
        dispute.setStatus(nextStatus);
        dispute.setResolvedAt(isClosedStatus(nextStatus) ? LocalDateTime.now() : null);

        Dispute saved = disputeRepository.save(dispute);
        return ResponseEntity.ok(ApiResponse.success("Dispute status updated", toDto(saved)));
    }

    private boolean isClosedStatus(DisputeStatus status) {
        return status == DisputeStatus.RESOLVED
                || status == DisputeStatus.REFUNDED
                || status == DisputeStatus.REJECTED;
    }

    private User getCurrentUser(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new RuntimeException("User principal not found");
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private DisputeDTO toDto(Dispute dispute) {
        Booking booking = dispute.getBooking();
        BigDecimal bookingAmount = booking != null && booking.getService() != null && booking.getService().getPrice() != null
                ? booking.getService().getPrice()
                : BigDecimal.ZERO;

        return DisputeDTO.builder()
                .id(dispute.getId())
                .bookingId(booking != null ? booking.getId() : null)
                .serviceCategory(booking != null && booking.getService() != null ? booking.getService().getCategory() : "")
                .serviceSubcategory(booking != null && booking.getService() != null ? booking.getService().getSubcategory() : "")
                .bookingAmount(bookingAmount)
                .bookingDate(booking != null ? booking.getBookingDate() : null)
                .bookingTimeSlot(booking != null ? booking.getTimeSlot() : null)
                .customerId(dispute.getCustomer() != null ? dispute.getCustomer().getId() : null)
                .customerName(dispute.getCustomer() != null ? dispute.getCustomer().getName() : "")
                .customerEmail(dispute.getCustomer() != null ? dispute.getCustomer().getEmail() : "")
                .providerId(dispute.getProvider() != null ? dispute.getProvider().getId() : null)
                .providerName(dispute.getProvider() != null ? dispute.getProvider().getName() : "")
                .providerEmail(dispute.getProvider() != null ? dispute.getProvider().getEmail() : "")
                .issueDescription(dispute.getIssueDescription())
                .providerResponse(dispute.getProviderResponse())
                .adminNotes(dispute.getAdminNotes())
                .status(dispute.getStatus())
                .resolvedAt(dispute.getResolvedAt())
                .createdAt(dispute.getCreatedAt())
                .updatedAt(dispute.getUpdatedAt())
                .build();
    }
}
