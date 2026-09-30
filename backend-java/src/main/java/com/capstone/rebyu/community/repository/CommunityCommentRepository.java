package com.capstone.rebyu.community.repository;

import com.capstone.rebyu.community.entity.CommunityComment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;

public interface CommunityCommentRepository extends JpaRepository<CommunityComment, Long> {

    @Query("""
            SELECT c
            FROM CommunityComment c
            JOIN FETCH c.author
            JOIN FETCH c.post
            LEFT JOIN FETCH c.parentComment
            WHERE c.post.postId = :postId
            ORDER BY c.createdAt ASC
            """)
    List<CommunityComment> findByPostIdWithAuthors(@Param("postId") Long postId);

    long countByPost_PostId(Long postId);

    /**
     * A comment and every reply hanging off it, in one statement.
     *
     * <p>Deleting the parent on its own leaves its replies pointing at a row
     * that is gone -- the foreign key refuses it, and if it did not, the
     * thread would render a set of orphans answering nothing. The model is
     * one level deep (a reply cannot itself be replied to), so a single pass
     * over `parent_comment_id` is the whole subtree.
     */
    @org.springframework.data.jpa.repository.Modifying
    @Query("DELETE FROM CommunityComment c WHERE c.commentId = :commentId OR c.parentComment.commentId = :commentId")
    int deleteWithReplies(@Param("commentId") Long commentId);
}
