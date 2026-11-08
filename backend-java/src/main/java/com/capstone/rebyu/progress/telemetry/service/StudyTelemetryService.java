package com.capstone.rebyu.progress.telemetry.service;

import com.capstone.rebyu.certification.repository.LessonRepository;
import com.capstone.rebyu.progress.telemetry.dto.StudyTelemetryDtos.*;
import com.capstone.rebyu.progress.telemetry.entity.LearnerStudyTelemetry;
import com.capstone.rebyu.progress.telemetry.repository.LearnerStudyTelemetryRepository;
import com.capstone.rebyu.user.repository.LearnerRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.*;
import java.util.*;

@Service @RequiredArgsConstructor
public class StudyTelemetryService {
  private final LearnerStudyTelemetryRepository telemetry; private final LearnerRepository learners; private final LessonRepository lessons;
  @Transactional public void record(Long learnerId, RecordEventRequest request) {
    String type = request.eventType().trim().toUpperCase(Locale.ROOT);
    if (!Set.of("STUDY_TIME", "RUSH", "CHALLENGE_COMPLETED").contains(type)) throw new IllegalArgumentException("Unsupported study event");
    var event = new LearnerStudyTelemetry(); event.setLearner(learners.findById(learnerId).orElseThrow()); event.setLesson(lessons.findById(request.lessonId()).orElseThrow());
    event.setEventType(type); event.setDurationSeconds(request.durationSeconds() == null ? 0 : request.durationSeconds()); event.setScrollVelocity(request.scrollVelocity()); event.setCorrectCount(request.correctCount()); event.setQuestionCount(request.questionCount()); event.setOccurredAt(LocalDateTime.now()); telemetry.save(event);
  }
  @Transactional(readOnly = true) public BehaviorSummary summary(Long learnerId, Long certificationId) {
    LocalDate today=LocalDate.now(); LocalDateTime week=today.minusDays(6).atStartOfDay(); var events=telemetry.findByLearner_LearnerIdAndLesson_MiddleCategory_MajorCategory_Certification_CertificationIdAndOccurredAtGreaterThanEqualOrderByOccurredAtAsc(learnerId, certificationId, week);
    Map<LocalDate,int[]> days=new LinkedHashMap<>(); for(int i=6;i>=0;i--) days.put(today.minusDays(i),new int[2]); int seconds=0,rushes=0,completed=0;
    for(var e:events){var bucket=days.get(e.getOccurredAt().toLocalDate()); if(bucket==null) continue; if("STUDY_TIME".equals(e.getEventType())) { seconds+=e.getDurationSeconds(); bucket[0]+=e.getDurationSeconds(); } if("RUSH".equals(e.getEventType())) {rushes++; bucket[1]++;} if("CHALLENGE_COMPLETED".equals(e.getEventType())) completed++;}
    int todaySeconds=days.get(today)[0]; int consistency=Math.max(0,Math.min(100,100-rushes*12)); String pace=rushes==0?"Steady":rushes<=2?"Fast":"Rushed";
    List<DailyPoint> trend=days.entrySet().stream().map(e->new DailyPoint(e.getKey().toString(), e.getValue()[0]/60,e.getValue()[1])).toList(); return new BehaviorSummary(todaySeconds/60,seconds/60,completed,rushes,consistency,pace,trend);
  }
}
