package com.capstone.rebyu.progress.service;

import com.capstone.rebyu.progress.entity.Achievement;
import com.capstone.rebyu.progress.repository.AchievementRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
@Order(0)
public class AchievementCatalogSeeder implements ApplicationRunner {

    private final AchievementRepository achievementRepository;

    @Override
    public void run(ApplicationArguments args) {
        int created = 0;
        int updated = 0;
        for (AchievementCatalog entry : AchievementCatalog.values()) {
            try {
                switch (sync(entry)) {
                    case CREATED -> created++;
                    case UPDATED -> updated++;
                    case UNCHANGED -> { }
                }
            } catch (RuntimeException e) {
                log.warn("Could not sync achievement '{}': {}", entry.title(), e.getMessage());
            }
        }
        if (created > 0 || updated > 0) {
            log.info("Achievement catalog synced: {} created, {} description(s) updated", created, updated);
        }
    }

    private enum Result { CREATED, UPDATED, UNCHANGED }

    private Result sync(AchievementCatalog entry) {
        Achievement existing = achievementRepository.findByTitleIgnoreCase(entry.title()).orElse(null);
        if (existing == null) {
            achievementRepository.save(Achievement.builder()
                    .title(entry.title())
                    .description(entry.description())
                    .build());
            return Result.CREATED;
        }
        if (!entry.description().equals(existing.getDescription())) {
            existing.setDescription(entry.description());
            achievementRepository.save(existing);
            return Result.UPDATED;
        }
        return Result.UNCHANGED;
    }
}
