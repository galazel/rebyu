package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.auth.service.CognitoAdminService;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.institution.dto.DepartmentHeadInviteRequestDto;
import com.capstone.rebyu.institution.dto.DepartmentHeadDto;
import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.entity.DepartmentHead;
import com.capstone.rebyu.institution.mapper.DepartmentHeadMapper;
import com.capstone.rebyu.institution.repository.DepartmentHeadRepository;
import com.capstone.rebyu.user.entity.User;
import com.capstone.rebyu.user.entity.UserType;
import com.capstone.rebyu.user.repository.UserRepository;
import com.capstone.rebyu.user.repository.UserTypeRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;

/**
 * Lets an institution create a login account for someone new -- a group leader,
 * a co-admin -- the same way the institution's own owner account was created on
 * partnership approval: a Cognito account is minted (credentials emailed), and
 * the person is linked as an DepartmentHead of the caller's own institution.
 *
 * Never mints an "owner": that role is reserved for the account created when
 * the admin approves the partnership request.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class DepartmentHeadProvisioningService {

    public record InviteResult(DepartmentHeadDto member, boolean emailed, String note) {}

    private final CognitoAdminService cognitoAdminService;
    private final UserRepository userRepository;
    private final UserTypeRepository userTypeRepository;
    private final DepartmentHeadRepository departmentHeadRepository;
    private final DepartmentHeadMapper departmentHeadMapper;

    /**
     * Everyone this service creates is a non-owner (an owner is rejected above),
     * so they are typed DEPARTMENT_HEAD rather than INSTITUTION -- the latter
     * identifies the institution's own account. Both roles carry the same
     * permissions; see CognitoAuthService.isInstitutionRole.
     */
    private static final String DEPARTMENT_HEAD_USER_TYPE =
            CognitoAuthService.DEPARTMENT_HEAD_USER_TYPE;

    @Transactional
    public InviteResult inviteMember(Institution institution, DepartmentHeadInviteRequestDto request) {
        if (request.getHeadRole() == DepartmentHead.HeadRole.owner) {
            throw new BusinessRuleException.DepartmentRuleException(
                    "An owner account can only be created when a partnership request is approved.");
        }

        User existingUser = userRepository.findByEmailIgnoreCase(request.getEmail()).orElse(null);
        if (existingUser != null) {
            boolean alreadyMember = !departmentHeadRepository
                    .findByInstitution_InstitutionIdAndUser_UserId(
                            institution.getInstitutionId(), existingUser.getUserId())
                    .isEmpty();
            if (alreadyMember) {
                throw new BusinessRuleException.DepartmentRuleException(
                        "This person is already a member of your institution.");
            }
        }

        CognitoAdminService.ProvisionResult provision = cognitoAdminService.createInstitutionAccount(
                request.getEmail(), request.getFirstName(), request.getLastName());

        User user = existingUser;
        if (provision.cognitoSub() != null || provision.emailed()) {
            UserType institutionType = userTypeRepository.findByUserTypeText(DEPARTMENT_HEAD_USER_TYPE)
                    .orElseGet(() -> {
                        UserType type = new UserType();
                        type.setUserTypeText(DEPARTMENT_HEAD_USER_TYPE);
                        return userTypeRepository.save(type);
                    });

            if (user == null) {
                user = User.builder()
                        .userType(institutionType)
                        .email(request.getEmail())
                        .passwordHash("COGNITO")
                        .accountStatus(User.AccountStatus.active)
                        .joinedAt(LocalDateTime.now())
                        .cognitoSub(provision.cognitoSub())
                        .build();
            }
            user.setUserType(institutionType);
            if (user.getCognitoSub() == null && provision.cognitoSub() != null) {
                user.setCognitoSub(provision.cognitoSub());
            }
            user = userRepository.save(user);
        } else if (user == null) {
            // Cognito says the account already exists, but we have no local User
            // record to link it to -- can't safely add them as a member.
            throw new BusinessRuleException.DepartmentRuleException(
                    "An account already exists for " + request.getEmail()
                            + ", but it could not be linked automatically. Ask them to sign in once first.");
        }

        DepartmentHead member = DepartmentHead.builder()
                .institution(institution)
                .user(user)
                .firstName(request.getFirstName().trim())
                .lastName(request.getLastName().trim())
                .headRole(request.getHeadRole())
                .isPrimaryContact(false)
                .joinedAt(LocalDateTime.now())
                .build();
        member = departmentHeadRepository.save(member);

        log.info("Institution {} invited new member {} (role={}); emailed={}",
                institution.getInstitutionId(), request.getEmail(), request.getHeadRole(), provision.emailed());

        return new InviteResult(departmentHeadMapper.toDto(member), provision.emailed(), provision.note());
    }
}
