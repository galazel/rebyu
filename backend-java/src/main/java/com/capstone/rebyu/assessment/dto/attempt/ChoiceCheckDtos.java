package com.capstone.rebyu.assessment.dto.attempt;

import jakarta.validation.constraints.NotNull;

/**
 * Marking one choice answer while the attempt is still open.
 *
 * <p>The browser never decides this. It sends the choice it locked and is told
 * what the server made of it, so the verdict on screen is the same one the
 * paper will be scored with -- the alternative, comparing against a correct
 * flag shipped to the client, would mean the answers were in the page all
 * along for anyone who opened the network tab.
 */
public final class ChoiceCheckDtos {

    private ChoiceCheckDtos() {
    }

    public record ChoiceCheckRequestDto(
            @NotNull Long learnerId,
            @NotNull Long selectedChoiceId
    ) {
    }

    /**
     * What the learner is allowed to see about that answer.
     *
     * <p>{@code correct} is always answered -- they locked it, so being told
     * whether it stood is theirs to know. {@code correctChoiceId} and
     * {@code explanation} are held back unless the exam releases answers
     * ({@code Exam.effectiveReleaseAnswers}), the same gate the result page
     * reads: an exam that does not show its answers afterwards must not hand
     * them out mid-paper either.
     */
    public record ChoiceCheckResultDto(
            boolean correct,
            Long correctChoiceId,
            String explanation,
            boolean answersReleased
    ) {
    }
}
