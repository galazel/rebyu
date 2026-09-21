package com.capstone.rebyu.department.repository;

import com.capstone.rebyu.department.entity.DepartmentAnnouncement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface DepartmentAnnouncementRepository extends JpaRepository<DepartmentAnnouncement, Long> {

    /** Pinned first, newest first; the author is fetched with it for the byline. */
    @EntityGraph(attributePaths = "createdBy")
    List<DepartmentAnnouncement> findByDepartment_DepartmentIdAndStatusOrderByPinnedDescCreatedAtDesc(
            Long departmentId, DepartmentAnnouncement.Status status);

    Optional<DepartmentAnnouncement> findByDepartmentAnnouncementIdAndDepartment_DepartmentId(
            Long departmentAnnouncementId, Long departmentId);
}
