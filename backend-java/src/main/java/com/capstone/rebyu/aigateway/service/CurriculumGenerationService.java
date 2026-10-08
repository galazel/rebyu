package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.entity.GenerationRequest;
import com.capstone.rebyu.aigateway.entity.KnowledgeDocument;
import com.capstone.rebyu.aigateway.repository.GenerationRequestRepository;
import com.capstone.rebyu.certification.dto.CertificationDto;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.certification.entity.Lesson;
import com.capstone.rebyu.certification.entity.MajorCategory;
import com.capstone.rebyu.certification.entity.MiddleCategory;
import com.capstone.rebyu.certification.mapper.CertificationMapper;
import com.capstone.rebyu.certification.repository.CertificationRepository;
import com.capstone.rebyu.certification.repository.LessonRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
public class CurriculumGenerationService {

    record LessonCtx(Long lessonId, String lessonTitle, String midTitle, String majorTitle, String certTitle) {}

    private final CertificationRepository certificationRepository;
    private final LessonRepository lessonRepository;
    private final DocumentIngestionService documentIngestionService;
    private final CertificationMapper certificationMapper;
    private final AiUploadValidator aiUploadValidator;
    private final GenerationRequestRepository generationRequestRepository;
    private final GenerationRequestProducer generationRequestProducer;
    private final ObjectMapper objectMapper;

    @Autowired @Lazy
    private CurriculumGenerationService self;

    public CurriculumGenerationService(
            CertificationRepository certificationRepository,
            LessonRepository lessonRepository,
            DocumentIngestionService documentIngestionService,
            CertificationMapper certificationMapper,
            AiUploadValidator aiUploadValidator,
            GenerationRequestRepository generationRequestRepository,
            GenerationRequestProducer generationRequestProducer,
            ObjectMapper objectMapper
    ) {
        this.certificationRepository = certificationRepository;
        this.lessonRepository = lessonRepository;
        this.documentIngestionService = documentIngestionService;
        this.certificationMapper = certificationMapper;
        this.aiUploadValidator = aiUploadValidator;
        this.generationRequestRepository = generationRequestRepository;
        this.generationRequestProducer = generationRequestProducer;
        this.objectMapper = objectMapper;
    }

    @Transactional
    public CertificationDto generateForNewCertification(
            CertificationDto dto,
            List<MultipartFile> files,
            String additionalInstructions,
            Long triggeredByUserId,
            String reviewMode,
            List<String> questionTypes,
            Integer questionBankSize,
            Integer lessonCount
    ) throws IOException {
        aiUploadValidator.validate(files);

        String documentContent = extractText(files);
        aiUploadValidator.requireReadableText(documentContent);

        Long certificationId = self.createBareCertification(dto);
        log.info("Created certification {} (structure pending async generation)", certificationId);

        GenerationRequest request = recordGenerationRequest(
                certificationId, GenerationRequest.RequestType.CERTIFICATION, additionalInstructions,
                triggeredByUserId, reviewMode, MODE_REPLACE, questionTypes, questionBankSize,
                lessonCount);
        publishAfterCommit(request.getGenerationRequestId(), certificationId);

        ingestFiles(files, certificationId);

        return self.fetchCertificationDto(certificationId);
    }

    @Transactional
    public CertificationDto generateForExistingCertification(
            Long certificationId,
            List<MultipartFile> files,
            String additionalInstructions,
            Long triggeredByUserId,
            String reviewMode
    ) throws IOException {
        aiUploadValidator.validate(files);
        self.assertStructureReplaceable(certificationId);

        String documentContent = extractText(files);
        aiUploadValidator.requireReadableText(documentContent);

        self.clearStructure(certificationId);

        GenerationRequest request = recordGenerationRequest(
                certificationId, GenerationRequest.RequestType.CERTIFICATION, additionalInstructions,
                triggeredByUserId, reviewMode);
        publishAfterCommit(request.getGenerationRequestId(), certificationId);

        ingestFiles(files, certificationId);

        return self.fetchCertificationDto(certificationId);
    }

