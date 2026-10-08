package com.capstone.rebyu.reference;

import jakarta.persistence.Column;
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

    public static final String KIND_INDUSTRY = "INDUSTRY";
    public static final String KIND_DEPARTMENT = "DEPARTMENT";

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
}
