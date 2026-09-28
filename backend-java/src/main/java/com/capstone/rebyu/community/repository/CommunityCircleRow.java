package com.capstone.rebyu.community.repository;

/** Spring Data interface projection for the study-circle list's aggregate native query. */
public interface CommunityCircleRow {
    Long getCircleId();
    String getName();
    String getDescription();
    String getTopic();
    /** "PUBLIC" or "PRIVATE"; never null -- the query coalesces an older row to PUBLIC. */
    String getVisibility();
    long getMembers();
    boolean getJoined();
    boolean getOwner();
}
