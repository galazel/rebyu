package com.capstone.rebyu.auth.security;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

/**
 * Resolves the caller and refuses the ones a handler is not meant to serve.
 *
 * <h2>Why this exists rather than {@code @PreAuthorize}</h2>
 *
 * <p>This application does not enable method security -- there is no
 * {@code @EnableMethodSecurity} anywhere -- so every {@code @PreAuthorize} in
 * the codebase is inert. It is not merely ignored at runtime, it is actively
 * misleading: a controller annotated {@code @PreAuthorize("hasRole('ADMIN')")}
 * reads as protected in review, and combined with {@code anyRequest().permitAll()}
 * in the security configuration it was, in fact, reachable by anyone on the
 * internet. {@code /api/admin/payments} -- every paying learner's name, email
 * and payment reference -- answered 200 to an unauthenticated request.
 *
 * <p>Simply switching method security on was not the fix. {@code hasRole('ADMIN')}
 * tests for a granted authority {@code ROLE_ADMIN}, and nothing here grants one:
 * the role is a column on the REBYU user, resolved from the token's subject by
 * {@link CognitoAuthService#syncCurrentUser}, not a claim the JWT carries. Every
 * annotated endpoint would have begun refusing its own administrators.
 *
 * <p>So the check is made where the role actually lives. Controllers across the
 * codebase had each grown a private copy of this, and they had already drifted
 * apart -- some compared with {@code equalsIgnoreCase}, one with
 * {@code contains("ADMIN")}, which would also admit any future role whose name
 * merely contained the word. One implementation, tested once, is the point.
 *
 * <p>This is authorization only. Authentication is enforced independently by the
 * request matchers in the security configuration, so neither is load-bearing on
 * its own: a handler that forgets to call this is still not reachable anonymously,
 * and a path that slips past the matchers is still refused here.
 */
@Component
@RequiredArgsConstructor
public class RoleGuard {

    private final CognitoAuthService auth;

    /**
     * The caller, or 401 if there is no validated token.
     *
     * <p>The token is checked before the role is read, so an unauthenticated
     * request is refused rather than dereferencing a null {@code Jwt} -- which
     * is what several of these handlers did, answering 500 to anonymous callers
     * and thereby confirming the endpoint was reachable at all.
     */
    public CurrentUserDto requireAuthenticated(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication is required.");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED,
                    "Authentication is required.");
        }
        return user;
    }

    /** The caller, or 403 unless they are a platform administrator. */
    public CurrentUserDto requireAdmin(Jwt jwt) {
        return requireRole(jwt, ADMIN, "This endpoint is restricted to administrators.");
    }

    /**
     * The caller, or 403 unless they are a learner.
     *
     * <p>A learner profile is also required, not just the role: these handlers
     * all resolve {@code currentUser.getLearnerId()} and pass it straight to a
     * service, so an account typed LEARNER with no profile row would read as
     * "every learner" or fail deep inside a query.
     */
    public CurrentUserDto requireLearner(Jwt jwt) {
        CurrentUserDto user = requireRole(jwt, CognitoAuthService.LEARNER_USER_TYPE,
                "This endpoint is restricted to learners.");
        if (user.learnerId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This account has no learner profile.");
        }
        return user;
    }

    /** The caller, or 403 unless they are an administrator or institution-side. */
    public CurrentUserDto requireAdminOrInstitution(Jwt jwt) {
        CurrentUserDto user = requireAuthenticated(jwt);
        String role = normalize(user.role());
        if (!ADMIN.equals(role) && !CognitoAuthService.isInstitutionRole(user.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This endpoint is restricted to administrators and institutions.");
        }
        return user;
    }

    /**
     * The learner id this caller is allowed to act as, given the one they asked for.
     *
     * <p>The defence against one learner addressing another's rows. Several
     * controllers take a learner id from the path or request body and pass it
     * straight to a service, so authenticating the request proves only that
     * SOMEBODY is signed in -- any learner could read or write any other
     * learner's progress by changing a number in the URL.
     *
     * <p>An administrator may act for anyone, which is what the admin screens
     * need. A learner may act only as themselves; asking for another id is 403
     * rather than silently rewritten, because a client sending someone else's
     * id is either broken or probing, and quietly succeeding as the wrong user
     * hides both. A null id means "me", which is the common case.
     */
    public Long requireLearnerScope(Jwt jwt, Long requestedLearnerId) {
        CurrentUserDto user = requireAuthenticated(jwt);
        if (ADMIN.equals(normalize(user.role()))) {
            return requestedLearnerId != null ? requestedLearnerId : user.learnerId();
        }
        Long own = user.learnerId();
        if (own == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This account has no learner profile.");
        }
        if (requestedLearnerId != null && !own.equals(requestedLearnerId)) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "You may only act on your own learner record.");
        }
        return own;
    }

    /** The platform administrator role, which has no constant on the auth service. */
    private static final String ADMIN = "ADMIN";

    private CurrentUserDto requireRole(Jwt jwt, String required, String message) {
        CurrentUserDto user = requireAuthenticated(jwt);
        if (!required.equals(normalize(user.role()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
        }
        return user;
    }

    /** Exact, case-insensitive: a role is a fixed value, never a substring match. */
    private static String normalize(String role) {
        return role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
    }
}
