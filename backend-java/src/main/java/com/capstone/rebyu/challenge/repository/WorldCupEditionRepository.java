package com.capstone.rebyu.challenge.repository;

import com.capstone.rebyu.challenge.entity.WorldCupEdition;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface WorldCupEditionRepository extends JpaRepository<WorldCupEdition, Long> {

  List<WorldCupEdition> findAllByOrderByWeekStartDesc();

  boolean existsByWeekStart(LocalDate weekStart);
}
