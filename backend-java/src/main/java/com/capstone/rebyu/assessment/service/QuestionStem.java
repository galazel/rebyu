package com.capstone.rebyu.assessment.service;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

/**
 * A question's text reduced to what makes it the same question.
 *
 * <p>The question bank contains genuine copies: the same wording saved under
 * several ids, mostly from repeated generation runs. Selecting by id alone
 * de-duplicates none of them, so a paper assembled that way can ask a learner
 * the same thing twice under two different ids -- which is what the Active
 * Recall generator was doing.
 *
 * <p>Exact copies are not all of it. The bank also holds the same question
 * saved with small edits -- "features, functions, and behaviors" beside
 * "features and behaviors", "what term refers to" beside "what is the term
 * for" -- and a learner sitting both on one paper is being asked the same thing
 * twice whatever the ids say. {@link #sameQuestion} catches those as well.
 *
 * <p>It is kept narrow on purpose, because the cost of guessing wrong is a
 * question the learner was meant to be asked and silently was not. Word
 * overlap decides it, only above a length where one differing word cannot
 * carry the whole question, and only at an overlap where the pairs found are
 * edits of each other rather than questions sharing a topic. See the two
 * constants for what that excludes.
 *
 * <p>Shared rather than duplicated: the adaptive retake selector and the recall
 * generator both have to agree on what "the same question" means, and two
 * implementations of that would drift.
 */
public final class QuestionStem {

    /**
     * Below this many words, two stems must match exactly to count as the same.
     *
     * <p>Short stems are the ones word-overlap gets wrong, and it gets them
     * badly wrong. "What does SCM stand for?" and "What does CRM stand for?"
     * share every word but one and are entirely different questions; so are the
     * four PDCA stems that differ only in naming Plan, Do, Check or Act. A
     * one-word difference carries the whole question when there are only five
     * words, so nothing below this length is compared loosely at all.
     */
    private static final int MIN_TOKENS_FOR_FUZZY = 8;

    /**
     * How much of two longer stems must be shared before they are one question.
     *
     * <p>Set from the bank rather than picked: at this value the pairs it finds
     * are edits of one another -- "features, functions, and behaviors" against
     * "features and behaviors", "what term refers to" against "what is the term
     * for" -- and nothing that merely shares a topic comes near it.
     */
    private static final double DUPLICATE_OVERLAP = 0.85;

    private QuestionStem() {
    }

    /** The distinct words of a stem, for comparing two questions. */
    public static Set<String> tokens(String questionText) {
        String stem = of(questionText);
        if (stem.isEmpty()) {
            return Set.of();
        }
        return new LinkedHashSet<>(Arrays.asList(stem.split(" ")));
    }

    /**
     * Whether two questions are the same question asked twice.
     *
     * <p>Exact stems always match. Beyond that this is deliberately narrow: it
     * catches a question that was saved twice with small edits, which is what
     * repeated generation runs put in the bank, and not two questions that
     * happen to be about one topic.
     */
    public static boolean sameQuestion(String textA, String textB) {
        String stemA = of(textA);
        String stemB = of(textB);
        if (stemA.isEmpty() || stemB.isEmpty()) {
            return false;
        }
        if (stemA.equals(stemB)) {
            return true;
        }
        return sameQuestion(tokens(textA), tokens(textB));
    }

    /** As {@link #sameQuestion(String, String)}, for stems already tokenized. */
    public static boolean sameQuestion(Set<String> tokensA, Set<String> tokensB) {
        if (tokensA.size() < MIN_TOKENS_FOR_FUZZY || tokensB.size() < MIN_TOKENS_FOR_FUZZY) {
            return false;
        }
        Set<String> shared = new LinkedHashSet<>(tokensA);
        shared.retainAll(tokensB);
        if (shared.isEmpty()) {
            return false;
        }
        Set<String> combined = new LinkedHashSet<>(tokensA);
        combined.addAll(tokensB);
        return (double) shared.size() / combined.size() >= DUPLICATE_OVERLAP;
    }

    /** The comparable stem for a question's text; empty string for null. */
    public static String of(String questionText) {
        if (questionText == null) {
            return "";
        }
        StringBuilder cleaned = new StringBuilder(questionText.length());
        for (char character : questionText.toLowerCase().toCharArray()) {
            if (Character.isLetterOrDigit(character)) {
                cleaned.append(character);
            } else if (Character.isWhitespace(character)) {
                cleaned.append(' ');
            }
        }
        String trimmed = cleaned.toString().trim();
        return trimmed.isEmpty() ? "" : String.join(" ", trimmed.split("\\s+"));
    }
}