    @Transactional
    public CertificationDto appendToExistingCertification(
            Long certificationId,
            List<MultipartFile> files,
            String additionalInstructions,
            Long triggeredByUserId,
            String reviewMode,
            List<String> questionTypes,
            Integer questionBankSize,
            Integer lessonCount
    ) throws IOException {
        boolean hasFiles = files != null && files.stream().anyMatch(f -> f != null && !f.isEmpty());
        if (hasFiles) {
            aiUploadValidator.validate(files);
            String documentContent = extractText(files);
            aiUploadValidator.requireReadableText(documentContent);
        } else if (additionalInstructions == null || additionalInstructions.isBlank()) {
            throw new IllegalArgumentException(
                    "Upload documents, or say what to add -- for example, which domain or topics.");
        }

        GenerationRequest request = recordGenerationRequest(
                certificationId, GenerationRequest.RequestType.CERTIFICATION, additionalInstructions,
                triggeredByUserId, reviewMode, MODE_APPEND, questionTypes, questionBankSize,
                lessonCount);
        publishAfterCommit(request.getGenerationRequestId(), certificationId);

        if (hasFiles) {
            ingestFiles(files, certificationId);
        }

        log.info("Append generation queued for certification {}", certificationId);
        return self.fetchCertificationDto(certificationId);
    }

