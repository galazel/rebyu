package com.capstone.rebyu.auth.controller;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

/**
 * Tells the sign-in page which of three different problems a rejected
 * password actually was, so it can show the right one instead of a message
 * that hedges across all of them:
 *
 * <ul>
 *   <li>{@code READY} -- a sign-in exists; the password was wrong.</li>
 *   <li>{@code NEEDS_SIGN_IN} -- REBYU has this account from before sign-in
 *       moved to Supabase (16 September 2026), but Supabase has no sign-in for
 *       it yet: registering again with the same email reclaims it.</li>
 *   <li>{@code NO_ACCOUNT} -- nothing under this address anywhere.</li>
 *   <li>{@code UNKNOWN} -- Supabase could not be asked.</li>
 * </ul>
 *
 * Public on purpose: it is only ever asked after a failed password, and the
 * registration form already reports a taken email, so it reveals nothing new.
 */
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
