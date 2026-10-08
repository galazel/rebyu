package com.capstone.rebyu.progress.repository;

import com.capstone.rebyu.progress.entity.Achievement;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface AchievementRepository extends JpaRepository<Achievement, Long> {

    Optional<Achievement> findByTitleIgnoreCase(String title);
}
