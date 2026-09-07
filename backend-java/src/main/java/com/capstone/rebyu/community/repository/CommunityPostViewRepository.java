package com.capstone.rebyu.community.repository;

import com.capstone.rebyu.community.entity.CommunityPostMemberId;
import com.capstone.rebyu.community.entity.CommunityPostView;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface CommunityPostViewRepository extends JpaRepository<CommunityPostView, CommunityPostMemberId> {

    /**
     * Records that this learner opened this post, or refreshes when they last
     * did. Written as an upsert for the same reason
     * {@code CommunityPostLikeRepository#addLike} is: the id here is assigned,
     * so save() takes JPA's merge path and merge cannot resolve the id-only
     * post/learner stubs -- and reopening a post must be idempotent rather
     * than a primary-key violation.
     */
    @Modifying
    @Query(value = """
            INSERT INTO community_post_views(post_id, learner_id, created_at, last_viewed_at)
            VALUES (:postId, :learnerId, now(), now())
            ON CONFLICT (post_id, learner_id) DO UPDATE SET last_viewed_at = now()
            """, nativeQuery = true)
    void recordView(@Param("postId") Long postId, @Param("learnerId") Long learnerId);

    long countByPost_PostId(Long postId);
}
