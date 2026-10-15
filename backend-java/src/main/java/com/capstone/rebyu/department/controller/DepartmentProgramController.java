package com.capstone.rebyu.department.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.department.entity.DepartmentProgram;
import com.capstone.rebyu.department.entity.InstitutionSection;
import com.capstone.rebyu.department.repository.DepartmentProgramRepository;
import com.capstone.rebyu.department.service.DepartmentService;
import jakarta.persistence.EntityManager;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/departments/{departmentId}/programs")
@RequiredArgsConstructor
public class DepartmentProgramController {

    private final DepartmentProgramRepository programs;
    private final DepartmentService departmentService;
    private final CognitoAuthService auth;
    private final EntityManager entityManager;

    public record ProgramRequest(
            @NotBlank @Size(max = 150) String programName,
            @Size(max = 30) String programCode,
            @Size(max = 2000) String description,
            List<Long> institutionCertIds) {
    }

    public record ProgramCertification(Long institutionCertId, Long certificationId, String title) {
    }

    public record ProgramDto(
            Long programId,
            Long departmentId,
            String programName,
            String programCode,
            String description,
            LocalDateTime createdAt,
            long sectionCount,
            List<ProgramCertification> certifications) {
    }

    @GetMapping
    @Transactional(readOnly = true)
    public List<ProgramDto> list(@AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId) {
        requireDepartmentAccess(jwt, departmentId);
        List<DepartmentProgram> active = programs
                .findByDepartment_DepartmentIdAndStatusOrderByProgramNameAsc(departmentId, DepartmentProgram.Status.active);
        if (active.isEmpty()) return List.of();
        Map<Long, Long> sectionCounts = new HashMap<>();
        for (Object[] row : entityManager.createQuery(
                        "select s.program.programId, count(s) from InstitutionSection s "
                                + "where s.department.departmentId = :dept and s.status = :st and s.program is not null "
                                + "group by s.program.programId", Object[].class)
                .setParameter("dept", departmentId)
                .setParameter("st", InstitutionSection.Status.active)
                .getResultList()) {
            sectionCounts.put((Long) row[0], (Long) row[1]);
        }
        return active.stream()
                .map(p -> toDto(p, sectionCounts.getOrDefault(p.getProgramId(), 0L)))
                .toList();
    }

