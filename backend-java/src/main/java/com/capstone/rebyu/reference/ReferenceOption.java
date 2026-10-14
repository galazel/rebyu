package com.capstone.rebyu.reference;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.FetchType;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import jakarta.persistence.UniqueConstraint;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(
        name = "reference_options",
        uniqueConstraints = @UniqueConstraint(name = "uq_reference_option", columnNames = {"kind", "label"}))
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReferenceOption {

    public static final String KIND_PROGRAM = "PROGRAM";
    public static final String KIND_INSTITUTION = "INSTITUTION";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "reference_option_id")
    private Long referenceOptionId;

    @Column(nullable = false, length = 40)
    private String kind;

    @Column(nullable = false, length = 150)
    private String label;

    @Column(name = "sort_order", nullable = false)
    private int sortOrder;

    @Builder.Default
    @Column(nullable = false)
    private boolean active = true;

    @Column(length = 40)
    private String code;

    @Column(length = 500)
    private String description;

    @Column(length = 150)
    private String category;

    @Builder.Default
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(name = "reference_option_certifications",
            joinColumns = @JoinColumn(name = "reference_option_id"))
    @Column(name = "certification_id", nullable = false)
    private java.util.Set<Long> certificationIds = new java.util.LinkedHashSet<>();
}
