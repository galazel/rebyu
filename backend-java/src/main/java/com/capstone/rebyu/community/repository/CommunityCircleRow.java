package com.capstone.rebyu.community.repository;

public interface CommunityCircleRow {
    Long getCircleId();
    String getName();
    String getDescription();
    String getTopic();
    String getVisibility();
    long getMembers();
    boolean getJoined();
    boolean getOwner();
}
