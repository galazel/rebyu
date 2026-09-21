package com.capstone.rebyu.auth.service;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.user.entity.Learner;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.LearnerRepository;
import com.capstone.rebyu.user.repository.UserRepository;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;
import org.springframework.security.oauth2.jwt.Jwt;

import java.time.LocalDateTime;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class CognitoAuthServiceTest {

    private UserRepository userRepository;
    private UserTypeRepository userTypeRepository;
    private LearnerRepository learnerRepository;
    private com.capstone.rebyu.institution.repository.DepartmentHeadRepository departmentHeadRepository;
    private com.capstone.rebyu.institution.repository.InstitutionRepository institutionRepository;
    private com.capstone.rebyu.bkt.client.BktClient bktClient;
    private CognitoAuthService service;

    private static final String SUB = "11111111-2222-3333-4444-555555555555";

    @BeforeEach
    void setUp() {
        userRepository = mock(UserRepository.class);
        userTypeRepository = mock(UserTypeRepository.class);
        learnerRepository = mock(LearnerRepository.class);
        departmentHeadRepository =
                mock(com.capstone.rebyu.institution.repository.DepartmentHeadRepository.class);
        institutionRepository = mock(com.capstone.rebyu.institution.repository.InstitutionRepository.class);
        when(departmentHeadRepository.findByUser_UserId(org.mockito.ArgumentMatchers.anyLong()))
                .thenReturn(java.util.List.of());
        // None of these test accounts are institution contacts -- ensureInstitutionLinkage
        // must be a no-op for them.
        when(institutionRepository.findByPrimaryContactEmailIgnoreCase(org.mockito.ArgumentMatchers.anyString()))
                .thenReturn(Optional.empty());
        bktClient = mock(com.capstone.rebyu.bkt.client.BktClient.class);

        // The service calls back through its own proxy for the transactional
        // resolve. Unproxied here, so the provider hands back the instance
        // itself -- answered lazily because it does not exist yet.
        @SuppressWarnings("unchecked")
        org.springframework.beans.factory.ObjectProvider<CognitoAuthService> self =
                mock(org.springframework.beans.factory.ObjectProvider.class);
        when(self.getObject()).thenAnswer(invocation -> service);

        service = new CognitoAuthService(
                userRepository, userTypeRepository, learnerRepository,
                departmentHeadRepository, institutionRepository,
                bktClient, self);
    }

    @org.junit.jupiter.api.AfterEach
    void clearRequestScope() {
        // The identity cache lives in request scope; a test that binds one must
        // not leave it bound for the next.
        org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
    }

    private Jwt jwt() {
        return jwt("juan@rebyu.test");
    }

    /** A Supabase access token as the resource server hands it over. */
    private Jwt jwt(String email) {
        return Jwt.withTokenValue("access-token")
                .header("alg", "ES256")
                .subject(SUB)
                .audience(java.util.List.of("authenticated"))
                .claim("role", "authenticated")
                .claim("email", email)
                .claim("user_metadata", java.util.Map.of("given_name", "Juan", "family_name", "Cruz"))
                .build();
    }

    private User existingUser(Long id, String email, String sub) {
        UserType type = new UserType();
        type.setUserTypeText("LEARNER");
        return User.builder()
                .userId(id)
                .userType(type)
                .email(email)
                .passwordHash("x")
                .accountStatus(User.AccountStatus.active)
                .joinedAt(LocalDateTime.now())
                .cognitoSub(sub)
                .build();
    }

    @Test
    void alreadyLinkedUserIsReturnedWithoutProvisioning() {
        User linked = existingUser(7L, "juan@rebyu.test", SUB);
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(linked));
        when(learnerRepository.findByUser_UserId(7L)).thenReturn(Optional.empty());

        CurrentUserDto dto = service.syncCurrentUser(jwt(), "access-token");

        assertEquals(7L, dto.userId());
        assertEquals("LEARNER", dto.role());
        verify(userRepository, never()).save(any());
    }

    @Test
    void existingEmailAccountIsLinkedNotDuplicated() {
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.empty());
        User byEmail = existingUser(9L, "juan@rebyu.test", null);
        when(userRepository.findByEmailIgnoreCase("juan@rebyu.test"))
                .thenReturn(Optional.of(byEmail));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        // This account already has its learner profile -- otherwise toDto's
        // legacy repair correctly provisions one, and the assertion below would
        // be testing that repair rather than the linking this test is about.
        when(learnerRepository.findByUser_UserId(9L)).thenReturn(Optional.of(
                Learner.builder().learnerId(4L).user(byEmail).username("juan").build()));

        CurrentUserDto dto = service.syncCurrentUser(jwt(), "access-token");

        assertEquals(9L, dto.userId());
        ArgumentCaptor<User> saved = ArgumentCaptor.forClass(User.class);
        verify(userRepository).save(saved.capture());
        assertEquals(SUB, saved.getValue().getCognitoSub());
        // No new learner profile is created for an existing account.
        verify(learnerRepository, never()).save(any(Learner.class));
    }

    @Test
    void unknownUserIsProvisionedAsLearnerOnly() {
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.empty());
        when(userRepository.findByEmailIgnoreCase("new.learner@rebyu.test"))
                .thenReturn(Optional.empty());
        UserType learnerType = new UserType();
        learnerType.setUserTypeText("LEARNER");
        when(userTypeRepository.findByUserTypeText("LEARNER"))
                .thenReturn(Optional.of(learnerType));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User user = inv.getArgument(0);
            user.setUserId(42L);
            return user;
        });
        when(learnerRepository.existsByUsername(any())).thenReturn(false);
        // Stateful, because provisioning saves the profile and then toDto reads
        // it straight back. A stub that stays empty makes toDto provision a
        // second profile for a learner who already has one -- a mock artefact,
        // not something the real repository would ever do.
        java.util.concurrent.atomic.AtomicReference<Learner> stored = new java.util.concurrent.atomic.AtomicReference<>();
        when(learnerRepository.save(any(Learner.class))).thenAnswer(inv -> {
            Learner saved = inv.getArgument(0);
            stored.set(saved);
            return saved;
        });
        when(learnerRepository.findByUser_UserId(42L))
                .thenAnswer(inv -> Optional.ofNullable(stored.get()));

        CurrentUserDto dto = service.syncCurrentUser(jwt("new.learner@rebyu.test"), "access-token");

        assertEquals(42L, dto.userId());
        // Self-registration must never grant elevated access.
        assertEquals("LEARNER", dto.role());

        ArgumentCaptor<Learner> learner = ArgumentCaptor.forClass(Learner.class);
        verify(learnerRepository).save(learner.capture());
        assertNotNull(learner.getValue().getUsername());
        // Names come from the token's user metadata.
        assertEquals("Juan", learner.getValue().getFirstName());
        assertEquals("Cruz", learner.getValue().getLastName());
    }

    @Test
    void accountMovingFromCognitoIsRelinkedToTheSupabaseSubject() {
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.empty());
        User cognitoEra = existingUser(3L, "moved@rebyu.test", "old-cognito-sub");
        when(userRepository.findByEmailIgnoreCase("moved@rebyu.test")).thenReturn(Optional.of(cognitoEra));
        when(userRepository.save(any(User.class))).thenAnswer(inv -> inv.getArgument(0));
        when(learnerRepository.findByUser_UserId(3L)).thenReturn(Optional.of(
                Learner.builder().learnerId(5L).user(cognitoEra).username("moved").build()));

        CurrentUserDto dto = service.syncCurrentUser(jwt("moved@rebyu.test"), "access-token");

        // Same REBYU account, progress and all -- only the sign-in changed.
        assertEquals(3L, dto.userId());
        assertEquals(SUB, cognitoEra.getCognitoSub());
        verify(learnerRepository, never()).save(any(Learner.class));
    }

    @Test
    void tokenWithoutEmailIsRefused() {
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.empty());
        Jwt noEmail = Jwt.withTokenValue("access-token").header("alg", "ES256").subject(SUB)
                .claim("role", "authenticated").build();

        assertThrows(IllegalStateException.class, () -> service.syncCurrentUser(noEmail, "access-token"));
        verify(userRepository, never()).save(any());
    }

    /**
     * Binds a request scope for the duration of one block, the way a servlet
     * request does around a handler.
     */
    private void inOneRequest(Runnable work) {
        org.springframework.web.context.request.RequestContextHolder.setRequestAttributes(
                new org.springframework.web.context.request.ServletRequestAttributes(
                        new org.springframework.mock.web.MockHttpServletRequest()));
        try {
            work.run();
        } finally {
            org.springframework.web.context.request.RequestContextHolder.resetRequestAttributes();
        }
    }

    @Test
    void identityIsResolvedOnlyOncePerRequest() {
        User linked = existingUser(7L, "juan@rebyu.test", SUB);
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(linked));
        when(learnerRepository.findByUser_UserId(7L)).thenReturn(Optional.empty());

        inOneRequest(() -> {
            CurrentUserDto first = service.syncCurrentUser(jwt(), "access-token");
            CurrentUserDto second = service.syncCurrentUser(jwt(), "access-token");
            assertEquals(first, second);
        });

        // The whole point: a handler and the helper it delegates to share one
        // resolve instead of each paying for the full lookup.
        verify(userRepository, org.mockito.Mockito.times(1)).findByCognitoSub(SUB);
    }

    @Test
    void identityIsNotSharedBetweenRequests() {
        User linked = existingUser(7L, "juan@rebyu.test", SUB);
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(linked));
        when(learnerRepository.findByUser_UserId(7L)).thenReturn(Optional.empty());

        inOneRequest(() -> service.syncCurrentUser(jwt(), "access-token"));
        inOneRequest(() -> service.syncCurrentUser(jwt(), "access-token"));

        // A role repaired between two requests has to be visible on the second.
        verify(userRepository, org.mockito.Mockito.times(2)).findByCognitoSub(SUB);
    }

    @Test
    void evictForcesAFreshResolveWithinTheSameRequest() {
        User linked = existingUser(7L, "juan@rebyu.test", SUB);
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(linked));
        when(learnerRepository.findByUser_UserId(7L)).thenReturn(Optional.empty());

        inOneRequest(() -> {
            service.syncCurrentUser(jwt(), "access-token");
            service.evictCurrentUser();
            service.syncCurrentUser(jwt(), "access-token");
        });

        verify(userRepository, org.mockito.Mockito.times(2)).findByCognitoSub(SUB);
    }

    @Test
    void resolvesWithoutARequestScope() {
        User linked = existingUser(7L, "juan@rebyu.test", SUB);
        when(userRepository.findByCognitoSub(SUB)).thenReturn(Optional.of(linked));
        when(learnerRepository.findByUser_UserId(7L)).thenReturn(Optional.empty());

        // A scheduled job or a test has no request to cache in; the lookup must
        // still work rather than fall over looking for one.
        assertEquals(7L, service.syncCurrentUser(jwt(), "access-token").userId());
    }
}
