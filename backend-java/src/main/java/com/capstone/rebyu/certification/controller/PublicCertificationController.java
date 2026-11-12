package com.capstone.rebyu.certification.controller;

import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Comparator;
import java.util.List;

/**
 * The certification catalog an anonymous visitor may see: what the public
 * institution request-access form offers. Only published and coming-soon
 * certifications, and only their id, title, description and status.
 */
@RestController
@RequestMapping("/api/public/certifications")
@RequiredArgsConstructor
public class PublicCertificationController {

    private final CertificationRepository certificationRepository;

    public record PublicCertification(
            Long certificationId,
            String title,
            String description,
            Certification.CertificationStatus status) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<PublicCertification> catalog() {
        return certificationRepository.findAll().stream()
                .filter(c -> c.getStatus() == Certification.CertificationStatus.PUBLISHED
                        || c.getStatus() == Certification.CertificationStatus.COMING_SOON)
                .sorted(Comparator.comparing(Certification::getTitle,
                        Comparator.nullsLast(String.CASE_INSENSITIVE_ORDER)))
                .map(c -> new PublicCertification(
                        c.getCertificationId(), c.getTitle(), c.getDescription(), c.getStatus()))
                .toList();
    }
}
