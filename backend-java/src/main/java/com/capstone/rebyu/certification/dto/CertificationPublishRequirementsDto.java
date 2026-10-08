package com.capstone.rebyu.certification.dto;

import java.util.List;

public record CertificationPublishRequirementsDto(
        boolean publishable,
        List<MissingRequirementDto> missingRequirements,
        List<InvalidRequirementDto> invalidRequirements
) {
    public record MissingRequirementDto(
            String type,
            Long scopeId,
            String title,
            String reason
    ) {
    }

    public record InvalidRequirementDto(
            Long examId,
            String title,
            String reason,
            List<Long> affectedQuestionIds
    ) {
    }
}
