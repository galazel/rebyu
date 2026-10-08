package com.capstone.rebyu.auth.security;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.server.ResponseStatusException;

import java.util.Locale;

@Component
@RequiredArgsConstructor
public class RoleGuard {

    private final CognitoAuthService auth;

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

    public CurrentUserDto requireAdmin(Jwt jwt) {
        return requireRole(jwt, ADMIN, "This endpoint is restricted to administrators.");
    }

    public CurrentUserDto requireLearner(Jwt jwt) {
        CurrentUserDto user = requireRole(jwt, CognitoAuthService.LEARNER_USER_TYPE,
                "This endpoint is restricted to learners.");
        if (user.learnerId() == null) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This account has no learner profile.");
        }
        return user;
    }

    public CurrentUserDto requireAdminOrInstitution(Jwt jwt) {
        CurrentUserDto user = requireAuthenticated(jwt);
        String role = normalize(user.role());
        if (!ADMIN.equals(role) && !CognitoAuthService.isInstitutionRole(user.role())) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN,
                    "This endpoint is restricted to administrators and institutions.");
        }
        return user;
    }

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

    private static final String ADMIN = "ADMIN";

    private CurrentUserDto requireRole(Jwt jwt, String required, String message) {
        CurrentUserDto user = requireAuthenticated(jwt);
        if (!required.equals(normalize(user.role()))) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, message);
        }
        return user;
    }

    private static String normalize(String role) {
        return role == null ? "" : role.trim().toUpperCase(Locale.ROOT);
    }
}
