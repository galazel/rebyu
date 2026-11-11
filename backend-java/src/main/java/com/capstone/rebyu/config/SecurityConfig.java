package com.capstone.rebyu.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
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
                        // ---- Public: the only endpoints an anonymous caller may reach ----
                        // CORS preflight carries no token.
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        // Health check (Railway) and Spring's error dispatch, so a failing
                        // public request reports its real status rather than 401.
                        .requestMatchers(HttpMethod.GET, "/").permitAll()
                        .requestMatchers("/error").permitAll()
                        // Pre-login flows: sign-in state, partnership request/pricing/status/
                        // registration lookup, department-head code lookup, reference options.
                        .requestMatchers("/api/public/**").permitAll()
                        // PayMongo calls this server-to-server; the controller verifies the signature.
                        .requestMatchers(HttpMethod.POST, "/api/webhooks/paymongo").permitAll()
                        // Badge images are loaded by plain <img src> and embedded in emails,
                        // neither of which can send a bearer token.
                        .requestMatchers(HttpMethod.GET, "/api/certifications/*/badge").permitAll()

                        // ---- Everything else needs a signed-in user ----
                        // Role checks happen in RoleGuard inside each controller/service
                        // (@PreAuthorize is inert: method security is off).
                        .requestMatchers("/api/admin/**").authenticated()
                        .anyRequest().authenticated()
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
