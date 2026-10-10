package com.capstone.rebyu.certification.dto;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

/**
 * The real certification exam's format, as stored in
 * {@code certification_exam_formats} and {@code certification_exam_sections}.
 * {@code origin} and {@code updatedAt} are set by the server.
 */
public record ExamFormatDto(
        Integer totalItems,
        Integer durationMinutes,
        BigDecimal passingScore,
        List<String> questionTypes,
        String coverage,
        String notes,
        String source,
        String origin,
        LocalDateTime updatedAt,
        List<Section> sections
) {
    public record Section(
            String name,
            Integer totalItems,
            Integer durationMinutes,
            List<String> questionTypes
    ) {
    }
}
