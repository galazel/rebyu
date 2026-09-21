package com.capstone.rebyu.department.entity;

import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "departments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Department {

    public enum Status {
        active, archived
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long departmentId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_id", nullable = false)
    private Institution institution;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_cert_id", nullable = false)
    private InstitutionCertificate institutionCert;

    @Column(name = "department_name", nullable = false, length = 150)
    private String departmentName;

    @Column(name = "department_description", length = 500)
    private String departmentDescription;

    // A sub-allocation carved out of (and capped by) the org cert's own
    // totalSlots -- the group's own leader can only invite learners up to
    // this limit, not the whole certification allocation's remaining pool.
    @Column(name = "total_slots", nullable = false)
    private Integer totalSlots = 0;

    @Column(name = "used_slots", nullable = false)
    private Integer usedSlots = 0;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by", nullable = false)
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    private Status status = Status.active;
}
