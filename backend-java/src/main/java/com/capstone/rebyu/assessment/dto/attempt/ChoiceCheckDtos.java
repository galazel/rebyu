package com.capstone.rebyu.assessment.dto.attempt;

import jakarta.validation.constraints.NotNull;

public final class ChoiceCheckDtos {

    private ChoiceCheckDtos() {
    }

    public record ChoiceCheckRequestDto(
            @NotNull Long learnerId,
            @NotNull Long selectedChoiceId
    ) {
    }

    public record ChoiceCheckResultDto(
            boolean correct,
            Long correctChoiceId,
            String explanation,
            boolean answersReleased
    ) {
    }
}
