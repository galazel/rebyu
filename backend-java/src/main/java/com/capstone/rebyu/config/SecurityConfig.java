package com.capstone.rebyu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.oauth2.core.DelegatingOAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2Error;
import org.springframework.security.oauth2.core.OAuth2TokenValidator;
import org.springframework.security.oauth2.core.OAuth2TokenValidatorResult;
import org.springframework.security.oauth2.jose.jws.SignatureAlgorithm;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.security.oauth2.jwt.JwtDecoder;
import org.springframework.security.oauth2.jwt.JwtValidators;
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.header.writers.HstsHeaderWriter;

@Configuration
@EnableWebSecurity
public class SecurityConfig {

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
                .csrf(csrf -> csrf.disable())
                .cors(cors -> {})
                .headers(headers -> headers
                        .frameOptions(frameOptions -> frameOptions.deny())
                        .contentTypeOptions(Customizer.withDefaults())
                        .addHeaderWriter(new HstsHeaderWriter())
                )
                .authorizeHttpRequests(authorize -> authorize
                        .requestMatchers("/api/auth/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST,
                                "/api/learners/accept-invitation").authenticated()
                        .requestMatchers("/api/learners/me/**").authenticated()
                        .requestMatchers("/api/admin/partnership-requests/**").authenticated()
                        .requestMatchers("/api/departments/**").authenticated()
                        .requestMatchers("/api/department-head-assignments/**").authenticated()
                        .requestMatchers("/api/department-learners/**").authenticated()
                        .requestMatchers("/api/institution/invitations/**").authenticated()
                        .requestMatchers("/api/institution/certification-access").authenticated()
                        .requestMatchers("/api/institution/partnership-requests/**").authenticated()
                        .requestMatchers("/api/institution/me/**").authenticated()
                        .requestMatchers("/api/institution/license", "/api/institution/license/**",
                                "/api/institution/entitlements").authenticated()
                        .requestMatchers("/api/learners/me/portal").authenticated()
                        .requestMatchers("/api/institution-certificates/**").authenticated()
                        .requestMatchers("/api/institution-certification-learners/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/exam-results/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET, "/api/users", "/api/users/*").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.GET,
                                "/api/learner-certifications", "/api/learner-certifications/*").authenticated()
                        .requestMatchers("/api/learners", "/api/learners/*").authenticated()
                        .requestMatchers("/api/institutions/**").authenticated()
                        .requestMatchers("/api/department-heads/**").authenticated()
                        .requestMatchers("/api/notifications/**").authenticated()
                        .requestMatchers("/api/learner-achievements/**").authenticated()
                        .requestMatchers("/api/study-plans/**").authenticated()
                        .requestMatchers("/api/recall-sessions/**").authenticated()
                        .requestMatchers("/api/review-sessions/**").authenticated()
                        .requestMatchers("/api/study-desk/**").authenticated()
                        .requestMatchers("/api/learner/analytics/**").authenticated()
                        .requestMatchers("/api/learner/**").authenticated()
                        .requestMatchers("/api/partnership-requests/**").authenticated()
                        .requestMatchers("/api/partnership-request-items/**").authenticated()
                        .requestMatchers("/api/admin/**").authenticated()
                        .requestMatchers("/api/user-types", "/api/user-types/**").authenticated()
                        .requestMatchers("/api/admin/bkt/**", "/api/admin/adaptive/**").authenticated()
                        .requestMatchers("/api/admin/reference/**").authenticated()
                        .requestMatchers("/api/admin/community/reports/**").authenticated()
                        .requestMatchers("/api/community/**").authenticated()
                        .requestMatchers("/api/ai/tutor", "/api/ai/tutor/**").authenticated()
                        .requestMatchers("/api/ai/past-papers/**").authenticated()
                        .requestMatchers("/api/ai/workflows/**").authenticated()
                        .requestMatchers("/api/bkt/**").authenticated()
                        .requestMatchers("/api/streaks/**").authenticated()
                        .requestMatchers("/api/notification-preferences/**").authenticated()
                        .requestMatchers("/api/ai/**").authenticated()
                        .requestMatchers("/api/learner-orders/**", "/api/learner-order-details/**").authenticated()
                        .requestMatchers("/api/learner-completed-lessons/**").authenticated()
                        .requestMatchers("/api/learner-invitations/**").authenticated()
                        .requestMatchers("/api/exam-questions/**", "/api/exam-types/**").authenticated()
                        .requestMatchers("/api/achievements/**", "/api/leaderboards/**").authenticated()
                        .requestMatchers("/api/learner-practice/**", "/api/learner-tools/**").authenticated()
                        .requestMatchers("/api/dashboard-layout/**", "/api/gamification/**").authenticated()
                        .requestMatchers("/api/subscription/**").authenticated()
                        .requestMatchers("/api/institution/files/**").authenticated()
                        .requestMatchers("/api/admin/subscriptions/**", "/api/admin/subscriptions").authenticated()
                        .requestMatchers("/api/questions/**").authenticated()
                        .requestMatchers("/api/choices/**").authenticated()
                        .requestMatchers("/api/text-question-configs/**").authenticated()
                        .requestMatchers("/api/programming-question-configs/**").authenticated()
                        .requestMatchers("/api/diagram-question-configs/**").authenticated()
                        .requestMatchers("/api/exams", "/api/exams/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST,
                                "/api/certifications", "/api/certifications/generate",
                                "/api/major-categories", "/api/middle-categories", "/api/lessons").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.PUT,
                                "/api/certifications/**", "/api/major-categories/**",
                                "/api/middle-categories/**", "/api/lessons/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                                "/api/certifications/**", "/api/major-categories/**",
                                "/api/middle-categories/**", "/api/lessons/**").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.DELETE,
                                "/api/files").authenticated()
                        .requestMatchers(org.springframework.http.HttpMethod.POST,
                                "/api/files/upload", "/api/files/upload/certification",
                                "/api/files/upload/question-image").authenticated()
                        .requestMatchers("/api/challenges/**").authenticated()
                        .requestMatchers("/api/challenge-arenas/**").authenticated()
                        .requestMatchers("/api/worldcup/**").authenticated()
                        .anyRequest().permitAll()
                )
                .oauth2ResourceServer(oauth2 -> oauth2.jwt(Customizer.withDefaults()))
                .build();
    }

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("${spring.security.oauth2.resourceserver.jwt.issuer-uri}") String issuerUri
    ) {
        NimbusJwtDecoder decoder = NimbusJwtDecoder
                .withJwkSetUri(jwkSetUri(issuerUri))
                .jwsAlgorithm(SignatureAlgorithm.ES256)
                .restOperations(jwksClient())
                .build();

        OAuth2TokenValidator<Jwt> tokenUseIsAccess = jwt -> {
            boolean userAudience = jwt.getAudience() != null && jwt.getAudience().contains("authenticated");
            if (userAudience && "authenticated".equals(jwt.getClaimAsString("role"))) {
                return OAuth2TokenValidatorResult.success();
            }
            return OAuth2TokenValidatorResult.failure(
                    new OAuth2Error("invalid_token", "Not a signed-in user's access token", null));
        };

        decoder.setJwtValidator(new DelegatingOAuth2TokenValidator<>(
                JwtValidators.createDefaultWithIssuer(issuerUri),
                tokenUseIsAccess
        ));
        return decoder;
    }

    private static org.springframework.web.client.RestTemplate jwksClient() {
        org.springframework.http.client.SimpleClientHttpRequestFactory factory =
                new org.springframework.http.client.SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(java.time.Duration.ofSeconds(10));
        factory.setReadTimeout(java.time.Duration.ofSeconds(15));
        return new org.springframework.web.client.RestTemplate(factory);
    }

    private static String jwkSetUri(String issuerUri) {
        if (issuerUri == null || issuerUri.isBlank()) {
            throw new IllegalStateException(
                    "spring.security.oauth2.resourceserver.jwt.issuer-uri is not set");
        }
        String trimmed = issuerUri.trim();
        String withoutTrailingSlash = trimmed.endsWith("/")
                ? trimmed.substring(0, trimmed.length() - 1)
                : trimmed;
        return withoutTrailingSlash + "/.well-known/jwks.json";
    }
}
