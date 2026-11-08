package com.capstone.rebyu.progress.telemetry.controller;
import com.capstone.rebyu.auth.dto.CurrentUserDto; import com.capstone.rebyu.auth.service.CognitoAuthService; import com.capstone.rebyu.progress.telemetry.dto.StudyTelemetryDtos.*; import com.capstone.rebyu.progress.telemetry.service.StudyTelemetryService;
import jakarta.validation.Valid; import lombok.RequiredArgsConstructor; import org.springframework.security.core.annotation.AuthenticationPrincipal; import org.springframework.security.oauth2.jwt.Jwt; import org.springframework.web.bind.annotation.*;
@RestController @RequestMapping("/api/learners/me/study-behavior") @RequiredArgsConstructor
public class StudyTelemetryController { private final StudyTelemetryService service; private final CognitoAuthService auth;
 @PostMapping public void record(@AuthenticationPrincipal Jwt jwt,@Valid @RequestBody RecordEventRequest request){service.record(me(jwt),request);}
 @GetMapping public BehaviorSummary summary(@AuthenticationPrincipal Jwt jwt,@RequestParam Long certificationId){return service.summary(me(jwt),certificationId);}
 private Long me(Jwt jwt){if(jwt==null)throw new IllegalArgumentException("Authentication is required"); CurrentUserDto user=auth.syncCurrentUser(jwt,jwt.getTokenValue()); if(user.learnerId()==null)throw new IllegalArgumentException("A learner account is required"); return user.learnerId();}}
