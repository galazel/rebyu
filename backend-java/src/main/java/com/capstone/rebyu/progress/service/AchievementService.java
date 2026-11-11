package com.capstone.rebyu.progress.service;

import com.capstone.rebyu.progress.dto.AchievementDto;
import com.capstone.rebyu.progress.mapper.AchievementMapper;
import com.capstone.rebyu.progress.entity.Achievement;
import com.capstone.rebyu.progress.repository.AchievementRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AchievementService {
    private final AchievementRepository achievementRepository;
    private final com.capstone.rebyu.common.CascadeDeleteService cascade;
    private final AchievementMapper achievementMapper;

    public List<AchievementDto> getAll() {
        return achievementRepository.findAll().stream().map(achievementMapper::toDto).toList();
    }

    public AchievementDto getById(Long id) {
        return achievementMapper.toDto(findEntity(id));
    }

    public AchievementDto create(AchievementDto dto) {
        Achievement entity = achievementMapper.toEntity(dto);
        entity.setAchievementId(null);
        return achievementMapper.toDto(achievementRepository.save(entity));
    }

    public AchievementDto update(Long id, AchievementDto dto) {
        findEntity(id);
        Achievement entity = achievementMapper.toEntity(dto);
        entity.setAchievementId(id);
        return achievementMapper.toDto(achievementRepository.save(entity));
    }

    public void delete(Long id) {
        findEntity(id);
        // The badge as earned by learners (learner_achievements) goes with it.
        cascade.delete("achievements", "achievement_id", id);
    }

    private Achievement findEntity(Long id) {
        return achievementRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Achievement not found: " + id));
    }
}
