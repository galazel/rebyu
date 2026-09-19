package com.capstone.rebyu.user.config;

import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.mockito.ArgumentCaptor;

import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyIterable;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class UserTypeSeederTest {

    private UserTypeRepository repository;
    private UserTypeSeeder seeder;

    @BeforeEach
    void setUp() {
        repository = mock(UserTypeRepository.class);
        seeder = new UserTypeSeeder(repository);
    }

    private static UserType type(String text) {
        UserType userType = new UserType();
        userType.setUserTypeText(text);
        return userType;
    }

    @SuppressWarnings("unchecked")
    private Set<String> savedTypes() {
        ArgumentCaptor<Iterable<UserType>> saved = ArgumentCaptor.forClass(Iterable.class);
        verify(repository).saveAll(saved.capture());
        List<UserType> rows = (List<UserType>) saved.getValue();
        return rows.stream().map(UserType::getUserTypeText).collect(Collectors.toSet());
    }

    /**
     * The case that matters on a rebuilt database: nothing exists, so every
     * role has to be created -- including ADMIN, which no other code path in
     * the application will ever create.
     */
    @Test
    void seedsEveryRoleOnAnEmptyDatabase() {
        when(repository.findAll()).thenReturn(List.of());

        seeder.run(null);

        assertEquals(
                Set.of("LEARNER", "INSTITUTION", "INSTITUTION_MEMBER", "ADMIN"),
                savedTypes());
    }

    /** Additive: only the missing rows are written. */
    @Test
    void insertsOnlyWhatIsMissing() {
        when(repository.findAll()).thenReturn(List.of(type("LEARNER"), type("INSTITUTION")));

        seeder.run(null);

        assertEquals(Set.of("INSTITUTION_MEMBER", "ADMIN"), savedTypes());
    }

    /** Re-running on a seeded database writes nothing at all. */
    @Test
    void isANoOpWhenEveryRoleAlreadyExists() {
        when(repository.findAll()).thenReturn(List.of(
                type("LEARNER"), type("INSTITUTION"),
                type("INSTITUTION_MEMBER"), type("ADMIN")));

        seeder.run(null);

        verify(repository, never()).saveAll(anyIterable());
    }

    /**
     * `user_types.user_type_text` is varchar(20); a longer literal here would
     * fail at insert time on a real database rather than in this test suite.
     */
    @Test
    void everySeededRoleFitsTheColumn() {
        when(repository.findAll()).thenReturn(List.of());

        seeder.run(null);

        savedTypes().forEach(text ->
                assertEquals(text, text.substring(0, Math.min(20, text.length())),
                        "role '" + text + "' exceeds the 20-character column"));
    }
}
