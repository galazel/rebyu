package com.capstone.rebyu.institutiongroup.repository;

import com.capstone.rebyu.institutiongroup.entity.GroupAnnouncement;
import org.springframework.data.jpa.repository.EntityGraph;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface GroupAnnouncementRepository extends JpaRepository<GroupAnnouncement, Long> {

    /** Pinned first, newest first; the author is fetched with it for the byline. */
    @EntityGraph(attributePaths = "createdBy")
    List<GroupAnnouncement> findByInstitutionGroup_InstitutionGroupIdAndStatusOrderByPinnedDescCreatedAtDesc(
            Long institutionGroupId, GroupAnnouncement.Status status);

    Optional<GroupAnnouncement> findByGroupAnnouncementIdAndInstitutionGroup_InstitutionGroupId(
            Long groupAnnouncementId, Long institutionGroupId);
}
