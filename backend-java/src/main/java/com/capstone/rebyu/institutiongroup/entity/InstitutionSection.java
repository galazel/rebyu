package com.capstone.rebyu.institutiongroup.entity;

import com.capstone.rebyu.user.entity.User;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * A section inside a department (institution group): the department head's
 * own subdivision -- a class, a batch, a block -- that learners are invited
 * into and tracked under. Archiving a section keeps its learners in the
 * department; only the grouping goes.
 */
@Entity
@Table(name = "institution_sections",
        indexes = @Index(name = "ix_institution_sections_group", columnList = "institution_group_id"))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class InstitutionSection {

    public enum Status { active, archived }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "section_id")
    private Long sectionId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "institution_group_id", nullable = false)
    private InstitutionGroup institutionGroup;

    @Column(name = "section_name", nullable = false, length = 150)
    private String sectionName;

    @Column(columnDefinition = "TEXT")
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;

    @Column(name = "created_at", nullable = false)
    private LocalDateTime createdAt;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    @Builder.Default
    private Status status = Status.active;
}
