package com.capstone.rebyu.config;

import org.junit.jupiter.api.Test;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.orm.jpa.JpaSystemException;

import java.io.EOFException;
import java.sql.SQLException;

import static org.assertj.core.api.Assertions.assertThat;

class TransientDatabaseRetryConfigTest {

    @Test
    void aConnectionDroppedMidQueryIsRetried() {
        SQLException io = new SQLException("An I/O error occurred while sending to the backend.", "08006",
                new EOFException());
        assertThat(TransientDatabaseRetryConfig.isDroppedConnection(
                new RuntimeException("JDBC exception executing SQL", io))).isTrue();
    }

    @Test
    void aClosedConnectionOnRollbackIsRetried() {
        JpaSystemException rollback = new JpaSystemException(
                new RuntimeException("Unable to rollback against JDBC Connection",
                        new SQLException("Connection is closed")));
        assertThat(TransientDatabaseRetryConfig.isDroppedConnection(rollback)).isTrue();
    }

    @Test
    void ordinaryQueryAndDataErrorsAreNotRetried() {
        assertThat(TransientDatabaseRetryConfig.isDroppedConnection(
                new SQLException("relation \"x\" does not exist", "42P01"))).isFalse();
        assertThat(TransientDatabaseRetryConfig.isDroppedConnection(
                new DataIntegrityViolationException("duplicate key"))).isFalse();
        assertThat(TransientDatabaseRetryConfig.isDroppedConnection(
                new IllegalArgumentException("Admin access is required"))).isFalse();
    }
}
