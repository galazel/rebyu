package com.capstone.rebyu.progress.service;

import com.capstone.rebyu.progress.repository.LearnerReadSectionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class LearnerReadSectionService {
    private final LearnerReadSectionRepository readSectionRepository;

    public List<String> listReadSectionKeys(Long learnerId, Long lessonId) {
        return readSectionRepository.findByLearner_LearnerIdAndLesson_LessonId(learnerId, lessonId)
                .stream()
                .map(entity -> entity.getId().getSectionKey())
                .toList();
    }

    public void markRead(Long learnerId, Long lessonId, String sectionKey) {
        readSectionRepository.insertIfAbsent(learnerId, lessonId, sectionKey);
    }

    public void markUnread(Long learnerId, Long lessonId, String sectionKey) {
        readSectionRepository.deleteByLearner_LearnerIdAndLesson_LessonIdAndId_SectionKey(learnerId, lessonId, sectionKey);
    }
}
