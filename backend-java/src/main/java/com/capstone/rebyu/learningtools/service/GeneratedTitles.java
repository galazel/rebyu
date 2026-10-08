package com.capstone.rebyu.learningtools.service;

import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

final class GeneratedTitles {

    private GeneratedTitles() {
    }

    static String notAlreadyUsed(String base, Collection<String> existingTitles) {
        Set<String> taken = existingTitles.stream()
                .filter(Objects::nonNull)
                .map(String::trim)
                .collect(Collectors.toSet());

        if (!taken.contains(base)) {
            return base;
        }
        for (int suffix = 2; suffix <= taken.size() + 2; suffix++) {
            String candidate = base + " (" + suffix + ")";
            if (!taken.contains(candidate)) {
                return candidate;
            }
        }
        return base + " (" + (taken.size() + 3) + ")";
    }
}
