package com.capstone.rebyu.gamification.repository;

import com.capstone.rebyu.gamification.entity.CertificationReviewLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CertificationReviewLevelRepository extends JpaRepository<CertificationReviewLevel, Long> {
    List<CertificationReviewLevel> findAllByOrderByLevelNumberAsc();
}
