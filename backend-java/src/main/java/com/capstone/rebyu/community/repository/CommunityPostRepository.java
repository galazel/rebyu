package com.capstone.rebyu.community.repository;

import com.capstone.rebyu.community.entity.CommunityPost;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface CommunityPostRepository extends JpaRepository<CommunityPost, Long> {

    List<CommunityPost> findByPostTypeOrderByCreatedAtDesc(String postType);

    List<CommunityPost> findAllByOrderByCreatedAtDesc();

    long countByAuthor_LearnerId(Long learnerId);

    long deleteByPostIdAndAuthor_LearnerId(Long postId, Long learnerId);

    @Query("SELECT p.postId FROM CommunityPost p WHERE p.circle.circleId = :circleId")
    List<Long> findPostIdsByCircleId(@Param("circleId") Long circleId);

    @Modifying
    @Query(value = """
            WITH deleted_comments AS (DELETE FROM community_comments     WHERE post_id = :postId),
                 deleted_likes    AS (DELETE FROM community_post_likes   WHERE post_id = :postId),
                 deleted_saves    AS (DELETE FROM community_saved_posts  WHERE post_id = :postId),
                 deleted_reports  AS (DELETE FROM community_post_reports WHERE post_id = :postId),
                 deleted_views    AS (DELETE FROM community_post_views   WHERE post_id = :postId)
            DELETE FROM community_posts WHERE post_id = :postId
            """, nativeQuery = true)
    void deletePostWithEngagement(@Param("postId") Long postId);

    @Query(value = """
            SELECT p.post_id AS postId, concat(l.first_name, ' ', l.last_name) AS authorName, l.avatar_key AS authorAvatarKey, c.name AS community,
              p.created_at AS createdAt, p.title AS title, p.body AS body, p.post_type AS postType, p.circle_id AS circleId,
              p.attachment_name AS attachmentName, p.attachment_type AS attachmentType, p.attachment_key AS attachmentKey,
              p.attachment_size AS attachmentSize, p.attachments_json AS attachmentsJson,
              (SELECT count(*) FROM community_post_likes x WHERE x.post_id=p.post_id) AS reactions,
              (SELECT count(*) FROM community_comments x WHERE x.post_id=p.post_id) AS comments,
              (SELECT count(*) FROM community_saved_posts x WHERE x.post_id=p.post_id) AS saves,
              (SELECT count(*) FROM community_post_views x WHERE x.post_id=p.post_id) AS views,
              EXISTS(SELECT 1 FROM community_post_likes x WHERE x.post_id=p.post_id AND x.learner_id=:learnerId) AS liked,
              EXISTS(SELECT 1 FROM community_saved_posts x WHERE x.post_id=p.post_id AND x.learner_id=:learnerId) AS saved,
              (p.author_learner_id=:learnerId) AS ownedByMe
            FROM community_posts p
            JOIN learners l ON l.learner_id=p.author_learner_id
            LEFT JOIN community_circles c ON c.circle_id=p.circle_id
            WHERE p.moderation_status='VISIBLE'
              AND (p.circle_id IS NULL
                   OR COALESCE(c.visibility, 'PUBLIC') <> 'PRIVATE'
                   OR EXISTS(SELECT 1 FROM community_circle_members m
                             WHERE m.circle_id=p.circle_id AND m.learner_id=:learnerId))
              AND (CAST(:type AS varchar) IS NULL OR p.post_type=:type)
              AND (CAST(:searchPattern AS varchar) IS NULL OR lower(p.title || ' ' || p.body || ' ' || concat(l.first_name,' ',l.last_name)) LIKE :searchPattern)
              AND (:savedOnly = false OR EXISTS(SELECT 1 FROM community_saved_posts s WHERE s.post_id=p.post_id AND s.learner_id=:learnerId))
            ORDER BY p.created_at DESC LIMIT 200
            """, nativeQuery = true)
    List<CommunityPostRow> feed(@Param("learnerId") Long learnerId, @Param("type") String type,
                                 @Param("searchPattern") String searchPattern, @Param("savedOnly") boolean savedOnly);

    @Query(value = """
            SELECT p.post_id AS postId, concat(l.first_name, ' ', l.last_name) AS authorName, l.avatar_key AS authorAvatarKey, c.name AS community,
              p.created_at AS createdAt, p.title AS title, p.body AS body, p.post_type AS postType, p.circle_id AS circleId,
              p.attachment_name AS attachmentName, p.attachment_type AS attachmentType, p.attachment_key AS attachmentKey,
              p.attachment_size AS attachmentSize, p.attachments_json AS attachmentsJson,
              (SELECT count(*) FROM community_post_likes x WHERE x.post_id=p.post_id) AS reactions,
              (SELECT count(*) FROM community_comments x WHERE x.post_id=p.post_id) AS comments,
              (SELECT count(*) FROM community_saved_posts x WHERE x.post_id=p.post_id) AS saves,
              (SELECT count(*) FROM community_post_views x WHERE x.post_id=p.post_id) AS views,
              EXISTS(SELECT 1 FROM community_post_likes x WHERE x.post_id=p.post_id AND x.learner_id=:learnerId) AS liked,
              EXISTS(SELECT 1 FROM community_saved_posts x WHERE x.post_id=p.post_id AND x.learner_id=:learnerId) AS saved,
              (p.author_learner_id=:learnerId) AS ownedByMe
            FROM community_posts p
            JOIN learners l ON l.learner_id=p.author_learner_id
            LEFT JOIN community_circles c ON c.circle_id=p.circle_id
            WHERE p.post_id=:postId
              AND (p.circle_id IS NULL
                   OR COALESCE(c.visibility, 'PUBLIC') <> 'PRIVATE'
                   OR EXISTS(SELECT 1 FROM community_circle_members m
                             WHERE m.circle_id=p.circle_id AND m.learner_id=:learnerId))
            """, nativeQuery = true)
    Optional<CommunityPostRow> findRowById(@Param("postId") Long postId, @Param("learnerId") Long learnerId);
}
