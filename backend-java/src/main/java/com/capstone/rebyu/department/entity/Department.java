package com.capstone.rebyu.department.entity;

import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.ToString;
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

    /** The certifications this department covers: every one the institution holds from the same college. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "department_certifications",
            joinColumns = @JoinColumn(name = "department_id"),
            inverseJoinColumns = @JoinColumn(name = "institution_cert_id"))
    @Builder.Default
    @ToString.Exclude
    @EqualsAndHashCode.Exclude
    private java.util.List<InstitutionCertificate> institutionCerts = new java.util.ArrayList<>();

    public boolean covers(Long institutionCertId) {
        return institutionCertId != null && institutionCerts.stream()
                .anyMatch(cert -> institutionCertId.equals(cert.getInstitutionCertId()));
    }

    /** The covered certification with this certification id, if any. */
    public java.util.Optional<InstitutionCertificate> allocationFor(Long certificationId) {
        return institutionCerts.stream()
                .filter(cert -> cert.getCertification() != null
                        && java.util.Objects.equals(cert.getCertification().getCertificationId(), certificationId))
                .findFirst();
    }

    /** The only covered certification, or null when the department covers none or several. */
    public InstitutionCertificate soleCertification() {
        return institutionCerts.size() == 1 ? institutionCerts.get(0) : null;
    }

    @Column(name = "department_name", nullable = false, length = 150)
    private String departmentName;

    @Column(name = "department_description", length = 500)
    private String departmentDescription;

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
