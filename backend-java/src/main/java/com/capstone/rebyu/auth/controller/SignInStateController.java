package com.capstone.rebyu.auth.controller;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public/sign-in-state")
@RequiredArgsConstructor
public class SignInStateController {

    private final UserRepository users;
    private final CognitoAdminService signIns;

    public record SignInState(String state) {
    }

    @GetMapping
    public SignInState state(@RequestParam String email) {
        String address = email == null ? "" : email.trim();
        if (address.isEmpty()) return new SignInState("NO_ACCOUNT");
        boolean known = users.findByEmailIgnoreCase(address).isPresent();
        return signIns.hasSignIn(address)
                .map(has -> new SignInState(has ? "READY" : known ? "NEEDS_SIGN_IN" : "NO_ACCOUNT"))
                .orElseGet(() -> new SignInState("UNKNOWN"));
    }
}
