package com.capstone.rebyu.onboarding.controller;

import com.capstone.rebyu.onboarding.controller.OnboardingController.CodeRequest;
import com.capstone.rebyu.onboarding.service.OnboardingService;
import com.capstone.rebyu.onboarding.service.OnboardingService.CodeLookup;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/public/department-head-codes")
@RequiredArgsConstructor
public class PublicDepartmentCodeController {

    private final OnboardingService onboardingService;

    @PostMapping("/lookup")
    public CodeLookup lookup(@Valid @RequestBody CodeRequest request) {
        return onboardingService.lookupDepartmentHeadCode(request.code());
    }
}
