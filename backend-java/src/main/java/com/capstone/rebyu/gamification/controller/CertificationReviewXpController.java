package com.capstone.rebyu.gamification.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.gamification.entity.CertificationReviewLevel;
import com.capstone.rebyu.gamification.service.CertificationReviewLevelService;
import com.capstone.rebyu.learningtools.repository.LearnerPracticeAttemptRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController @RequestMapping("/api/learners/me/certifications") @RequiredArgsConstructor
public class CertificationReviewXpController {
  private final CognitoAuthService auth; private final LearnerPracticeAttemptRepository attempts; private final CertificationReviewLevelService levels;
  public record ReviewLevel(long xp, int levelNumber, String title, long requiredXp, Long nextRequiredXp, String imageKey) {}
  @GetMapping("/{certificationId}/review-level") public ReviewLevel get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long certificationId) {
    if (jwt == null) throw new IllegalArgumentException("Authentication is required");
    CurrentUserDto user=auth.syncCurrentUser(jwt,jwt.getTokenValue()); if(user.learnerId()==null) throw new IllegalArgumentException("A learner account is required");
    long xp=attempts.reviewXpForCertification(user.learnerId(), certificationId); List<CertificationReviewLevel> all=levels.all();
    CertificationReviewLevel current=all.stream().filter(row->row.getRequiredXp()<=xp).reduce((a,b)->b).orElse(all.getFirst());
    Long next=all.stream().filter(row->row.getLevelNumber()==current.getLevelNumber()+1).map(CertificationReviewLevel::getRequiredXp).findFirst().orElse(null);
    return new ReviewLevel(xp,current.getLevelNumber(),current.getTitle(),current.getRequiredXp(),next,current.getImageKey());
  }
}
