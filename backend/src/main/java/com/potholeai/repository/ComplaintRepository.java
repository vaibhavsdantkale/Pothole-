package com.potholeai.repository;

import com.potholeai.entity.Complaint;
import com.potholeai.entity.ComplaintStatus;
import com.potholeai.entity.Severity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface ComplaintRepository extends JpaRepository<Complaint, Long> {

    Optional<Complaint> findByComplaintId(String complaintId);

    List<Complaint> findByUserIdOrderByCreatedAtDesc(Long userId);

    List<Complaint> findAllByOrderByCreatedAtDesc();

    long countByStatus(ComplaintStatus status);

    long countBySeverity(Severity severity);

    @Query("SELECT COALESCE(SUM(c.potholeCount), 0) FROM Complaint c")
    long sumTotalPotholes();

    List<Complaint> findTop5ByOrderByCreatedAtDesc();
}
