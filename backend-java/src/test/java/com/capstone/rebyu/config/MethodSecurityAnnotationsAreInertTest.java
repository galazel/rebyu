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

/**
 * Fails if a method-security annotation is reintroduced while method security
 * is switched off.
 *
 * <h2>The bug this exists to prevent</h2>
 *
 * <p>This application has never called {@code @EnableMethodSecurity}. Without
 * it Spring registers no authorization interceptor, so {@code @PreAuthorize}
 * and friends are silently inert -- and because the security filter chain ends
 * in {@code anyRequest().permitAll()}, an endpoint whose only protection was
 * such an annotation was reachable by anyone on the internet.
 *
 * <p>That is not hypothetical. Six controllers were in exactly that state, and
 * {@code GET /api/admin/payments} -- annotated {@code hasRole('ADMIN')} at
 * class level -- returned every paying learner's name, email address and
 * payment reference to an unauthenticated request. The annotation is the worst
 * kind of defect: it makes the code read as protected during review.
 *
 * <p>Enabling method security is not a drop-in fix either, which is why this
 * test asserts absence rather than presence. {@code hasRole('ADMIN')} requires
 * a granted authority {@code ROLE_ADMIN}; the role here is a column on the
 * REBYU user resolved from the token subject, and no authority is derived from
 * it. Turning method security on without also writing an authorities converter
 * would make every annotated endpoint refuse its own administrators.
 *
 * <p>So the project's rule is: authorization is an explicit call to {@code
 * RoleGuard} in the handler, and authentication is a request matcher in {@code
 * SecurityConfig}. This test holds that line. If method security is ever
 * properly enabled -- annotations plus a converter that grants {@code ROLE_*}
 * authorities, plus tests proving an admin is still admitted -- delete this
 * test in the same change.
 */
class MethodSecurityAnnotationsAreInertTest {

    private static final Path MAIN_JAVA = Path.of("src", "main", "java");

    /**
     * Matches the annotation only where it is used, not where it is discussed.
     *
     * <p>Anchored to the start of a line, so the several javadoc comments that
     * name these annotations in order to explain why they are absent do not
     * register as uses of them -- in a comment the {@code @} is always preceded
     * by the {@code *} of the comment body.
     */
    private static final Pattern ANNOTATION = Pattern.compile(
            "^\\s*@(PreAuthorize|PostAuthorize|PostFilter|PreFilter|Secured|RolesAllowed)\\b",
            Pattern.MULTILINE);

    /** Same anchoring, for the switch that would make the above meaningful. */
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
