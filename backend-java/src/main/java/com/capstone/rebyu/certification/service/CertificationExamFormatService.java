package com.capstone.rebyu.certification.service;

import com.capstone.rebyu.certification.dto.ExamFormatDto;
import com.capstone.rebyu.certification.entity.CertificationExamFormat;
import com.capstone.rebyu.certification.entity.CertificationExamSection;
import com.capstone.rebyu.certification.repository.CertificationExamFormatRepository;
import com.capstone.rebyu.certification.repository.CertificationExamSectionRepository;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.Arrays;
import java.util.List;
import java.util.Objects;

/**
 * Reads and edits the real exam format an admin's mock exam is measured
 * against. Generation writes it from the planner's research (origin PLANNER or
 * LOOKUP); an admin's edit is stored as MANUAL, which a later generation run
 * does not overwrite.
 */
@Service
@RequiredArgsConstructor
public class CertificationExamFormatService {

    public static final String ORIGIN_MANUAL = "MANUAL";

    private final CertificationExamFormatRepository formats;
    private final CertificationExamSectionRepository sections;
    private final CertificationRepository certifications;

    @Transactional(readOnly = true)
    public ExamFormatDto get(Long certificationId) {
        requireCertification(certificationId);
        CertificationExamFormat format = formats.findById(certificationId).orElse(null);
        List<ExamFormatDto.Section> parts = sections.findByCertificationIdOrderByDisplayOrderAsc(certificationId)
                .stream()
                .map(s -> new ExamFormatDto.Section(s.getName(), s.getTotalItems(), s.getDurationMinutes(),
                        splitTypes(s.getQuestionTypes())))
                .toList();
        if (format == null) {
            return new ExamFormatDto(null, null, null, List.of(), null, null, null, null, null, parts);
        }
        return new ExamFormatDto(format.getTotalItems(), format.getDurationMinutes(), format.getPassingScore(),
                splitTypes(format.getQuestionTypes()), format.getCoverage(), format.getNotes(),
                format.getSource(), format.getOrigin(), format.getUpdatedAt(), parts);
    }

    @Transactional
    public ExamFormatDto save(Long certificationId, ExamFormatDto dto) {
        requireCertification(certificationId);
        CertificationExamFormat format = formats.findById(certificationId).orElseGet(() -> {
            CertificationExamFormat created = new CertificationExamFormat();
            created.setCertificationId(certificationId);
            return created;
        });
        format.setTotalItems(positive(dto.totalItems()));
        format.setDurationMinutes(positive(dto.durationMinutes()));
        format.setPassingScore(dto.passingScore() == null || dto.passingScore().signum() <= 0
                ? null : dto.passingScore().min(BigDecimal.valueOf(100)));
        format.setQuestionTypes(joinTypes(dto.questionTypes()));
        format.setCoverage(blankToNull(dto.coverage()));
        format.setNotes(blankToNull(dto.notes()));
        format.setSource(truncate(blankToNull(dto.source()), 1000));
        format.setOrigin(ORIGIN_MANUAL);
        format.setUpdatedAt(LocalDateTime.now());
        formats.save(format);

        sections.deleteByCertificationId(certificationId);
        int order = 1;
        for (ExamFormatDto.Section part : dto.sections() == null ? List.<ExamFormatDto.Section>of() : dto.sections()) {
            if (part == null || part.name() == null || part.name().isBlank()) continue;
            CertificationExamSection section = new CertificationExamSection();
            section.setCertificationId(certificationId);
            section.setDisplayOrder(order++);
            section.setName(truncate(part.name().trim(), 200));
            section.setTotalItems(positive(part.totalItems()));
            section.setDurationMinutes(positive(part.durationMinutes()));
            section.setQuestionTypes(joinTypes(part.questionTypes()));
            sections.save(section);
        }
        return get(certificationId);
    }

    private void requireCertification(Long certificationId) {
        if (!certifications.existsById(certificationId)) {
            throw new EntityNotFoundException("Certification not found: " + certificationId);
        }
    }

    private static Integer positive(Integer value) {
        return value == null || value <= 0 ? null : value;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static String truncate(String value, int max) {
        return value == null || value.length() <= max ? value : value.substring(0, max);
    }

    private static List<String> splitTypes(String value) {
        if (value == null || value.isBlank()) return List.of();
        return Arrays.stream(value.split(",")).map(String::trim).filter(s -> !s.isEmpty()).toList();
    }

    private static String joinTypes(List<String> types) {
        if (types == null) return null;
        String joined = String.join(", ", types.stream().filter(Objects::nonNull)
                .map(String::trim).filter(s -> !s.isEmpty()).toList());
        return joined.isEmpty() ? null : truncate(joined, 200);
    }
}
