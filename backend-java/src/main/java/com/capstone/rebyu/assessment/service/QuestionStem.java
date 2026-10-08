package com.capstone.rebyu.assessment.service;

import java.util.Arrays;
import java.util.LinkedHashSet;
import java.util.Set;

public final class QuestionStem {

    private static final int MIN_TOKENS_FOR_FUZZY = 8;

    private static final double DUPLICATE_OVERLAP = 0.85;

    private static final double INSERTION_OVERLAP = 0.75;

    private static final String NEGATION = "not";

    private QuestionStem() {
    }

    public static Set<String> tokens(String questionText) {
        String stem = of(questionText);
        if (stem.isEmpty()) {
            return Set.of();
        }
        return new LinkedHashSet<>(Arrays.asList(stem.split(" ")));
    }

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

    public static boolean sameQuestion(Set<String> tokensA, Set<String> tokensB) {
        if (tokensA.size() < MIN_TOKENS_FOR_FUZZY || tokensB.size() < MIN_TOKENS_FOR_FUZZY) {
            return false;
        }
        if (tokensA.contains(NEGATION) != tokensB.contains(NEGATION)) {
            return false;
        }
        Set<String> shared = new LinkedHashSet<>(tokensA);
        shared.retainAll(tokensB);
        if (shared.isEmpty()) {
            return false;
        }
        Set<String> combined = new LinkedHashSet<>(tokensA);
        combined.addAll(tokensB);
        double overlap = (double) shared.size() / combined.size();
        if (overlap >= DUPLICATE_OVERLAP) {
            return true;
        }
        boolean insertionOnly = tokensA.containsAll(tokensB) || tokensB.containsAll(tokensA);
        return insertionOnly && overlap >= INSERTION_OVERLAP;
    }

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
