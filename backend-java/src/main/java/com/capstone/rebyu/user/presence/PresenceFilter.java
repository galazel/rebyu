package com.capstone.rebyu.user.presence;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.core.annotation.Order;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;

/**
 * Marks the caller as seen on every signed-in request.
 *
 * <p>Ordered just after Spring Security (-100), so the token is already
 * verified, and ahead of the Redis response cache, so a request answered from
 * cache still counts as the user being here.
 */
@Component
@Order(-99)
@RequiredArgsConstructor
public class PresenceFilter extends OncePerRequestFilter {

    private final PresenceService presenceService;

    @Override
    protected void doFilterInternal(
            HttpServletRequest request,
            HttpServletResponse response,
            FilterChain filterChain
    ) throws ServletException, IOException {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        if (auth != null && auth.getPrincipal() instanceof Jwt jwt && jwt.getSubject() != null) {
            presenceService.touch(jwt.getSubject());
        }
        filterChain.doFilter(request, response);
    }
}
