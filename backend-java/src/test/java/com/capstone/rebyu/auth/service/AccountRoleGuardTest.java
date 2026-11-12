package com.capstone.rebyu.auth.service;

import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.UserRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.util.Optional;

import static com.capstone.rebyu.auth.service.CognitoAuthService.DEPARTMENT_HEAD_USER_TYPE;
import static com.capstone.rebyu.auth.service.CognitoAuthService.INSTITUTION_USER_TYPE;
import static com.capstone.rebyu.auth.service.CognitoAuthService.LEARNER_USER_TYPE;
import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class AccountRoleGuardTest {

    private UserRepository users;
    private AccountRoleGuard guard;

    @BeforeEach
    void setUp() {
        users = mock(UserRepository.class);
        guard = new AccountRoleGuard(users);
        when(users.findByEmailIgnoreCase(anyString())).thenReturn(Optional.empty());
    }

    private static User account(String role) {
        UserType type = new UserType();
        type.setUserTypeText(role);
        return User.builder().userId(1L).email("a@b.com").userType(type).build();
    }

    private void registered(String role) {
        when(users.findByEmailIgnoreCase("a@b.com")).thenReturn(Optional.of(account(role)));
    }

    @Test
    void freeEmailFitsAnyRole() {
        assertThat(guard.conflictingRole("a@b.com", INSTITUTION_USER_TYPE)).isEmpty();
        assertThat(guard.conflictingRole("a@b.com", DEPARTMENT_HEAD_USER_TYPE)).isEmpty();
        assertThat(guard.conflictingRole("a@b.com", LEARNER_USER_TYPE)).isEmpty();
    }

    @Test
    void learnerEmailCannotBecomeStaff() {
        registered(LEARNER_USER_TYPE);
        assertThatThrownBy(() -> guard.requireFreeFor("a@b.com", INSTITUTION_USER_TYPE))
                .hasMessageContaining("already has a learner account");
        assertThatThrownBy(() -> guard.requireFreeFor("a@b.com", DEPARTMENT_HEAD_USER_TYPE))
                .hasMessageContaining("already has a learner account");
    }

    @Test
    void staffEmailCannotBeInvitedAsLearner() {
        registered(INSTITUTION_USER_TYPE);
        assertThat(guard.conflictingRole("a@b.com", LEARNER_USER_TYPE)).contains(INSTITUTION_USER_TYPE);
        registered(DEPARTMENT_HEAD_USER_TYPE);
        assertThat(guard.conflictingRole("a@b.com", LEARNER_USER_TYPE)).contains(DEPARTMENT_HEAD_USER_TYPE);
    }

    @Test
    void ownerMayHeadADepartmentButHeadCannotBecomeInstitution() {
        registered(INSTITUTION_USER_TYPE);
        assertThat(guard.conflictingRole("a@b.com", DEPARTMENT_HEAD_USER_TYPE)).isEmpty();
        registered(DEPARTMENT_HEAD_USER_TYPE);
        assertThat(guard.conflictingRole("a@b.com", INSTITUTION_USER_TYPE)).contains(DEPARTMENT_HEAD_USER_TYPE);
    }

    @Test
    void newSignupClaimsOnlyTheRoleItSignedUpFor() {
        User fresh = account(LEARNER_USER_TYPE);
        assertThatCode(() -> guard.requireCanClaim(fresh, "institution", INSTITUTION_USER_TYPE)).doesNotThrowAnyException();
        assertThatCode(() -> guard.requireCanClaim(fresh, "department", DEPARTMENT_HEAD_USER_TYPE)).doesNotThrowAnyException();
        assertThatThrownBy(() -> guard.requireCanClaim(fresh, "institution", DEPARTMENT_HEAD_USER_TYPE))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> guard.requireCanClaim(fresh, null, INSTITUTION_USER_TYPE))
                .isInstanceOf(IllegalArgumentException.class);
        assertThatThrownBy(() -> guard.requireCanClaim(fresh, "learner", DEPARTMENT_HEAD_USER_TYPE))
                .isInstanceOf(IllegalArgumentException.class);
    }
}
