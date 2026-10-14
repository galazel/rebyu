package com.capstone.rebyu.reference;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * A certification's departments are Programs reference entries. Filing it under them is what
 * lists it under those departments on the partnership request forms.
 */
@Component
@RequiredArgsConstructor
public class CertificationProgramFiler {

    private final ReferenceOptionRepository options;

    /** Files the certification under exactly these programs. A null or empty list changes nothing. */
    public void file(Long certificationId, List<String> programNames) {
        if (certificationId == null || programNames == null) return;
        Set<String> wanted = programNames.stream()
                .filter(name -> name != null && !name.isBlank())
                .map(name -> name.trim().toLowerCase(Locale.ROOT))
                .collect(Collectors.toSet());
        if (wanted.isEmpty()) return;
        for (ReferenceOption program : options.findByKindOrderBySortOrderAscLabelAsc(ReferenceOption.KIND_PROGRAM)) {
            boolean belongs = wanted.contains(program.getLabel().toLowerCase(Locale.ROOT));
            boolean changed = belongs
                    ? program.getCertificationIds().add(certificationId)
                    : program.getCertificationIds().remove(certificationId);
            if (changed) options.save(program);
        }
    }

    /** The departments a save asked for: the list when given, else the single department. */
    public static List<String> requested(List<String> departments, String department) {
        if (departments != null && !departments.isEmpty()) return departments;
        return department == null ? null : List.of(department);
    }
}
