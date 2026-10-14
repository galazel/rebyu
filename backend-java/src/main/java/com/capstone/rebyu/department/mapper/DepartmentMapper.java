package com.capstone.rebyu.department.mapper;

import com.capstone.rebyu.department.dto.DepartmentDto;
import com.capstone.rebyu.department.entity.Department;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;
import org.mapstruct.MappingTarget;

@Mapper(componentModel = "spring")
public interface DepartmentMapper {
    @Mapping(source = "institution.institutionId", target = "institutionId")
    @Mapping(source = "createdBy.userId", target = "createdBy")
    @Mapping(target = "institutionCertId", ignore = true)
    @Mapping(target = "certificationId", ignore = true)
    @Mapping(target = "institutionCertIds", ignore = true)
    @Mapping(target = "certificationIds", ignore = true)
    @Mapping(target = "certifications", ignore = true)
    DepartmentDto toDto(Department entity);

    @AfterMapping
    default void fillCertifications(Department entity, @MappingTarget DepartmentDto dto) {
        var covered = entity.getInstitutionCerts().stream()
                .sorted(java.util.Comparator.comparing(InstitutionCertificate::getInstitutionCertId))
                .map(cert -> new DepartmentDto.CoveredCertification(
                        cert.getInstitutionCertId(),
                        cert.getCertification() == null ? null : cert.getCertification().getCertificationId(),
                        cert.getCertification() == null ? null : cert.getCertification().getTitle(),
                        cert.getTotalSlots(),
                        cert.getUsedSlots(),
                        cert.getStatus() == null ? null : cert.getStatus().name()))
                .toList();
        dto.setCertifications(covered);
        dto.setInstitutionCertIds(covered.stream().map(DepartmentDto.CoveredCertification::institutionCertId).toList());
        dto.setCertificationIds(covered.stream().map(DepartmentDto.CoveredCertification::certificationId).toList());
        if (!covered.isEmpty()) {
            dto.setInstitutionCertId(covered.get(0).institutionCertId());
            dto.setCertificationId(covered.get(0).certificationId());
        }
    }
}
