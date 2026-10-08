package com.capstone.rebyu.config;

import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Test;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;

class MethodSecurityAnnotationsAreInertTest {

    private static final Path MAIN_JAVA = Path.of("src", "main", "java");

    private static final Pattern ANNOTATION = Pattern.compile(
            "^\\s*@(PreAuthorize|PostAuthorize|PostFilter|PreFilter|Secured|RolesAllowed)\\b",
            Pattern.MULTILINE);

    private static final Pattern ENABLING = Pattern.compile(
            "^\\s*@Enable(Global)?MethodSecurity\\b", Pattern.MULTILINE);

    @Test
    @DisplayName("no @PreAuthorize/@Secured in main: method security is not enabled, so they do nothing")
    void noMethodSecurityAnnotations() throws IOException {
        List<String> offenders = new ArrayList<>();

        try (Stream<Path> files = Files.walk(MAIN_JAVA)) {
            for (Path file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
                String source = Files.readString(file, StandardCharsets.UTF_8);
                Matcher matcher = ANNOTATION.matcher(source);
                while (matcher.find()) {
                    int line = (int) source.substring(0, matcher.start()).lines().count() + 1;
                    offenders.add("%s:%d  %s".formatted(file, line, matcher.group().trim()));
                }
            }
        }

        assertThat(offenders)
                .withFailMessage("""
                        Method security is NOT enabled in this application, so these annotations \
                        do nothing and the endpoints they appear to protect fall through to \
                        anyRequest().permitAll():

                        %s

                        Authorize with an explicit RoleGuard call in the handler (guard.requireAdmin(jwt) \
                        / guard.requireLearner(jwt)), and add the path to SecurityConfig so it also \
                        cannot be reached anonymously."""
                        .formatted(String.join("\n", offenders)))
                .isEmpty();
    }

    @Test
    @DisplayName("method security is still off, so the rule above still applies")
    void methodSecurityIsStillDisabled() throws IOException {
        List<String> enabling = new ArrayList<>();

        try (Stream<Path> files = Files.walk(MAIN_JAVA)) {
            for (Path file : files.filter(p -> p.toString().endsWith(".java")).toList()) {
                String source = Files.readString(file, StandardCharsets.UTF_8);
                if (ENABLING.matcher(source).find()) {
                    enabling.add(file.toString());
                }
            }
        }

        assertThat(enabling)
                .withFailMessage("""
                        Method security appears to have been enabled in %s.

                        That is a welcome change, but it is not complete on its own: hasRole('ADMIN') \
                        needs a granted ROLE_ADMIN authority, and this application derives no \
                        authorities from the user's role. Add a JwtAuthenticationConverter that grants \
                        them, prove with a test that an actual admin is still admitted, then delete \
                        this test class."""
                        .formatted(enabling))
                .isEmpty();
    }
}
