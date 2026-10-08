package com.capstone.rebyu.gamification.repository;

public interface LeaderboardRow {
    int getRanking();
    Long getLearnerId();
    String getLearnerName();
    long getXp();
    boolean getCurrentLearner();
}
