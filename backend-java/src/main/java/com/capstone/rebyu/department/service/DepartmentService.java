package com.capstone.rebyu.department.service;

import com.capstone.rebyu.common.BusinessRuleException;
import com.capstone.rebyu.department.dto.DepartmentDto;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentHeadAssignment;
import com.capstone.rebyu.department.entity.DepartmentLearner;
import com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository;
import com.capstone.rebyu.department.repository.DepartmentLearnerRepository;
import com.capstone.rebyu.department.mapper.DepartmentMapper;
import com.capstone.rebyu.department.repository.DepartmentRepository;
import com.capstone.rebyu.enrollment.entity.InstitutionCertificationLearner;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.notification.entity.LearnerInvitation;
import com.capstone.rebyu.notification.repository.LearnerInvitationRepository;
import com.capstone.rebyu.notification.service.NotificationService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Objects;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class DepartmentService {

    private final DepartmentRepository departmentRepository;
    private final DepartmentHeadAssignmentRepository departmentHeadAssignmentRepository;
    private final InstitutionCertificateRepository institutionCertificateRepository;
    private final DepartmentLearnerRepository departmentLearnerRepository;
    private final InstitutionCertificationLearnerRepository institutionCertificationLearnerRepository;
    private final LearnerInvitationRepository learnerInvitationRepository;
    private final NotificationService notificationService;
    private final DepartmentMapper departmentMapper;

    // institutionId is always the JWT-derived caller (never client-supplied and
    // never optional here) so this can never fall through to a global fetch.
    // institutionCertId, when given, narrows further -- but only within that same
    // institution, so a caller can't read another tenant's groups by guessing
    // an institutionCertId that belongs to a different institution.
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAll(Long institutionId, Long institutionCertId) {
        List<Department> groups = departmentRepository.findByInstitution_InstitutionId(institutionId);
        if (institutionCertId != null) {
            groups = groups.stream()
                    .filter(g -> g.getInstitutionCert() != null && institutionCertId.equals(g.getInstitutionCert().getInstitutionCertId()))
                    .toList();
        }
        return groups.stream().map(departmentMapper::toDto).toList();
    }

    /**
     * Owners may see every group in their institution. Other Institution Members
     * receive only the groups for which they are an active authority.
     */
    @Transactional(readOnly = true)
    public List<DepartmentDto> getAccessible(
            Long institutionId, Long userId, boolean owner, Long institutionCertId) {
        List<Department> groups = owner
                ? departmentRepository.findByInstitution_InstitutionId(institutionId)
                : departmentRepository.findActiveAuthorizedGroups(
                        institutionId,
                        userId,
                        Department.Status.active,
                        DepartmentHeadAssignment.Status.active);
        return groups.stream()
                .filter(group -> institutionCertId == null || Objects.equals(group.getInstitutionCert().getInstitutionCertId(), institutionCertId))
                .map(departmentMapper::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public DepartmentDto getAccessibleById(Long id, Long institutionId, Long userId, boolean owner) {
        Department entity = findEntity(id);
        requireSameInstitution(entity, institutionId);
        boolean hasAccess = owner || departmentHeadAssignmentRepository.existsByDepartmentAndUserAndStatus(
                entity,
                com.capstone.rebyu.user.entity.User.builder().userId(userId).build(),
                DepartmentHeadAssignment.Status.active);
        if (!hasAccess) {
            throw new EntityNotFoundException("Department not found: " + id);
        }
        return departmentMapper.toDto(entity);
    }

    @Transactional(readOnly = true)
    public DepartmentDto getById(Long id, Long callerInstitutionId) {
        Department entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        return departmentMapper.toDto(entity);
    }

    public DepartmentDto create(DepartmentDto dto) {
        log.info("Creating institution group '{}' for institutionCertId={}", dto.getDepartmentName(), dto.getInstitutionCertId());

        InstitutionCertificate institutionCert = institutionCertificateRepository.findById(dto.getInstitutionCertId())
                .orElseThrow(() -> new EntityNotFoundException(
                        "InstitutionCertificate not found: " + dto.getInstitutionCertId()));

        // The org cert allocation referenced by the group must belong to the
        // SAME institution the caller was resolved to -- otherwise a caller
        // could create a group under an allocation owned by another tenant.
        Long institutionCertInstitutionId = institutionCert.getInstitution() != null
                ? institutionCert.getInstitution().getInstitutionId() : null;
        if (!Objects.equals(dto.getInstitutionId(), institutionCertInstitutionId)) {
            throw new EntityNotFoundException("InstitutionCertificate not found: " + dto.getInstitutionCertId());
        }

        // A single group can't be handed more slots than the certification
        // allocation itself has -- a real (if generous) sanity bound. It does
        // NOT sum across sibling groups; that would require re-validating every
        // other group whenever one changes.
        if (dto.getTotalSlots() > institutionCert.getTotalSlots()) {
            throw new BusinessRuleException.DepartmentRuleException(
                    "This group can have at most " + institutionCert.getTotalSlots()
                            + " slot(s) -- the certification's own allocation limit.");
        }

        Department entity = departmentMapper.toEntity(dto);
        entity.setDepartmentId(null);
        // The mapper builds DETACHED stubs for the institutionCert/institution FKs (id
        // set, @Version null). Persisting the group against those stubs throws
        // "uninitialized version value 'null'". Attach the managed institutionCert we
        // already loaded (and its managed institution) instead.
        entity.setInstitutionCert(institutionCert);
        entity.setInstitution(institutionCert.getInstitution());
        entity.setCreatedAt(dto.getCreatedAt() != null ? dto.getCreatedAt() : LocalDateTime.now());
        entity.setStatus(dto.getStatus() != null ? dto.getStatus() : Department.Status.active);
        entity.setUsedSlots(0);
        DepartmentDto result = departmentMapper.toDto(departmentRepository.save(entity));
        log.info("Institution group created with id: {}", result.getDepartmentId());
        return result;
    }

    public DepartmentDto update(Long id, DepartmentDto dto, Long callerInstitutionId) {
        log.info("Updating institution group id: {}", id);
        // Mutate editable fields only; createdBy/createdAt/institution/institutionCert/
        // usedSlots are immutable here -- usedSlots only changes via invitations.
        Department entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);
        entity.setDepartmentName(dto.getDepartmentName());
        entity.setDepartmentDescription(dto.getDepartmentDescription());
        if (dto.getTotalSlots() != null) {
            if (dto.getTotalSlots() < entity.getUsedSlots()) {
                throw new BusinessRuleException.DepartmentRuleException(
                        "This group already has " + entity.getUsedSlots()
                                + " slot(s) in use -- lower the limit no further than that.");
            }
            InstitutionCertificate institutionCert = entity.getInstitutionCert();
            if (institutionCert != null && dto.getTotalSlots() > institutionCert.getTotalSlots()) {
                throw new BusinessRuleException.DepartmentRuleException(
                        "This group can have at most " + institutionCert.getTotalSlots()
                                + " slot(s) -- the certification's own allocation limit.");
            }
            entity.setTotalSlots(dto.getTotalSlots());
        }
        if (dto.getStatus() != null) {
            entity.setStatus(dto.getStatus());
        }
        return departmentMapper.toDto(departmentRepository.save(entity));
    }

    /**
     * Archives a group and hands back every seat it was holding.
     *
     * <p>Archiving used to flip a status flag and nothing else, so the learners
     * stayed enrolled in a group that no longer existed and the allocation's
     * {@code used_slots} kept counting seats nobody could reach -- a group
     * deleted with one learner in it left the certification reading 1/25
     * forever, and that seat could never be re-issued.
     *
     * <p>A seat is reserved when an invitation is SENT and stays reserved once
     * it is accepted, so both ends have to be released here:
     *
     * <ul>
     *   <li><b>Pending invitations</b> are revoked -- their token would
     *       otherwise place the accepting learner into an archived group.</li>
     *   <li><b>Active enrolments</b> are revoked and their group membership
     *       archived.</li>
     *   <li><b>Completed enrolments</b> keep both the record and the seat. The
     *       learner finished the certification; erasing that to reclaim a slot
     *       would be rewriting history, and the dashboard counts a completed
     *       enrolment as a live seat too.</li>
     * </ul>
     *
     * <p>The allocation's counter is decremented once per seat actually freed
     * rather than by the group's own {@code usedSlots}, so a group whose
     * counter has already drifted cannot push the allocation negative. Both
     * counters are clamped at zero for the same reason.
     *
     * <p>All of it runs in this method's transaction alongside the archive:
     * {@code InstitutionCertificate} carries an {@code @Version} lock, so a
     * concurrent invitation batch either sees the released seats or fails and
     * retries -- it can never interleave with a half-released group.
     */
    public void delete(Long id, Long callerInstitutionId) {
        log.info("Archiving institution group id: {}", id);
        Department entity = findEntity(id);
        requireSameInstitution(entity, callerInstitutionId);

        int freedSeats = revokePendingInvitations(entity) + releaseLearners(entity);

        InstitutionCertificate institutionCert = entity.getInstitutionCert();
        if (institutionCert != null && freedSeats > 0) {
            institutionCert.setUsedSlots(Math.max(0, institutionCert.getUsedSlots() - freedSeats));
            institutionCertificateRepository.save(institutionCert);
        }
        entity.setUsedSlots(Math.max(0, entity.getUsedSlots() - freedSeats));

        entity.setStatus(Department.Status.archived);
        departmentRepository.save(entity);

        log.info("Institution group {} archived; {} seat(s) returned to institutionCert {}",
                id, freedSeats,
                institutionCert != null ? institutionCert.getInstitutionCertId() : null);
    }

    /**
     * Revokes the group's still-pending invitations. Returns the number of
     * seats freed -- one per invitation, matching the one-per-invitation
     * reservation made when they were sent.
     */
    private int revokePendingInvitations(Department group) {
        List<LearnerInvitation> pending = learnerInvitationRepository
                .findByDepartment_DepartmentIdAndStatus(
                        group.getDepartmentId(), LearnerInvitation.Status.PENDING);
        for (LearnerInvitation invitation : pending) {
            invitation.setStatus(LearnerInvitation.Status.REVOKED);
        }
        learnerInvitationRepository.saveAll(pending);
        return pending.size();
    }

    /**
     * Removes the group's active members and unenrols the ones whose enrolment
     * is still running. Returns the number of seats freed.
     *
     * <p>Every active membership is archived -- the group is gone, so nobody
     * remains a member of it -- but only an {@code active} enrolment is
     * revoked and refunded. A {@code completed} one keeps its seat, and a
     * {@code revoked} one never held a seat to give back.
     */
    private int releaseLearners(Department group) {
        List<DepartmentLearner> memberships = departmentLearnerRepository
                .findByDepartment_DepartmentId(group.getDepartmentId()).stream()
                .filter(m -> m.getStatus() == DepartmentLearner.Status.active)
                .toList();

        LocalDateTime now = LocalDateTime.now();
        int freed = 0;
        for (DepartmentLearner membership : memberships) {
            membership.setStatus(DepartmentLearner.Status.archived);
            membership.setRemovedAt(now);

            InstitutionCertificationLearner enrollment = membership.getInstitutionCertLearner();
            if (enrollment != null
                    && enrollment.getStatus() == InstitutionCertificationLearner.Status.active) {
                enrollment.setStatus(InstitutionCertificationLearner.Status.revoked);
                institutionCertificationLearnerRepository.save(enrollment);
                notifyUnenrolled(group, enrollment);
                freed++;
            }
        }
        departmentLearnerRepository.saveAll(memberships);
        return freed;
    }

    /**
     * Tells the learner their access ended. Losing a certification without a
     * word is the kind of thing people file a support ticket about, and the
     * group leader who did it is not necessarily someone they can ask.
     */
    private void notifyUnenrolled(Department group, InstitutionCertificationLearner enrollment) {
        if (enrollment.getLearner() == null || enrollment.getLearner().getUser() == null) {
            return;
        }
        String certificationTitle = enrollment.getInstitutionCert() != null
                && enrollment.getInstitutionCert().getCertification() != null
                        ? enrollment.getInstitutionCert().getCertification().getTitle()
                        : "a certification";
        notificationService.notify(
                enrollment.getLearner().getUser(),
                "Your enrolment ended",
                group.getDepartmentName() + " was removed by your institution, so your access to "
                        + certificationTitle + " has ended.",
                null);
    }

    private void requireSameInstitution(Department entity, Long callerInstitutionId) {
        Long ownerInstitutionId = entity.getInstitution() != null
                ? entity.getInstitution().getInstitutionId() : null;
        if (!Objects.equals(ownerInstitutionId, callerInstitutionId)) {
            throw new EntityNotFoundException("Department not found: " + entity.getDepartmentId());
        }
    }

    private Department findEntity(Long id) {
        return departmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Department not found: " + id));
    }
}
