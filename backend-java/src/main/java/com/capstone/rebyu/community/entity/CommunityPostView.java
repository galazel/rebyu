package com.capstone.rebyu.community.entity;

import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

/**
 * One learner having opened one shared post: the quiz they attempted, the
 * flashcards they studied, the reviewer they read.
 *
 * <p>Keyed on (post, learner) rather than appended per open, so the count a
 * post shows is how many people opened it, not how many times it was clicked --
 * the second number a single learner can run up on their own by reopening a
 * file, which would say nothing about whether the post was useful to anyone.
 * {@code lastViewedAt} keeps the recency that the row-per-open shape would
 * otherwise have carried.
 */
@Entity
@Table(name = "community_post_views")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityPostView {

    @EmbeddedId
    private CommunityPostMemberId id;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("postId")
    @JoinColumn(name = "post_id")
    private CommunityPost post;

    @ManyToOne(fetch = FetchType.LAZY)
    @MapsId("learnerId")
    @JoinColumn(name = "learner_id")
    private Learner learner;

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();

    @Column(name = "last_viewed_at", nullable = false)
    @Builder.Default
    private OffsetDateTime lastViewedAt = OffsetDateTime.now();
}
