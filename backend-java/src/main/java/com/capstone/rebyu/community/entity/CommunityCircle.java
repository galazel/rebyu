package com.capstone.rebyu.community.entity;

import com.capstone.rebyu.user.entity.Learner;
import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.OffsetDateTime;

@Entity
@Table(name = "community_circles")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CommunityCircle {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "circle_id")
    private Long circleId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "owner_learner_id", nullable = false)
    private Learner owner;

    @Column(nullable = false, length = 120)
    private String name;

    @Column(nullable = false, length = 1000)
    private String description;

    @Column(nullable = false, length = 120)
    private String topic;

    /**
     * "PUBLIC" or "PRIVATE". Public is the default and what every circle made
     * before this column existed is treated as.
     *
     * <p>Deliberately nullable in the mapping even though it is never written
     * null: this schema is built by Hibernate {@code ddl-auto: update}, and a
     * NOT NULL column added to a table that already has rows fails outright.
     * Every read coalesces a missing value to PUBLIC, so an old row behaves
     * the way it always has rather than quietly becoming private.
     */
    @Column(length = 16)
    @Builder.Default
    private String visibility = CommunityCircle.PUBLIC;

    public static final String PUBLIC = "PUBLIC";
    public static final String PRIVATE = "PRIVATE";

    /** True only for a circle explicitly marked private. */
    public boolean isPrivate() {
        return PRIVATE.equalsIgnoreCase(visibility);
    }

    @Column(name = "created_at", nullable = false)
    @Builder.Default
    private OffsetDateTime createdAt = OffsetDateTime.now();
}
