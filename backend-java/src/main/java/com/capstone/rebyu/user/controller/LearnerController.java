package com.capstone.rebyu.user.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.common.InvitationAcceptanceException;
import com.capstone.rebyu.user.dto.AcceptInvitationRequest;
import com.capstone.rebyu.user.dto.AcceptInvitationResponse;
import com.capstone.rebyu.user.dto.LearnerDto;
import com.capstone.rebyu.user.service.LearnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learners")
@RequiredArgsConstructor
public class LearnerController {
    private final LearnerService learnerService;
    private final CognitoAuthService cognitoAuthService;
    private final com.capstone.rebyu.user.repository.LearnerRepository learnerRepository;
    private final com.capstone.rebyu.user.repository.UserRepository userRepository;

    public record MyProfileRequest(
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 50) String firstName,
            @jakarta.validation.constraints.NotBlank @jakarta.validation.constraints.Size(max = 50) String lastName,
            @jakarta.validation.constraints.NotBlank
            @jakarta.validation.constraints.Pattern(regexp = "^[A-Za-z0-9._-]{3,50}$",
                    message = "Usernames are 3-50 letters, numbers, dots, dashes or underscores.")
            String username,
            @jakarta.validation.constraints.Size(max = 30) String phoneNumber) {
    }

    public record MyProfileResponse(String firstName, String lastName, String username, String email, String phoneNumber) {
    }

    /**
     * The signed-in learner edits their own profile. The account page used to
     * call the admin-only PUT /api/learners/{id} and /api/users/{id}, so every
     * save failed with "Admin access is required".
     *
     * <p>Email is not editable here: it is the sign-in identity, and changing it
     * in REBYU's tables alone would unlink the account from its login.
     */
    @PutMapping("/me/profile")
    @org.springframework.transaction.annotation.Transactional
    public MyProfileResponse updateMyProfile(
            @Valid @RequestBody MyProfileRequest request, @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto me = cognitoAuthService.syncCurrentUser(jwt, jwt.getTokenValue());
        if (me.learnerId() == null) throw new IllegalArgumentException("A learner account is required");

        var learner = learnerRepository.findById(me.learnerId())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Learner not found"));
        String username = request.username().trim();
        if (!username.equalsIgnoreCase(learner.getUsername()) && learnerRepository.existsByUsername(username)) {
            throw new IllegalArgumentException("That username is already taken.");
        }
        learner.setFirstName(request.firstName().trim());
        learner.setLastName(request.lastName().trim());
        learner.setUsername(username);
        learnerRepository.save(learner);

        var user = me.userId() == null ? null : userRepository.findById(me.userId()).orElse(null);
        if (user != null) {
            String phone = request.phoneNumber() == null ? null : request.phoneNumber().trim();
            user.setPhoneNumber(phone == null || phone.isEmpty() ? null : phone);
            userRepository.save(user);
        }
        return new MyProfileResponse(learner.getFirstName(), learner.getLastName(), learner.getUsername(),
                user == null ? me.email() : user.getEmail(), user == null ? null : user.getPhoneNumber());
    }

    // Reading the full learner list / arbitrary learner records exposes every
    // learner across every institution, so reads are admin-only. Learners read
    // their own record via /api/learners/me/portal.
    @GetMapping
    public List<LearnerDto> getAll(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return learnerService.getAll();
    }

    @GetMapping("/{id}")
    public LearnerDto getById(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return learnerService.getById(id);
    }

    private void requireAdmin(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = cognitoAuthService.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required");
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public LearnerDto create(@Valid @RequestBody LearnerDto dto, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return learnerService.create(dto);
    }
    /**
     * Accepts an institution invitation for the signed-in learner. The learner
     * is resolved from the validated Cognito JWT — never from the request body.
     */
    @PostMapping("accept-invitation")
    @ResponseStatus(HttpStatus.OK)
    public AcceptInvitationResponse acceptInvitation(
            @Valid @RequestBody AcceptInvitationRequest request,
            @AuthenticationPrincipal Jwt jwt) {
        if (jwt == null) {
            throw new InvitationAcceptanceException(
                    InvitationAcceptanceException.Code.NOT_AUTHENTICATED,
                    "Please sign in to accept this invitation.");
        }
        CurrentUserDto currentUser = cognitoAuthService.syncCurrentUser(jwt, jwt.getTokenValue());
        return learnerService.acceptInvitation(
                currentUser.learnerId(), currentUser.email(), request.token());
    }

    @PutMapping("/{id}")
    public LearnerDto update(@PathVariable Long id, @Valid @RequestBody LearnerDto dto, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return learnerService.update(id, dto);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable Long id, @AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        learnerService.delete(id);
    }
}
