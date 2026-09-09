package com.capstone.rebyu.assessment.service;

/**
 * A question's text reduced to what makes it the same question.
 *
 * <p>The question bank contains genuine copies: the same wording saved under
 * several ids, mostly from repeated generation runs. Selecting by id alone
 * de-duplicates none of them, so a paper assembled that way can ask a learner
 * the same thing twice under two different ids -- which is what the Active
 * Recall generator was doing.
 *
 * <p>Case and punctuation only, deliberately not fuzzy. Near-duplicate
 * detection already exists for the admin reviewing generated questions, and
 * guessing at similarity here would silently drop a question a learner was
 * meant to be asked. This catches the copies that are genuinely identical,
 * which is what the bank actually contains.
 *
 * <p>Shared rather than duplicated: the adaptive retake selector and the recall
 * generator both have to agree on what "the same question" means, and two
 * implementations of that would drift.
 */
public final class QuestionStem {

    private QuestionStem() {
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