    private void publishAfterCommit(Long generationRequestId, Long certificationId) {
        if (!TransactionSynchronizationManager.isSynchronizationActive()) {
            generationRequestProducer.publishCertificationGenerationRequested(
                    generationRequestId, certificationId);
            return;
        }
        TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
            @Override
            public void afterCommit() {
                generationRequestProducer.publishCertificationGenerationRequested(
                        generationRequestId, certificationId);
            }
        });
    }

    @Transactional(readOnly = true)
    public void assertStructureReplaceable(Long certificationId) {
        List<Lesson> lessons = lessonRepository
                .findByMiddleCategory_MajorCategory_Certification_CertificationIdAndMiddleCategory_MajorCategory_OwnerDepartmentIsNull(
                        certificationId);

        for (Lesson lesson : lessons) {
            String structure = lesson.getLessonComponentStructure();
            boolean hasContent = structure != null && !structure.isBlank() && !"[]".equals(structure.trim());
            boolean hasQuestions = lesson.getQuestionSet() != null && !lesson.getQuestionSet().isEmpty();

            if (hasContent || hasQuestions) {
                throw new IllegalStateException(
                        "This certification already has lesson content or questions. "
                                + "Generating a new structure would destroy existing data. "
                                + "Edit the structure manually instead."
                );
            }
        }
    }

    @Transactional
    public Long createBareCertification(CertificationDto dto) {
        Certification certification = certificationMapper.toEntity(dto);
        certification.setCertificationId(null);
        certification.setDateCreated(LocalDateTime.now());
        certification.setDateUpdated(null);
        certification.setMajorCategory(new ArrayList<>());

        Certification saved = certificationRepository.save(certification);
        return saved.getCertificationId();
    }

    @Transactional
    public void clearStructure(Long certificationId) {
        Certification cert = certificationRepository.findById(certificationId)
                .orElseThrow(() -> new EntityNotFoundException("Certification not found: " + certificationId));

        cert.getMajorCategory().clear();
        cert.setDateUpdated(LocalDateTime.now());
        certificationRepository.save(cert);
    }

    @Transactional
    public void saveLessonContent(Long lessonId, String contentJson) {
        Lesson lesson = lessonRepository.findById(lessonId)
                .orElseThrow(() -> new EntityNotFoundException("Lesson not found: " + lessonId));
        lesson.setLessonComponentStructure(contentJson);
        lessonRepository.save(lesson);
    }

    @Transactional(readOnly = true)
    public CertificationDto fetchCertificationDto(Long certificationId) {
        Certification cert = certificationRepository.findByIdWithFullTree(certificationId)
                .orElseThrow(() -> new EntityNotFoundException("Certification not found: " + certificationId));
        return certificationMapper.toDto(cert);
    }

    @Transactional(readOnly = true)
    public List<LessonCtx> loadLessonContexts(Long certificationId) {
        List<LessonCtx> contexts = new ArrayList<>();
        for (Lesson lesson : lessonRepository
                .findByMiddleCategory_MajorCategory_Certification_CertificationIdAndMiddleCategory_MajorCategory_OwnerDepartmentIsNull(
                        certificationId)) {
            String structure = lesson.getLessonComponentStructure();
            boolean isEmpty = structure == null || structure.isBlank() || "[]".equals(structure.trim());
            if (!isEmpty) {
                continue;
            }
            MiddleCategory mid = lesson.getMiddleCategory();
            MajorCategory major = mid.getMajorCategory();
            contexts.add(new LessonCtx(
                    lesson.getLessonId(),
                    lesson.getName(),
                    mid.getTitle(),
                    major.getTitle(),
                    major.getCertification() != null ? major.getCertification().getTitle() : ""
            ));
        }
        return contexts;
    }

    private String normalizeReviewMode(String reviewMode) {
        return reviewMode != null && "auto".equalsIgnoreCase(reviewMode.trim()) ? "auto" : "guided";
    }

    private GenerationRequest recordGenerationRequest(
            Long certificationId, GenerationRequest.RequestType type, String additionalInstructions,
            Long triggeredByUserId, String reviewMode) {
        return recordGenerationRequest(
                certificationId, type, additionalInstructions, triggeredByUserId, reviewMode,
                MODE_REPLACE, null, null, null);
    }

    private GenerationRequest recordGenerationRequest(
            Long certificationId, GenerationRequest.RequestType type, String additionalInstructions,
            Long triggeredByUserId, String reviewMode, String mode) {
        return recordGenerationRequest(
                certificationId, type, additionalInstructions, triggeredByUserId, reviewMode, mode,
                null, null, null);
    }

    static final String MODE_REPLACE = "replace";

    static final String MODE_APPEND = "append";

    private GenerationRequest recordGenerationRequest(
            Long certificationId, GenerationRequest.RequestType type, String additionalInstructions,
            Long triggeredByUserId, String reviewMode, String mode, List<String> questionTypes,
            Integer questionBankSize, Integer lessonCount) {
        String paramsJson;
        try {
            paramsJson = objectMapper.writeValueAsString(Map.of(
                    "additionalInstructions", additionalInstructions == null ? "" : additionalInstructions,
                    "reviewMode", normalizeReviewMode(reviewMode),
                    "mode", mode,
                    "questionTypes", questionTypes == null ? List.of() : questionTypes,
                    "questionBankSize", questionBankSize == null ? "" : questionBankSize,
                    "lessonCount", lessonCount == null ? "" : lessonCount));
        } catch (Exception e) {
            paramsJson = null;
        }
        return generationRequestRepository.save(GenerationRequest.builder()
                .certificationId(certificationId)
                .requestType(type)
                .paramsJson(paramsJson)
                .status(GenerationRequest.Status.PENDING)
                .triggeredByUserId(triggeredByUserId)
                .createdAt(LocalDateTime.now())
                .build());
    }

    private String extractText(List<MultipartFile> files) throws IOException {
        StringBuilder rawText = new StringBuilder();
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                rawText.append(new String(file.getBytes(), StandardCharsets.UTF_8)).append("\n\n");
            }
        }
        return rawText.toString();
    }

    private void ingestFiles(List<MultipartFile> files, Long certificationId) {
        for (MultipartFile file : files) {
            if (file != null && !file.isEmpty()) {
                try {
                    documentIngestionService.ingest(file, certificationId, KnowledgeDocument.UseCase.LESSON);
                } catch (Exception e) {
                    log.warn("Failed to ingest '{}' for later reference: {}", file.getOriginalFilename(), e.getMessage());
                }
            }
        }
    }
}
