package com.capstone.rebyu.user.repository;

import com.capstone.rebyu.user.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByCognitoSub(String cognitoSub);

    Optional<User> findByEmailIgnoreCase(String email);

    boolean existsByEmailIgnoreCase(String email);

    List<User> findByUserType_UserTypeText(String userTypeText);

    long countByAccountStatus(User.AccountStatus accountStatus);

    long countByUserType_UserTypeText(String userTypeText);

    /** Admins are left out: the dashboard counts the people the platform serves. */
    @Query("select count(u) from User u where upper(u.userType.userTypeText) <> 'ADMIN'")
    long countNonAdmins();

    @Query("select count(u) from User u where u.lastSeenAt >= :since and upper(u.userType.userTypeText) <> 'ADMIN'")
    long countNonAdminsSeenSince(@Param("since") LocalDateTime since);
}