    @GetMapping("/{programId}")
    @Transactional(readOnly = true)
    public ProgramDto get(@AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId, @PathVariable Long programId) {
        requireDepartmentAccess(jwt, departmentId);
        return toDto(find(departmentId, programId), countSections(programId));
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @Transactional
    public ProgramDto create(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @Valid @RequestBody ProgramRequest request) {
        requireDepartmentAccess(jwt, departmentId);
        String name = request.programName().trim();
        if (programs.existsByDepartment_DepartmentIdAndProgramNameIgnoreCaseAndStatus(
                departmentId, name, DepartmentProgram.Status.active)) {
            throw new IllegalArgumentException("A program named \"" + name + "\" already exists in this department.");
        }
        String code = blankToNull(request.programCode());
        if (code != null && programs.existsByDepartment_DepartmentIdAndProgramCodeIgnoreCaseAndStatus(
                departmentId, code, DepartmentProgram.Status.active)) {
            throw new IllegalArgumentException("A program with code \"" + code + "\" already exists in this department.");
        }
        Department department = entityManager.find(Department.class, departmentId);
        if (request.institutionCertIds() == null || request.institutionCertIds().isEmpty()) {
            throw new IllegalArgumentException("Choose at least one certification for this program.");
        }
        DepartmentProgram saved = programs.save(DepartmentProgram.builder()
                .department(department)
                .institutionCerts(coveredCertifications(department, request.institutionCertIds()))
                .programName(name)
                .programCode(blankToNull(request.programCode()))
                .description(blankToNull(request.description()))
                .createdAt(LocalDateTime.now())
                .status(DepartmentProgram.Status.active)
                .build());
        return toDto(saved, 0);
    }

    @PutMapping("/{programId}")
    @Transactional
    public ProgramDto update(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable Long departmentId,
            @PathVariable Long programId,
            @Valid @RequestBody ProgramRequest request) {
        requireDepartmentAccess(jwt, departmentId);
        DepartmentProgram program = find(departmentId, programId);
        String name = request.programName().trim();
        if (!name.equalsIgnoreCase(program.getProgramName())
                && programs.existsByDepartment_DepartmentIdAndProgramNameIgnoreCaseAndStatus(
                        departmentId, name, DepartmentProgram.Status.active)) {
            throw new IllegalArgumentException("A program named \"" + name + "\" already exists in this department.");
        }
        String code = blankToNull(request.programCode());
        if (code != null && !code.equalsIgnoreCase(program.getProgramCode())
                && programs.existsByDepartment_DepartmentIdAndProgramCodeIgnoreCaseAndStatus(
                        departmentId, code, DepartmentProgram.Status.active)) {
            throw new IllegalArgumentException("A program with code \"" + code + "\" already exists in this department.");
        }
        program.setProgramName(name);
        program.setProgramCode(blankToNull(request.programCode()));
        program.setDescription(blankToNull(request.description()));
        if (request.institutionCertIds() != null && !request.institutionCertIds().isEmpty()) {
            program.setInstitutionCerts(coveredCertifications(program.getDepartment(), request.institutionCertIds()));
        }
        return toDto(programs.save(program), countSections(programId));
    }

    /** Archives the program; its sections stay, unlinked from it. */
    @DeleteMapping("/{programId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    @Transactional
    public void delete(@AuthenticationPrincipal Jwt jwt, @PathVariable Long departmentId, @PathVariable Long programId) {
        requireDepartmentAccess(jwt, departmentId);
        DepartmentProgram program = find(departmentId, programId);
        entityManager.createQuery("update InstitutionSection s set s.program = null where s.program.programId = :id")
                .setParameter("id", programId).executeUpdate();
        program.setStatus(DepartmentProgram.Status.archived);
        programs.save(program);
    }

    private static java.util.Set<com.capstone.rebyu.institution.entity.InstitutionCertificate> coveredCertifications(
            Department department, List<Long> institutionCertIds) {
        java.util.Set<com.capstone.rebyu.institution.entity.InstitutionCertificate> chosen = new java.util.LinkedHashSet<>();
        for (Long id : institutionCertIds) {
            chosen.add(department.getInstitutionCerts().stream()
                    .filter(cert -> id.equals(cert.getInstitutionCertId()))
                    .findFirst()
                    .orElseThrow(() -> new IllegalArgumentException("This department does not cover that certification.")));
        }
        return chosen;
    }

    private DepartmentProgram find(Long departmentId, Long programId) {
        return programs.findByProgramIdAndDepartment_DepartmentIdAndStatus(programId, departmentId, DepartmentProgram.Status.active)
                .orElseThrow(() -> new EntityNotFoundException("Program not found in this department."));
    }

    private long countSections(Long programId) {
        return entityManager.createQuery(
                        "select count(s) from InstitutionSection s where s.program.programId = :id and s.status = :st", Long.class)
                .setParameter("id", programId)
                .setParameter("st", InstitutionSection.Status.active)
                .getSingleResult();
    }

    private static ProgramDto toDto(DepartmentProgram p, long sectionCount) {
        List<ProgramCertification> certs = p.getInstitutionCerts().stream()
                .sorted(java.util.Comparator.comparing(com.capstone.rebyu.institution.entity.InstitutionCertificate::getInstitutionCertId))
                .map(cert -> new ProgramCertification(cert.getInstitutionCertId(),
                        cert.getCertification() == null ? null : cert.getCertification().getCertificationId(),
                        cert.getCertification() == null ? null : cert.getCertification().getTitle()))
                .toList();
        return new ProgramDto(p.getProgramId(), p.getDepartment().getDepartmentId(), p.getProgramName(),
                p.getProgramCode(), p.getDescription(), p.getCreatedAt(), sectionCount, certs);
    }

    private CurrentUserDto requireDepartmentAccess(Jwt jwt, Long departmentId) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.institutionId() == null) {
            throw new IllegalArgumentException("An institution account is required");
        }
        boolean owner = "owner".equalsIgnoreCase(user.departmentHeadRole());
        departmentService.getAccessibleById(departmentId, user.institutionId(), user.userId(), owner);
        return user;
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
