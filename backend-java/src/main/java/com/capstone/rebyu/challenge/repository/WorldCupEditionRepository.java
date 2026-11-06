package com.capstone.rebyu.challenge.repository;

import com.capstone.rebyu.challenge.entity.WorldCupEdition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.time.DayOfWeek;
import java.util.List;
import java.util.Optional;

@Repository
public interface WorldCupEditionRepository extends JpaRepository<WorldCupEdition, Long> {

  List<WorldCupEdition> findAllByOrderByWeekStartDesc();

  boolean existsByWeekStart(LocalDate weekStart);

  boolean existsByCertificationIdAndPublishedTrue(Long certificationId);

  Optional<WorldCupEdition> findFirstByPublishedTrueAndWeekStart(LocalDate weekStart);

  /**
   * The weekly exam learners play now: this week's published edition only. A week's
   * exam expires when its week ends, and future weeks are not open yet. Brackets are
   * drawn from this edition, so it decides the one open track.
   */
  default Optional<WorldCupEdition> findActive(LocalDate today) {
    return findFirstByPublishedTrueAndWeekStart(today.with(DayOfWeek.MONDAY));
  }
}
