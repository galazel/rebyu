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

@Slf4j
@Component
@Order(2)
@RequiredArgsConstructor
public class UserTypeSeeder implements ApplicationRunner {

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
