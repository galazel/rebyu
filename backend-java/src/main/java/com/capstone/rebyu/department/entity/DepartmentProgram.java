package com.capstone.rebyu.department.entity;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/** A degree program (BSIT, BSCS, ...) inside a department; sections belong to one. */
@Entity
@Table(name = "department_programs",
        indexes = @Index(name = "ix_department_programs_department", columnList = "department_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DepartmentProgram {

    public enum Status { active, archived }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "program_id")
    private Long programId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "department_id", nullable = false)
    private Department department;

    /** Certifications this program's sections may take, chosen from the department's institution-provided ones. */
    @ManyToMany(fetch = FetchType.LAZY)
    @JoinTable(name = "department_program_certifications",
            joinColumns = @JoinColumn(name = "program_id"),
            inverseJoinColumns = @JoinColumn(name = "institution_cert_id"))
    @Builder.Default
    @lombok.EqualsAndHashCode.Exclude
    @lombok.ToString.Exclude
    private java.util.Set<com.capstone.rebyu.institution.entity.InstitutionCertificate> institutionCerts = new java.util.LinkedHashSet<>();

    @Column(name = "program_name", nullable = false, length = 150)
    private String programName;

    @Column(name = "program_code", length = 30)
    private String programCode;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.active;
}
