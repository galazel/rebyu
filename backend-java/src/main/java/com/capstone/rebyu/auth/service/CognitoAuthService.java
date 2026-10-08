package com.capstone.rebyu.auth.service;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.context.request.RequestAttributes;
import org.springframework.web.context.request.RequestContextHolder;

import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class CognitoAuthService {

    public static final String LEARNER_USER_TYPE = "LEARNER";
    public static final String INSTITUTION_USER_TYPE = "INSTITUTION";
    public static final String DEPARTMENT_HEAD_USER_TYPE = "DEPARTMENT_HEAD";

    public static boolean isInstitutionRole(String role) {
        return INSTITUTION_USER_TYPE.equalsIgnoreCase(role)
                || DEPARTMENT_HEAD_USER_TYPE.equalsIgnoreCase(role);
    }

    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final LearnerRepository learnerRepository;
    private final com.capstone.rebyu.institution.repository.DepartmentHeadRepository departmentHeadRepository;
    private final InstitutionRepository institutionRepository;
    private final com.capstone.rebyu.bkt.client.BktClient bktClient;

    private final org.springframework.beans.factory.ObjectProvider<CognitoAuthService> self;

    private static final String IDENTITY_ATTRIBUTE = CognitoAuthService.class.getName() + ".identity";

    private record ResolvedIdentity(String cognitoSub, CurrentUserDto user) {}

    public CurrentUserDto syncCurrentUser(Jwt jwt, String rawAccessToken) {
        String cognitoSub = jwt.getSubject();

        CurrentUserDto alreadyResolved = cachedIdentity(cognitoSub);
        if (alreadyResolved != null) {
            return alreadyResolved;
        }

        CurrentUserDto resolved = self.getObject().resolveCurrentUser(jwt, rawAccessToken);
        cacheIdentity(cognitoSub, resolved);
        return resolved;
    }

    @Transactional
    public CurrentUserDto resolveCurrentUser(Jwt jwt, String rawAccessToken) {
        String cognitoSub = jwt.getSubject();

        User existing = userRepository.findByCognitoSub(cognitoSub).orElse(null);
        if (existing != null) {
            ensureInstitutionLinkage(existing);
            return toDto(existing);
        }

        Map<String, String> attributes = tokenAttributes(jwt);
        String email = attributes.get("email");
        if (email == null || email.isBlank()) {
            throw new IllegalStateException(
                    "This sign-in has no email; cannot link a REBYU user.");
        }

        try {
            User user = linkOrProvision(cognitoSub, email, attributes);
            ensureInstitutionLinkage(user);
            return toDto(user);
        } catch (DataIntegrityViolationException raceLost) {
            return userRepository.findByCognitoSub(cognitoSub)
                    .map(this::toDto)
                    .orElseThrow(() -> raceLost);
        }
    }

    private CurrentUserDto cachedIdentity(String cognitoSub) {
        RequestAttributes request = RequestContextHolder.getRequestAttributes();
        if (request == null || cognitoSub == null) {
            return null;
        }
        Object parked = request.getAttribute(IDENTITY_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        return parked instanceof ResolvedIdentity identity && cognitoSub.equals(identity.cognitoSub())
                ? identity.user()
                : null;
    }

    private void cacheIdentity(String cognitoSub, CurrentUserDto user) {
        RequestAttributes request = RequestContextHolder.getRequestAttributes();
        if (request == null || cognitoSub == null || user == null) {
            return;
        }
        request.setAttribute(
                IDENTITY_ATTRIBUTE, new ResolvedIdentity(cognitoSub, user), RequestAttributes.SCOPE_REQUEST);
    }

    public void evictCurrentUser() {
        RequestAttributes request = RequestContextHolder.getRequestAttributes();
        if (request != null) {
            request.removeAttribute(IDENTITY_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        }
    }

    private User linkOrProvision(String cognitoSub, String email, Map<String, String> attributes) {
        User byEmail = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (byEmail != null) {
            if (byEmail.getCognitoSub() != null && !byEmail.getCognitoSub().equals(cognitoSub)) {
                log.info("Relinking userId={} to its new sign-in identity", byEmail.getUserId());
            }
            byEmail.setCognitoSub(cognitoSub);
            return userRepository.save(byEmail);
        }

        UserType learnerType = userTypeRepository.findByUserTypeText(LEARNER_USER_TYPE)
                .orElseGet(() -> {
                    UserType type = new UserType();
                    type.setUserTypeText(LEARNER_USER_TYPE);
                    return userTypeRepository.save(type);
                });

        User user = User.builder()
                .userType(learnerType)
                .email(email)
                .passwordHash("SUPABASE")
                .accountStatus(User.AccountStatus.active)
                .joinedAt(LocalDateTime.now())
                .cognitoSub(cognitoSub)
                .build();
        user = userRepository.save(user);

        Learner learner = Learner.builder()
                .user(user)
                .username(uniqueUsernameFrom(email))
                .firstName(attributes.getOrDefault("given_name", ""))
                .lastName(attributes.getOrDefault("family_name", ""))
                .build();
        learnerRepository.save(learner);
        purgeInheritedBktState(learner.getLearnerId());

        log.info("Provisioned learner account for new Cognito user userId={}", user.getUserId());
        return user;
    }

    private void purgeInheritedBktState(Long learnerId) {
        if (learnerId == null) {
            return;
        }
        try {
            bktClient.purgeLearnerState(learnerId);
        } catch (Exception e) {
            log.error("Could not clear BKT state for new learner {}. If this id was reused, "
                    + "that learner will see the previous account's mastery until it is purged.",
                    learnerId, e);
        }
    }

    private Map<String, String> tokenAttributes(Jwt jwt) {
        Map<String, String> attributes = new HashMap<>();
        if (Boolean.TRUE.equals(jwt.getClaims().get("is_anonymous"))) {
            return attributes;
        }
        String email = jwt.getClaimAsString("email");
        if (email != null && !email.isBlank()) {
            attributes.put("email", email.trim().toLowerCase(Locale.ROOT));
        }
        if (jwt.getClaims().get("user_metadata") instanceof Map<?, ?> metadata) {
            putName(attributes, "given_name", metadata.get("given_name"), metadata.get("first_name"));
            putName(attributes, "family_name", metadata.get("family_name"), metadata.get("last_name"));
        }
        return attributes;
    }

    private static void putName(Map<String, String> attributes, String key, Object preferred, Object fallback) {
        Object value = preferred != null ? preferred : fallback;
        if (value != null && !value.toString().isBlank()) {
            attributes.put(key, value.toString().trim());
        }
    }

    private String uniqueUsernameFrom(String email) {
        String base = email.split("@")[0]
                .toLowerCase(Locale.ROOT)
                .replaceAll("[^a-z0-9._-]", "");
        if (base.isBlank()) {
            base = "learner";
        }
        base = base.substring(0, Math.min(base.length(), 40));
        String candidate = base;
        while (learnerRepository.existsByUsername(candidate)) {
            candidate = base + "-" + UUID.randomUUID().toString().substring(0, 6);
        }
        return candidate;
    }

    private void ensureInstitutionLinkage(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        Institution institution = institutionRepository
                .findByPrimaryContactEmailIgnoreCase(user.getEmail())
                .orElse(null);
        if (institution == null) {
            return;
        }

        boolean isInstitutionType = user.getUserType() != null
                && isInstitutionRole(user.getUserType().getUserTypeText());
        if (!isInstitutionType) {
            UserType institutionType = userTypeRepository.findByUserTypeText(INSTITUTION_USER_TYPE)
                    .orElseGet(() -> {
                        UserType type = new UserType();
                        type.setUserTypeText(INSTITUTION_USER_TYPE);
                        return userTypeRepository.save(type);
                    });
            user.setUserType(institutionType);
            userRepository.save(user);
        }

        boolean alreadyLinked = !departmentHeadRepository
                .findByInstitution_InstitutionIdAndUser_UserId(
                        institution.getInstitutionId(), user.getUserId())
                .isEmpty();
        if (!alreadyLinked) {
            DepartmentHead member = DepartmentHead.builder()
                    .institution(institution)
                    .user(user)
                    .headRole(DepartmentHead.HeadRole.owner)
                    .isPrimaryContact(true)
                    .joinedAt(LocalDateTime.now())
                    .build();
            departmentHeadRepository.save(member);
            log.info("Linked institution account {} to institution {} (id={}) on sign-in",
                    user.getEmail(), institution.getInstitutionName(), institution.getInstitutionId());
        }
    }

    private CurrentUserDto toDto(User user) {
        Learner learner = learnerRepository.findByUser_UserId(user.getUserId()).orElse(null);
        boolean learnerAccount = user.getUserType() != null
                && LEARNER_USER_TYPE.equalsIgnoreCase(user.getUserType().getUserTypeText());

        if (learner == null && learnerAccount) {
            learner = Learner.builder()
                    .user(user)
                    .username(uniqueUsernameFrom(user.getEmail()))
                    .firstName("")
                    .lastName("")
                    .build();
            learner = learnerRepository.save(learner);
            log.info("Provisioned missing learner profile for legacy user userId={}", user.getUserId());
        }

        String firstName = learner != null ? learner.getFirstName() : "";
        String lastName = learner != null ? learner.getLastName() : "";
        String displayName = (firstName + " " + lastName).trim();
        if (displayName.isBlank()) {
            displayName = learner != null ? learner.getUsername() : user.getEmail();
        }

        boolean departmentHeadAccount = user.getUserType() != null
                && DEPARTMENT_HEAD_USER_TYPE.equalsIgnoreCase(user.getUserType().getUserTypeText());
        List<DepartmentHead> memberships = departmentHeadRepository.findByUser_UserId(user.getUserId());
        DepartmentHead membership = memberships.stream()
                .filter(row -> !departmentHeadAccount
                        || row.getHeadRole() != DepartmentHead.HeadRole.owner)
                .min(Comparator.comparing(DepartmentHead::getDepartmentHeadId))
                .orElseGet(() -> memberships.stream()
                        .min(Comparator.comparing(DepartmentHead::getDepartmentHeadId))
                        .orElse(null));
        Long institutionId = membership != null ? membership.getInstitution().getInstitutionId() : null;
        String departmentHeadRole = membership != null ? membership.getHeadRole().name() : null;

        return new CurrentUserDto(
                user.getUserId(),
                user.getEmail(),
                user.getUserType() != null ? user.getUserType().getUserTypeText() : LEARNER_USER_TYPE,
                learner != null ? learner.getLearnerId() : null,
                institutionId,
                departmentHeadRole,
                firstName,
                lastName,
                displayName,
                learner != null ? learner.getAvatarKey() : null
        );
    }
}
