package com.capstone.rebyu.bkt.entity;

public enum BktOutboxStatus {
    PENDING,
    PROCESSING,
    PROCESSED,
    FAILED,
    DEAD_LETTER
}
