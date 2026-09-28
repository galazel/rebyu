package com.capstone.rebyu.learningtools.service;

import java.util.Collection;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Naming for the sets the tutor generates.
 *
 * <p>The tutor names what it writes, and asked twice about one lesson it
 * reasonably answers "{lesson} Quiz" both times -- so a learner's library
 * filled with rows identical in every column but the row itself, and the only
 * way to tell which was which was to open them.
 *
 * <p>Shared between the two creation paths because quizzes become
 * {@code Exam}s and flashcards become {@code GeneratedStudySet}s, in different
 * services against different tables. The rule is the same either side, and it
 * is the rule a learner sees, so it lives in one place rather than being
 * written twice and drifting.
 */
final class GeneratedTitles {

    private GeneratedTitles() {
    }

    /**
     * {@code base} if the learner has not used it here yet, otherwise the
     * first free "{base} (n)".
     *
     * <p>Numbered rather than dated because a learner generating twice is
     * usually generating twice in the same sitting, and two rows stamped with
     * the same day distinguish nothing. The first set keeps the plain title:
     * a learner who generates once should never see a number.
     *
     * <p>The search runs past the count of what exists, so deleting the second
     * of three cannot hand the next generation a name still on the shelf.
     */
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
        // Unreachable while the loop runs past the number of names in use, but
        // a title is required and returning null here would fail the insert.
        return base + " (" + (taken.size() + 3) + ")";
    }
}
