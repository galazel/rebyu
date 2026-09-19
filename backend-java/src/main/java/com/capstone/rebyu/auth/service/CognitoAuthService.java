package com.capstone.rebyu.auth.service;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.InstitutionMember;
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
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

/**
 * Links a validated Cognito identity to the existing REBYU user model.
 *
 * The Cognito subject is the stable external identity; the local users table
 * (and its learner profile, enrollments, results, and transactions) remains
 * the application source of truth. Self-registration only ever provisions the
 * lowest LEARNER access level.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class CognitoAuthService {

    public static final String LEARNER_USER_TYPE = "LEARNER";
    /** The institution's own account -- the owner / primary contact. */
    public static final String INSTITUTION_USER_TYPE = "INSTITUTION";
    /**
     * Someone the institution created an account for (a group leader, a
     * co-admin) rather than the institution account itself. Carries the same
     * permissions as INSTITUTION; it exists so the two can be told apart.
     */
    public static final String INSTITUTION_MEMBER_USER_TYPE = "INSTITUTION_MEMBER";

    /**
     * True for either institution-side role. Every permission check that used to
     * compare against "INSTITUTION" must go through this, or group leaders lose
     * the authoring rights they had before the member role existed.
     */
    public static boolean isInstitutionRole(String role) {
        return INSTITUTION_USER_TYPE.equalsIgnoreCase(role)
                || INSTITUTION_MEMBER_USER_TYPE.equalsIgnoreCase(role);
    }

    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final LearnerRepository learnerRepository;
    private final com.capstone.rebyu.institution.repository.InstitutionMemberRepository institutionMemberRepository;
    private final InstitutionRepository institutionRepository;
    private final com.capstone.rebyu.bkt.client.BktClient bktClient;

    /**
     * This same bean, through its proxy.
     *
     * {@link #syncCurrentUser} has to run its cache lookup OUTSIDE the
     * transaction -- {@code open-in-view} is off, so entering a
     * {@code @Transactional} method checks a connection out of the pool before
     * the body gets a chance to say it did not need one. A plain call to
     * {@link #resolveCurrentUser} would bypass the proxy and lose the
     * transaction entirely, so the cache miss goes back out through it.
     *
     * An {@code ObjectProvider} rather than the bean itself: the lookup is
     * deferred to first use, so there is no circular dependency at construction.
     */
    private final org.springframework.beans.factory.ObjectProvider<CognitoAuthService> self;

    /** Where {@link #syncCurrentUser} parks the identity it resolved. */
    private static final String IDENTITY_ATTRIBUTE = CognitoAuthService.class.getName() + ".identity";

    /** Keyed by subject so a cached identity can never answer for another one. */
    private record ResolvedIdentity(String cognitoSub, CurrentUserDto user) {}

    /**
     * The authenticated caller, resolved at most once per HTTP request.
     *
     * <p>Every secured endpoint in the application opens by calling this to turn
     * a token into a REBYU user, and for an account that already exists the work
     * is four queries and a transaction: the user by subject, the institution by
     * email that {@link #ensureInstitutionLinkage} checks, then the learner
     * profile and institution membership that {@link #toDto} reads. Handlers
     * that delegate part of their authorization to a helper -- exam listing
     * checking group access, achievements checking ownership -- paid for all of
     * it twice on a single request.
     *
     * <p>The cache is scoped to the request and no wider. A token's identity is
     * fixed for the duration of one request, so a second lookup within it cannot
     * legitimately differ; across requests it very much can, and an account
     * whose role or institution linkage was just repaired has to see that on its
     * next call. Outside a request entirely -- a scheduled job, a test -- there
     * is nowhere to cache and the resolve simply runs.
     *
     * <p>Note for callers that CHANGE the current user mid-request (role, email,
     * institution membership): call {@link #evictCurrentUser} afterwards, or a
     * later lookup in the same request answers from before the change. Nothing
     * does this today -- handlers resolve identity first and mutate second.
     */
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

    /**
     * The uncached path. Public only because it is called back through the
     * proxy for its transaction -- call {@link #syncCurrentUser} instead.
     */
    @Transactional
    public CurrentUserDto resolveCurrentUser(Jwt jwt, String rawAccessToken) {
        String cognitoSub = jwt.getSubject();

        User existing = userRepository.findByCognitoSub(cognitoSub).orElse(null);
        if (existing != null) {
            ensureInstitutionLinkage(existing);
            return toDto(existing);
        }

        // First sign-in for this subject: attributes come from the verified,
        // signed token (never from frontend-supplied fields).
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
            // A parallel first-login request linked this subject already.
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

    /**
     * Forget this request's resolved identity, so the next
     * {@link #syncCurrentUser} reads the database again. For a handler that
     * changes the signed-in account's own role, email, or institution linkage
     * and then needs to see the result within the same request.
     */
    public void evictCurrentUser() {
        RequestAttributes request = RequestContextHolder.getRequestAttributes();
        if (request != null) {
            request.removeAttribute(IDENTITY_ATTRIBUTE, RequestAttributes.SCOPE_REQUEST);
        }
    }

    private User linkOrProvision(String cognitoSub, String email, Map<String, String> attributes) {
        User byEmail = userRepository.findByEmailIgnoreCase(email).orElse(null);
        if (byEmail != null) {
            /* A different subject on the same email is an account moving
               from Cognito to Supabase. Supabase only issues a token once the
               address is confirmed, so whoever holds this token owns the
               email, and the account follows it. */
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
                // Authentication is delegated to Supabase; no local password.
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
                // @Builder ignores the entity's field defaults, and these
                // columns are NOT NULL — set them explicitly.
                .readinessScore(java.math.BigDecimal.ZERO)
                .confidenceLevel(java.math.BigDecimal.ZERO)
                .build();
        learnerRepository.save(learner);
        purgeInheritedBktState(learner.getLearnerId());

        log.info("Provisioned learner account for new Cognito user userId={}", user.getUserId());
        return user;
    }

    /**
     * Clears any BKT record already sitting under a freshly issued learner id.
     *
     * <p>Learner ids are unique in the {@code learners} table but not over
     * time. This database has been reset at least once while the BKT store was
     * not: ids restarted from 1 while mastery rows survived, including rows for
     * ids that no longer refer to anyone. The result was a brand-new account
     * opening on 98% mastery of a lesson it had never seen, with 89 answers
     * behind it -- one learner's record shown to another.
     *
     * <p>Registration is never failed over this. BKT is an optional service the
     * rest of the application already degrades around, and refusing to create
     * an account because a mastery store was unreachable would trade a display
     * problem for a total one. It is logged loudly instead, because a learner
     * who slips through keeps the inherited data until it is cleared.
     */
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

    /**
     * Email and names from a Supabase access token. The token's signature is
     * already checked by the resource server; names were saved as user
     * metadata at sign-up or invitation.
     */
    private Map<String, String> tokenAttributes(Jwt jwt) {
        Map<String, String> attributes = new HashMap<>();
        if (Boolean.TRUE.equals(jwt.getClaims().get("is_anonymous"))) {
            return attributes; // no email: refused by the caller
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

    /**
     * Self-heals institution account linkage on sign-in. When a validated user's
     * email matches an Institution's primary contact (i.e. an admin-approved
     * partnership created that institution for this email), make sure the
     * account is typed INSTITUTION and linked to that institution as its owner.
     *
     * Without this, the first sign-in of an approved institution contact falls
     * through {@link #linkOrProvision} and is provisioned as a plain LEARNER with
     * no InstitutionMember row — so institutionId never resolves and the institution
     * portal shows "Unable to load your institution". This runs on every sync,
     * so it also repairs accounts that were already mis-provisioned.
     */
    private void ensureInstitutionLinkage(User user) {
        if (user == null || user.getEmail() == null || user.getEmail().isBlank()) {
            return;
        }
        Institution institution = institutionRepository
                .findByPrimaryContactEmailIgnoreCase(user.getEmail())
                .orElse(null);
        if (institution == null) {
            return; // Not an institution contact — leave as a learner.
        }

        // 1) Ensure the account is typed INSTITUTION so role resolution returns
        //    INSTITUTION instead of the default LEARNER. INSTITUTION_MEMBER counts
        //    as already-typed: this repair runs on every sync, and rewriting it
        //    to INSTITUTION would undo a group leader's role on their next
        //    sign-in for anyone who is both a primary contact and a member.
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

        // 2) Ensure an owner InstitutionMember link exists so the portal can scope
        //    to this institution.
        boolean alreadyLinked = !institutionMemberRepository
                .findByInstitution_InstitutionIdAndUser_UserId(
                        institution.getInstitutionId(), user.getUserId())
                .isEmpty();
        if (!alreadyLinked) {
            InstitutionMember member = InstitutionMember.builder()
                    .institution(institution)
                    .user(user)
                    .memberRole(InstitutionMember.MemberRole.owner)
                    .isPrimaryContact(true)
                    .joinedAt(LocalDateTime.now())
                    .build();
            institutionMemberRepository.save(member);
            log.info("Linked institution account {} to institution {} (id={}) on sign-in",
                    user.getEmail(), institution.getInstitutionName(), institution.getInstitutionId());
        }
    }

    private CurrentUserDto toDto(User user) {
        Learner learner = learnerRepository.findByUser_UserId(user.getUserId()).orElse(null);
        boolean learnerAccount = user.getUserType() != null
                && LEARNER_USER_TYPE.equalsIgnoreCase(user.getUserType().getUserTypeText());

        // Some legacy LEARNER users predate automatic profile provisioning.
        // Repair them during authenticated sync so enrollment APIs always
        // receive a real learners.learner_id instead of a user ID.
        if (learner == null && learnerAccount) {
            learner = Learner.builder()
                    .user(user)
                    .username(uniqueUsernameFrom(user.getEmail()))
                    .firstName("")
                    .lastName("")
                    .readinessScore(java.math.BigDecimal.ZERO)
                    .confidenceLevel(java.math.BigDecimal.ZERO)
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

        // Institution members carry their institution so the portal can scope
        // to it; their role comes from the INSTITUTION user type.
        InstitutionMember membership = institutionMemberRepository.findByUser_UserId(user.getUserId())
                .stream()
                .findFirst()
                .orElse(null);
        Long institutionId = membership != null ? membership.getInstitution().getInstitutionId() : null;
        String institutionMemberRole = membership != null ? membership.getMemberRole().name() : null;

        return new CurrentUserDto(
                user.getUserId(),
                user.getEmail(),
                user.getUserType() != null ? user.getUserType().getUserTypeText() : LEARNER_USER_TYPE,
                learner != null ? learner.getLearnerId() : null,
                institutionId,
                institutionMemberRole,
                firstName,
                lastName,
                displayName
        );
    }
}
