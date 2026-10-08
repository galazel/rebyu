package com.capstone.rebyu.community.repository;

import java.time.Instant;

public interface CommunityPostRow {
    Long getPostId();
    String getAuthorName();
    String getAuthorAvatarKey();
    String getCommunity();
    Instant getCreatedAt();
    String getTitle();
    String getBody();
    String getPostType();
    Long getCircleId();
    String getAttachmentName();
    String getAttachmentType();
    String getAttachmentKey();
    Long getAttachmentSize();
    String getAttachmentsJson();
    long getReactions();
    long getComments();
    long getSaves();
    long getViews();
    boolean getLiked();
    boolean getSaved();
    boolean getOwnedByMe();
}
