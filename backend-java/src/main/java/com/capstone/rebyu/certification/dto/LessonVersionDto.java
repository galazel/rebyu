package com.capstone.rebyu.certification.dto;

import java.time.LocalDateTime;

/** {@code lessonComponentStructure} is null in the list and filled when one version is fetched. */
public record LessonVersionDto(
        Long lessonVersionId,
        String savedByName,
        LocalDateTime createdAt,
        String lessonComponentStructure
) {
}
