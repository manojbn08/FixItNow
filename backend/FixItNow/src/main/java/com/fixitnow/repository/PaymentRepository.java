package com.fixitnow.repository;

import com.fixitnow.model.Payment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.math.BigDecimal;
import java.util.List;

@Repository
public interface PaymentRepository extends JpaRepository<Payment, Long> {
    List<Payment> findByCustomerId(Long customerId);
    List<Payment> findByProviderId(Long providerId);
    List<Payment> findByCustomerIdOrderByPaymentDateDesc(Long customerId);
    List<Payment> findByProviderIdOrderByPaymentDateDesc(Long providerId);
    boolean existsByBookingId(Long bookingId);
    long countByProviderId(Long providerId);
    @Query("SELECT COALESCE(SUM(p.amount), 0) FROM Payment p WHERE p.provider.id = :providerId")
    BigDecimal sumAmountByProviderId(@Param("providerId") Long providerId);
}
