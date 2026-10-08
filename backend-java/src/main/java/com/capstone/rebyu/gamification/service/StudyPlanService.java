package com.capstone.rebyu.gamification.service;

import com.capstone.rebyu.gamification.entity.StudyPlan;
import com.capstone.rebyu.gamification.entity.StudyPlanTaskStatus;
import com.capstone.rebyu.gamification.repository.StudyPlanRepository;
import com.capstone.rebyu.gamification.repository.StudyPlanTaskStatusRepository;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class StudyPlanService {

  private static final String ACTIVE = "ACTIVE";
  private static final String COMPLETED = "COMPLETED";
  private static final String ABANDONED = "ABANDONED";

  private final StudyPlanRepository planRepository;
  private final StudyPlanTaskStatusRepository taskStatusRepository;
  private final LearnerRepository learnerRepository;
  private final ObjectMapper mapper;

  public record TaskStatusDto(
      Long planId, String eventId, String status,
      LocalDateTime startedAt, LocalDateTime completedAt) {}

  public record SavePlanRequest(Long certificationId, String goal, Map<String, Object> schedule) {}

  public record StudyPlanDto(
      Long planId,
      Long certificationId,
      String goal,
      Map<String, Object> schedule,
      String status,
      LocalDateTime createdAt) {}

  @Transactional
  public StudyPlanDto savePlan(Long learnerId, SavePlanRequest request) {
    Learner learner = learnerRepository.findById(learnerId)
        .orElseThrow(() -> new EntityNotFoundException("Learner not found: " + learnerId));

    List<StudyPlan> superseded = request.certificationId() == null
        ? planRepository.findByLearner_LearnerIdAndCertificationIdIsNullAndStatus(learnerId, ACTIVE)
        : planRepository.findByLearner_LearnerIdAndCertificationIdAndStatus(
            learnerId, request.certificationId(), ACTIVE);

    for (StudyPlan previous : superseded) {
      previous.setStatus(ABANDONED);
      planRepository.save(previous);
    }

    StudyPlan plan = new StudyPlan();
    plan.setLearner(learner);
    plan.setCertificationId(request.certificationId());
    plan.setGoal(request.goal());
    plan.setSchedule(writeSchedule(request.schedule()));
    plan.setStatus(ACTIVE);
    plan.setCreatedAt(LocalDateTime.now());

    StudyPlan saved = planRepository.save(plan);
    log.info("Study plan {} saved for learner {} (certification {})",
        saved.getPlanId(), learnerId, request.certificationId());
    return toDto(saved);
  }

  @Transactional(readOnly = true)
  public StudyPlanDto activePlan(Long learnerId, Long certificationId) {
    return (certificationId == null
        ? planRepository.findFirstByLearner_LearnerIdAndStatusOrderByCreatedAtDesc(learnerId, ACTIVE)
        : planRepository.findFirstByLearner_LearnerIdAndCertificationIdAndStatusOrderByCreatedAtDesc(
            learnerId, certificationId, ACTIVE))
        .map(this::toDto)
        .orElse(null);
  }

  @Transactional(readOnly = true)
  public StudyPlanDto overallPlan(Long learnerId) {
    return planRepository
        .findFirstByLearner_LearnerIdAndCertificationIdIsNullAndStatusOrderByCreatedAtDesc(
            learnerId, ACTIVE)
        .map(this::toDto)
        .orElse(null);
  }

  @Transactional(readOnly = true)
  public List<StudyPlanDto> getUserPlans(Long learnerId) {
    return planRepository.findByLearner_LearnerIdOrderByCreatedAtDesc(learnerId)
        .stream().map(this::toDto).toList();
  }

  @Transactional(readOnly = true)
  public List<TaskStatusDto> taskStatuses(Long learnerId) {
    return taskStatusRepository.findByLearner_LearnerId(learnerId).stream()
        .map(row -> new TaskStatusDto(
            row.getPlan() == null ? null : row.getPlan().getPlanId(),
            row.getEventId(), row.getStatus(), row.getStartedAt(), row.getCompletedAt()))
        .toList();
  }

  @Transactional
  public TaskStatusDto setTaskStatus(Long learnerId, Long planId, String eventId, String status) {
    String normalised = status == null ? "" : status.trim().toUpperCase();
    if (!List.of(StudyPlanTaskStatus.IN_PROGRESS, StudyPlanTaskStatus.COMPLETED,
        StudyPlanTaskStatus.SKIPPED).contains(normalised)) {
      throw new IllegalArgumentException("Unsupported task status: " + status);
    }
    if (eventId == null || eventId.isBlank()) {
      throw new IllegalArgumentException("A task id is required");
    }

    StudyPlan plan = planRepository.findById(planId)
        .orElseThrow(() -> new EntityNotFoundException("Study plan not found: " + planId));

    if (learnerId == null || plan.getLearner() == null
        || !plan.getLearner().getLearnerId().equals(learnerId)) {
      throw new EntityNotFoundException("Study plan not found: " + planId);
    }

    LocalDateTime now = LocalDateTime.now();

    taskStatusRepository.upsertStatus(
        planId,
        plan.getLearner().getLearnerId(),
        eventId,
        normalised,
        StudyPlanTaskStatus.IN_PROGRESS.equals(normalised) ? now : null,
        StudyPlanTaskStatus.COMPLETED.equals(normalised) ? now : null,
        now);

    StudyPlanTaskStatus saved = taskStatusRepository
        .findByPlan_PlanIdAndEventId(planId, eventId)
        .orElseThrow(() -> new IllegalStateException(
            "Task status vanished after upsert: plan " + planId + ", event " + eventId));
    return new TaskStatusDto(planId, saved.getEventId(), saved.getStatus(),
        saved.getStartedAt(), saved.getCompletedAt());
  }

  @Transactional
  public void completePlan(Long planId, Long learnerId) {
    StudyPlan plan = planRepository.findById(planId)
        .orElseThrow(() -> new EntityNotFoundException("Study plan not found: " + planId));
    if (learnerId == null || !plan.getLearner().getLearnerId().equals(learnerId)) {
      throw new EntityNotFoundException("Study plan not found: " + planId);
    }
    plan.setCompletedAt(LocalDateTime.now());
    plan.setStatus(COMPLETED);
    planRepository.save(plan);
  }

  private String writeSchedule(Map<String, Object> schedule) {
    try {
      return mapper.writeValueAsString(schedule == null ? Map.of() : schedule);
    } catch (Exception e) {
      throw new IllegalArgumentException("The study plan could not be stored: " + e.getMessage());
    }
  }

  private StudyPlanDto toDto(StudyPlan plan) {
    Map<String, Object> schedule = Map.of();
    try {
      if (plan.getSchedule() != null && !plan.getSchedule().isBlank()) {
        schedule = mapper.readValue(plan.getSchedule(), Map.class);
      }
    } catch (Exception e) {
      log.warn("Study plan {} has an unreadable schedule: {}", plan.getPlanId(), e.getMessage());
    }
    return new StudyPlanDto(
        plan.getPlanId(), plan.getCertificationId(), plan.getGoal(),
        schedule, plan.getStatus(), plan.getCreatedAt());
  }
}
