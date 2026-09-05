package com.fixitnow.repository;

import com.fixitnow.model.Dispute;
import com.fixitnow.model.DisputeStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface DisputeRepository extends JpaRepository<Dispute, Long> {
    List<Dispute> findByCustomerId(Long customerId);
    List<Dispute> findByProviderId(Long providerId);
    List<Dispute> findByCustomerIdOrderByCreatedAtDesc(Long customerId);
    List<Dispute> findByProviderIdOrderByCreatedAtDesc(Long providerId);
    List<Dispute> findAllByOrderByCreatedAtDesc();
    boolean existsByBookingIdAndStatusIn(Long bookingId, List<DisputeStatus> statuses);
    long countByStatusIn(List<DisputeStatus> statuses);
}
