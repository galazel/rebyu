package com.capstone.rebyu.user.config;

import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * Guarantees every account role exists as a row, at startup.
 *
 * <p>These were previously created lazily, each by whichever service first
 * needed it -- {@code CognitoAuthService} makes LEARNER on a learner's first
 * login and INSTITUTION on an institution's, {@code
 * DepartmentHeadProvisioningService} makes DEPARTMENT_HEAD when a member
 * is invited. That works, but it means the table only ever holds the roles
 * that happen to have been exercised: a fresh database shows one row, and the
 * rest appear at unpredictable moments.
 *
 * <p>ADMIN was worse than unpredictable -- it was unreachable. Nothing creates
 * it. It is only ever read, by the partnership services looking for admins to
 * notify ({@code userRepository.findByUserType_UserTypeText("ADMIN")}), so on
 * a rebuilt database there was no ADMIN row, no possible ADMIN user, and no
 * code path that would ever make one. Seeding it here does not create an admin
 * account -- an existing user still has to be pointed at this row -- but it
 * makes doing so possible without hand-writing reference data.
 *
 * <p>Idempotent and additive, exactly like {@link
 * com.capstone.rebyu.assessment.config.ExamTypeSeeder}: only missing rows are
 * inserted, nothing is renamed or deleted, so a database that already carries
 * these (or carries extra roles from an older schema) is left alone.
 *
 * <p>Ordered ahead of the default so the roles exist before anything that
 * resolves a user runs.
 */
@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class UserTypeSeeder implements ApplicationRunner {

    /**
     * Every role the application knows about.
     *
     * <p>Kept as literals rather than referencing the constants scattered
     * across {@code CognitoAuthService}, {@code AdminPartnershipService} and
     * friends: this seeder must not depend on the auth package, and those
     * constants already agree on these exact strings. The column is
     * {@code varchar(20)}, so nothing here may exceed that.
     */
    private static final List<String> REQUIRED_TYPES = List.of(

            "LEARNER",

            "INSTITUTION",

            "DEPARTMENT_HEAD",

            "ADMIN");

    private final UserTypeRepository userTypeRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Set<String> existing = userTypeRepository.findAll().stream()
                .map(UserType::getUserTypeText)
                .collect(Collectors.toCollection(HashSet::new));

        List<UserType> missing = REQUIRED_TYPES.stream()
                .filter(type -> !existing.contains(type))
                .map(type -> {
                    UserType userType = new UserType();
                    userType.setUserTypeText(type);
                    return userType;
                })
                .toList();

        if (missing.isEmpty()) {
            return;
        }

        userTypeRepository.saveAll(missing);
        log.info("Seeded {} missing user type(s): {}", missing.size(),
                missing.stream().map(UserType::getUserTypeText).toList());
    }
}
