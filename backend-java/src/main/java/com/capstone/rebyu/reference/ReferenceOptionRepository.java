package com.capstone.rebyu.reference;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface ReferenceOptionRepository extends JpaRepository<ReferenceOption, Long> {
    List<ReferenceOption> findByKindAndActiveTrueOrderBySortOrderAscLabelAsc(String kind);
    List<ReferenceOption> findByKindOrderBySortOrderAscLabelAsc(String kind);
    Optional<ReferenceOption> findByKindAndLabelIgnoreCase(String kind, String label);
    long countByKind(String kind);
}
