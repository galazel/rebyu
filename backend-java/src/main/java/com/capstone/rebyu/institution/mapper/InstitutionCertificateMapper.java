package com.capstone.rebyu.institution.mapper;



import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.certification.entity.Certification;
import com.capstone.rebyu.institution.dto.InstitutionCertificateDto;
import com.capstone.rebyu.institution.entity.InstitutionCertificate;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@Mapper(componentModel = "spring")
public interface InstitutionCertificateMapper {
    @Mapping(source = "institution.institutionId", target = "institutionId")
    @Mapping(source = "certification.certificationId", target = "certificationId")
    InstitutionCertificateDto toDto(InstitutionCertificate entity);

    @Mapping(source = "institutionId", target = "institution.institutionId")
    @Mapping(source = "certificationId", target = "certification.certificationId")
    InstitutionCertificate toEntity(InstitutionCertificateDto dto);
}
