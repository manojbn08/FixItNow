package com.fixitnow.controller;

import com.fixitnow.dto.ApiResponse;
import com.fixitnow.dto.PaymentDTO;
import com.fixitnow.dto.PaymentRequest;
import com.fixitnow.model.Booking;
import com.fixitnow.model.BookingStatus;
import com.fixitnow.model.Payment;
import com.fixitnow.model.User;
import com.fixitnow.model.UserRole;
import com.fixitnow.repository.BookingRepository;
import com.fixitnow.repository.PaymentRepository;
import com.fixitnow.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.math.BigDecimal;
import java.security.Principal;
import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/payments")
@CrossOrigin(origins = "*", maxAge = 3600)
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;

    @PostMapping("/pay")
    @PreAuthorize("hasAuthority('CUSTOMER')")
    @Transactional
    public ResponseEntity<ApiResponse<PaymentDTO>> processPayment(
            @RequestBody PaymentRequest request,
            Principal principal) {

        if (request == null || request.getBookingId() == null) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Booking ID is required"));
        }
        if (request.getAmount() == null || request.getAmount().compareTo(BigDecimal.ZERO) <= 0) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Payment amount must be greater than zero"));
        }

        User customer = getCurrentUser(principal);
        Booking booking = bookingRepository.findById(request.getBookingId())
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (!booking.getCustomer().getId().equals(customer.getId())) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("You can only pay for your own booking"));
        }

        if (booking.getStatus() != BookingStatus.COMPLETED && booking.getStatus() != BookingStatus.PAID) {
            return ResponseEntity.badRequest()
                    .body(ApiResponse.error("Payment is allowed only after provider marks booking as completed"));
        }

        if (paymentRepository.existsByBookingId(booking.getId()) || booking.getStatus() == BookingStatus.PAID) {
            return ResponseEntity.badRequest().body(ApiResponse.error("Booking has already been paid"));
        }

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(request.getAmount())
                .customer(booking.getCustomer())
                .provider(booking.getProvider())
                .build();
        Payment savedPayment = paymentRepository.save(payment);

        booking.setStatus(BookingStatus.PAID);
        bookingRepository.save(booking);

        User provider = booking.getProvider();
        if (provider.getWalletBalance() == null) {
            provider.setWalletBalance(BigDecimal.ZERO);
        }
        provider.setWalletBalance(provider.getWalletBalance().add(request.getAmount()));
        userRepository.save(provider);

        return ResponseEntity.ok(ApiResponse.success("Payment processed successfully", toDto(savedPayment)));
    }

    @GetMapping("/provider/{id}")
    @PreAuthorize("hasAuthority('PROVIDER')")
    public ResponseEntity<ApiResponse<List<PaymentDTO>>> getProviderPayments(
            @PathVariable Long id,
            Principal principal) {
        User provider = getCurrentUser(principal);
        if (!provider.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not allowed to view other providers' payment history"));
        }

        List<PaymentDTO> result = paymentRepository.findByProviderIdOrderByPaymentDateDesc(id)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Provider payment history fetched", result));
    }

    @GetMapping("/customer/{id}")
    @PreAuthorize("hasAuthority('CUSTOMER')")
    public ResponseEntity<ApiResponse<List<PaymentDTO>>> getCustomerPayments(
            @PathVariable Long id,
            Principal principal) {
        User customer = getCurrentUser(principal);
        if (!customer.getId().equals(id)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not allowed to view other customers' payment history"));
        }

        List<PaymentDTO> result = paymentRepository.findByCustomerIdOrderByPaymentDateDesc(id)
                .stream()
                .map(this::toDto)
                .collect(Collectors.toList());

        return ResponseEntity.ok(ApiResponse.success("Customer payment history fetched", result));
    }

    @GetMapping("/wallet/{providerId}")
    @PreAuthorize("hasAnyAuthority('PROVIDER','ADMIN')")
    public ResponseEntity<ApiResponse<BigDecimal>> getWalletBalance(
            @PathVariable Long providerId,
            Principal principal) {
        User requester = getCurrentUser(principal);
        if (requester.getRole() == UserRole.PROVIDER && !requester.getId().equals(providerId)) {
            return ResponseEntity.status(HttpStatus.FORBIDDEN)
                    .body(ApiResponse.error("Not allowed to view other providers' wallet balance"));
        }

        User provider = userRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        BigDecimal wallet = provider.getWalletBalance() != null ? provider.getWalletBalance() : BigDecimal.ZERO;
        return ResponseEntity.ok(ApiResponse.success("Provider wallet balance fetched", wallet));
    }

    private User getCurrentUser(Principal principal) {
        if (principal == null || principal.getName() == null || principal.getName().isBlank()) {
            throw new RuntimeException("User principal not found");
        }
        return userRepository.findByEmail(principal.getName())
                .orElseThrow(() -> new RuntimeException("Authenticated user not found"));
    }

    private PaymentDTO toDto(Payment payment) {
        Booking booking = payment.getBooking();
        return PaymentDTO.builder()
                .id(payment.getId())
                .bookingId(booking != null ? booking.getId() : null)
                .serviceCategory(booking != null && booking.getService() != null ? booking.getService().getCategory() : "")
                .serviceSubcategory(booking != null && booking.getService() != null ? booking.getService().getSubcategory() : "")
                .customerId(payment.getCustomer() != null ? payment.getCustomer().getId() : null)
                .customerName(payment.getCustomer() != null ? payment.getCustomer().getName() : "")
                .customerEmail(payment.getCustomer() != null ? payment.getCustomer().getEmail() : "")
                .providerId(payment.getProvider() != null ? payment.getProvider().getId() : null)
                .providerName(payment.getProvider() != null ? payment.getProvider().getName() : "")
                .providerEmail(payment.getProvider() != null ? payment.getProvider().getEmail() : "")
                .amount(payment.getAmount())
                .paymentDate(payment.getPaymentDate())
                .build();
    }
}
