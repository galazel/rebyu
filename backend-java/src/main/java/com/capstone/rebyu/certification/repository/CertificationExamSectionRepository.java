package com.capstone.rebyu.certification.repository;

import com.capstone.rebyu.certification.entity.CertificationExamSection;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface CertificationExamSectionRepository extends JpaRepository<CertificationExamSection, Long> {

    List<CertificationExamSection> findByCertificationIdOrderByDisplayOrderAsc(Long certificationId);

    @Modifying
    @Query("delete from CertificationExamSection s where s.certificationId = :certificationId")
    void deleteByCertificationId(Long certificationId);
}
