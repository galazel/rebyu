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
import org.springframework.http.MediaType;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/learners")
@RequiredArgsConstructor
public class LearnerController {
    private static final org.slf4j.Logger log = org.slf4j.LoggerFactory.getLogger(LearnerController.class);
    private final com.capstone.rebyu.certification.service.S3StorageService s3StorageService;
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
    /** What the browser needs to draw the picture: the key it resolves to a signed link. */
    public record MyAvatarResponse(String avatarKey) {
    }

    private static final long MAX_AVATAR_BYTES = 5L * 1024 * 1024;
    private static final List<String> AVATAR_TYPES =
            List.of("image/png", "image/jpeg", "image/webp", "image/gif");

    /**
     * The signed-in learner sets their own profile picture.
     *
     * <p>Only the learner themselves: the id comes from the token rather than
     * the request, so there is no id to tamper with and no way to write a
     * picture onto somebody else's profile.
     *
     * <p>The content type is checked against a short list rather than trusting
     * the extension, and the size is capped before anything reaches storage --
     * an avatar is a small picture, and the cap is what keeps this from being
     * a general-purpose upload with a friendly name.
     */
    @PostMapping(value = "/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @org.springframework.transaction.annotation.Transactional
    public MyAvatarResponse uploadMyAvatar(
            @RequestPart("file") MultipartFile file, @AuthenticationPrincipal Jwt jwt) {
        var learner = requireMyLearner(jwt);

        if (file == null || file.isEmpty()) {
            throw new IllegalArgumentException("Choose an image to upload.");
        }
        if (file.getSize() > MAX_AVATAR_BYTES) {
            throw new IllegalArgumentException("A profile picture must be 5 MB or smaller.");
        }
        String contentType = file.getContentType() == null ? "" : file.getContentType().toLowerCase();
        if (!AVATAR_TYPES.contains(contentType)) {
            throw new IllegalArgumentException("A profile picture must be a PNG, JPEG, WebP or GIF image.");
        }

        String previous = learner.getAvatarKey();
        try {
            learner.setAvatarKey(s3StorageService.uploadFile(file, "learner-avatars"));
        } catch (java.io.IOException e) {
            throw new IllegalStateException("The picture could not be uploaded", e);
        }
        learnerRepository.save(learner);

        // The one it replaced is nobody's now. A failure here is not the
        // learner's problem -- their new picture is already saved.
        deleteQuietly(previous);
        return new MyAvatarResponse(learner.getAvatarKey());
    }

    /** Removes the picture, putting the learner back to their initials. */
    @DeleteMapping("/me/avatar")
    @org.springframework.transaction.annotation.Transactional
    public MyAvatarResponse deleteMyAvatar(@AuthenticationPrincipal Jwt jwt) {
        var learner = requireMyLearner(jwt);
        String previous = learner.getAvatarKey();
        learner.setAvatarKey(null);
        learnerRepository.save(learner);
        deleteQuietly(previous);
        return new MyAvatarResponse(null);
    }

    private void deleteQuietly(String key) {
        if (key == null || key.isBlank()) return;
        try {
            s3StorageService.deleteFile(key);
        } catch (RuntimeException e) {
            log.warn("Could not delete replaced avatar {}", key, e);
        }
    }

    private com.capstone.rebyu.user.entity.Learner requireMyLearner(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto me = cognitoAuthService.syncCurrentUser(jwt, jwt.getTokenValue());
        if (me.learnerId() == null) throw new IllegalArgumentException("A learner account is required");
        return learnerRepository.findById(me.learnerId())
                .orElseThrow(() -> new jakarta.persistence.EntityNotFoundException("Learner not found"));
    }

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
