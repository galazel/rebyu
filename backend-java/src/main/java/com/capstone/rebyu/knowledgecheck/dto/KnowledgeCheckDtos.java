package com.capstone.rebyu.knowledgecheck.dto;

import java.util.List;

public final class KnowledgeCheckDtos {

    private KnowledgeCheckDtos() {}

    public record CheckOffer(
            boolean available,
            String reason,
            Long examId,
            int itemCount,
            List<String> lessonNames
    ) {
        public static CheckOffer unavailable(String reason) {
            return new CheckOffer(false, reason, null, 0, List.of());
        }

        public static CheckOffer available(int itemCount, List<String> lessonNames) {
            return new CheckOffer(true, null, null, itemCount, lessonNames);
        }

        public static CheckOffer minted(Long examId, int itemCount, List<String> lessonNames) {
            return new CheckOffer(true, null, examId, itemCount, lessonNames);
        }
    }

    public record CheckKeyItem(
            Long questionId,
            Long correctChoiceId,
            String correctChoiceText,
            List<String> acceptedAnswers,
            String explanation
    ) {
    }
}
