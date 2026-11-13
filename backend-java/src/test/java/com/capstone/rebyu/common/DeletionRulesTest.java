package com.capstone.rebyu.common;

import com.capstone.rebyu.institution.entity.Institution;
import com.capstone.rebyu.institution.mapper.InstitutionMapper;
import com.capstone.rebyu.institution.repository.InstitutionCertificateRepository;
import com.capstone.rebyu.institution.repository.InstitutionRepository;
import com.capstone.rebyu.institution.service.InstitutionService;
import com.capstone.rebyu.enrollment.repository.InstitutionCertificationLearnerRepository;
import com.capstone.rebyu.user.service.AccountDeletionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.context.ApplicationEventPublisher;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowCallbackHandler;
import org.springframework.jdbc.datasource.DataSourceTransactionManager;
import org.springframework.jdbc.datasource.DriverManagerDataSource;
import org.springframework.transaction.support.TransactionTemplate;

import java.sql.Connection;
import java.sql.DatabaseMetaData;
import java.sql.ResultSet;
import java.sql.SQLException;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

/** Real SQL in a fresh, disposable H2 database. No application context or live account data. */
class DeletionRulesTest {
    private JdbcTemplate jdbc;
    private CascadeDeleteService cascade;
    private DeletionCleanupService cleanup;
    private TransactionTemplate tx;
    private InstitutionService institutions;

    @BeforeEach
    void database() {
        var ds = new DriverManagerDataSource("jdbc:h2:mem:delete_" + UUID.randomUUID()
                + ";MODE=PostgreSQL;DATABASE_TO_LOWER=TRUE;DB_CLOSE_DELAY=-1", "sa", "");
        jdbc = new CatalogTemplate(ds);
        tx = new TransactionTemplate(new DataSourceTransactionManager(ds));
        cascade = new CascadeDeleteService(jdbc);
        cleanup = mock(DeletionCleanupService.class);
        var repo = mock(InstitutionRepository.class);
        when(repo.findById(1L)).thenReturn(Optional.of(Institution.builder().institutionId(1L).build()));
        institutions = new InstitutionService(repo, cascade, jdbc, cleanup, mock(InstitutionMapper.class),
                mock(InstitutionCertificateRepository.class), mock(InstitutionCertificationLearnerRepository.class));
        for (String sql : SCHEMA.split(";")) if (!sql.isBlank()) jdbc.execute(sql);
        jdbc.update("INSERT INTO users VALUES (1, 'one@example.test', 'subject-one'), (2, 'two@example.test', 'subject-two'), (3, 'three@example.test', null)");
        jdbc.update("INSERT INTO learners VALUES (1, 1, 'avatars/one.png'), (2, 2, null), (3, 3, null)");
        jdbc.update("INSERT INTO certifications VALUES (1), (2)");
        jdbc.update("INSERT INTO institutions VALUES (1), (2)");
        jdbc.update("INSERT INTO institution_certificates VALUES (10, 1, 1), (20, 2, 1)");
        jdbc.update("INSERT INTO institution_certification_learners VALUES (100,10,1,CURRENT_TIMESTAMP,'active'), (101,10,2,CURRENT_TIMESTAMP,'completed'), (102,10,3,CURRENT_TIMESTAMP,'revoked'), (200,20,1,CURRENT_TIMESTAMP,'active')");
        jdbc.update("INSERT INTO learner_certifications (learner_certification_id,learner_id,certification_id,enrolled_at,status) VALUES (1,1,1,CURRENT_TIMESTAMP,'active'), (2,1,2,CURRENT_TIMESTAMP,'active')");
        jdbc.update("INSERT INTO departments VALUES (10,1), (20,2)");
        jdbc.update("INSERT INTO department_learners VALUES (10,100), (20,200)");
        jdbc.update("INSERT INTO major_categories VALUES (10,10), (20,20)");
        jdbc.update("INSERT INTO lessons VALUES (10,10), (20,20)");
        jdbc.update("INSERT INTO lesson_images VALUES (10,10), (20,20)");
        jdbc.update("INSERT INTO exams VALUES (10,10), (20,20), (30,null)");
        jdbc.update("INSERT INTO assessment_attempts VALUES (10,10,1), (20,20,2), (30,30,1)");
        jdbc.update("INSERT INTO attempt_answers VALUES (10,10), (20,20), (30,30)");
        jdbc.update("INSERT INTO assessment_integrity_events VALUES (1,1), (2,2)");
        jdbc.update("INSERT INTO institution_files VALUES (1,1,'files/institution.pdf')");
        jdbc.update("INSERT INTO institution_learner_records VALUES (1,1,1), (2,2,2)");
        jdbc.update("INSERT INTO community_posts VALUES (1,1,'posts/one.pdf'), (2,2,null)");
        jdbc.update("INSERT INTO learner_library_items VALUES (1,1,'file','library/one.pdf'), (2,2,'file','library/two.pdf')");
        jdbc.update("INSERT INTO user_activity_days VALUES (1,1), (2,2)");
        jdbc.update("INSERT INTO tutor_conduct VALUES (1), (2)");
        jdbc.update("INSERT INTO department_head_invitations VALUES (1,'one@example.test'),(2,'two@example.test')");
        jdbc.update("INSERT INTO learner_invitations VALUES (1,10,null,'one@example.test'), (2,20,null,'two@example.test')");
        jdbc.update("INSERT INTO partnership_requests VALUES (1,'one@example.test',null),(2,'two@example.test',2)");
    }

    @Test
    void deletingInstitutionRemovesItsTreeAndKeepsEveryLearnersCourseAccess() {
        tx.executeWithoutResult(status -> institutions.delete(1L));
        assertEquals(0, count("institutions", "institution_id = 1"));
        assertEquals(0, count("institution_certificates", "institution_id = 1"));
        assertEquals(0, count("institution_certification_learners", "institution_cert_id = 10"));
        assertEquals(0, count("department_learners", "department_id = 10"));
        assertEquals(0, count("departments", "institution_id = 1"));
        assertEquals(0, count("institution_learner_records", "institution_id = 1"));
        assertEquals(0, count("lesson_images", "lesson_id = 10"), "soft children of database CASCADE rows must be removed");
        assertEquals(0, count("attempt_answers", "assessment_attempt_id = 10"));
        assertEquals(3, count("learners", "1=1"));
        assertEquals(3, count("users", "1=1"));
        assertEquals(2, count("certifications", "1=1"));
        assertEquals(1, count("learner_certifications", "learner_id = 1 AND certification_id = 1"), "do not duplicate existing course enrollment");
        assertEquals(1, count("learner_certifications", "learner_id = 2 AND certification_id = 1 AND status = 'active'"), "legacy institution-only access becomes lasting enrollment");
        assertEquals(0, count("learner_certifications", "learner_id = 3"), "do not revive revoked assignments");
        assertEquals(1, count("assessment_attempts", "assessment_attempt_id = 30"), "personal attempt survives");
        assertEquals(1, count("institution_certification_learners", "institution_cert_id = 20"), "other institution remains intact");
        verify(cleanup).file("files/institution.pdf");
        verify(cleanup, never()).learner(anyLong());
        verify(cleanup, never()).identity(anyString());
    }

    @Test
    void deletingLearnerErasesOnlyTheirRecordsAndQueuesAllExternalCleanup() {
        var events = mock(ApplicationEventPublisher.class);
        var service = new AccountDeletionService(jdbc, cascade, cleanup, events);
        tx.executeWithoutResult(status -> service.deleteLearner(1L));
        assertEquals(0, count("learners", "learner_id = 1"));
        assertEquals(0, count("users", "user_id = 1"));
        assertEquals(0, count("learner_certifications", "learner_id = 1"));
        assertEquals(0, count("institution_certification_learners", "learner_id = 1"));
        assertEquals(0, count("assessment_attempts", "learner_id = 1"));
        assertEquals(0, count("attempt_answers", "assessment_attempt_id IN (10,30)"));
        assertEquals(0, count("assessment_integrity_events", "learner_id = 1"));
        assertEquals(0, count("user_activity_days", "user_id = 1"));
        assertEquals(0, count("tutor_conduct", "learner_id = 1"));
        assertEquals(0, count("department_head_invitations", "email = 'one@example.test'"));
        assertEquals(0, count("learner_invitations", "email = 'one@example.test'"));
        assertEquals(1, count("learner_invitations", "email = 'two@example.test'"));
        assertEquals(0, count("partnership_requests", "institution_email = 'one@example.test'"));
        assertEquals(2, count("learners", "1=1"));
        assertEquals(2, count("institutions", "1=1"));
        assertEquals(2, count("certifications", "1=1"));
        assertEquals(1, count("assessment_attempts", "learner_id = 2"));
        verify(cleanup).learner(1L);
        verify(cleanup).identity("subject-one");
        verify(cleanup).file("avatars/one.png");
        verify(cleanup).file("posts/one.pdf");
        verify(cleanup).file("library/one.pdf");
    }

    @Test
    void aFailureRollsBackDeletionAndLegacyEnrollmentInsertTogether() {
        doThrow(new IllegalStateException("queue unavailable")).when(cleanup).file(anyString());
        assertThrows(IllegalStateException.class, () -> tx.executeWithoutResult(status -> institutions.delete(1L)));
        assertEquals(1, count("institutions", "institution_id = 1"));
        assertEquals(3, count("institution_certification_learners", "institution_cert_id = 10"));
        assertEquals(1, count("lesson_images", "lesson_id = 10"));
        assertEquals(0, count("learner_certifications", "learner_id = 2"));
    }

    private int count(String table, String where) { return jdbc.queryForObject("SELECT count(*) FROM " + table + " WHERE " + where, Integer.class); }

    /* Only PostgreSQL catalog discovery is adapted to H2's JDBC metadata. All
       application SELECT/INSERT/UPDATE/DELETE statements execute against real tables. */
    private static class CatalogTemplate extends JdbcTemplate {
        CatalogTemplate(javax.sql.DataSource ds) { super(ds); }
        @Override public void query(String sql, RowCallbackHandler callback) {
            if (!sql.contains("pg_constraint") && !sql.contains("pg_class")) { super.query(sql, callback); return; }
            try (Connection c = getDataSource().getConnection()) {
                DatabaseMetaData metadata = c.getMetaData();
                List<String> tables = new ArrayList<>();
                try (ResultSet rs = metadata.getTables(null, "public", "%", new String[]{"TABLE"})) {
                    while (rs.next()) tables.add(rs.getString("TABLE_NAME"));
                }
                for (String table : tables) {
                    if (sql.contains("AS parent_table")) {
                        assertTrue(sql.contains("'c'"), "CASCADE dependencies must be discovered too");
                        try (ResultSet rs = metadata.getImportedKeys(null, "public", table)) {
                            while (rs.next()) {
                                if (rs.getInt("DELETE_RULE") == DatabaseMetaData.importedKeySetNull) continue;
                                callback.processRow(row(Map.of("parent_table", rs.getString("PKTABLE_NAME"), "child_table", table,
                                        "child_column", rs.getString("FKCOLUMN_NAME"), "parent_column", rs.getString("PKCOLUMN_NAME"))));
                            }
                        }
                    } else if (sql.contains("contype = 'p'")) {
                        try (ResultSet rs = metadata.getPrimaryKeys(null, "public", table)) {
                            while (rs.next()) callback.processRow(row(Map.of("table_name", table, "attname", rs.getString("COLUMN_NAME"))));
                        }
                    } else {
                        try (ResultSet rs = metadata.getColumns(null, "public", table, "%")) {
                            while (rs.next()) callback.processRow(row(Map.of("table_name", table, "attname", rs.getString("COLUMN_NAME"),
                                    "attnotnull", rs.getInt("NULLABLE") == DatabaseMetaData.columnNoNulls)));
                        }
                    }
                }
            } catch (SQLException error) { throw new IllegalStateException(error); }
        }
        private ResultSet row(Map<String, Object> fields) throws SQLException {
            ResultSet rs = mock(ResultSet.class);
            for (var entry : fields.entrySet()) {
                if (entry.getValue() instanceof Boolean value) when(rs.getBoolean(entry.getKey())).thenReturn(value);
                else when(rs.getString(entry.getKey())).thenReturn(entry.getValue().toString());
            }
            return rs;
        }
    }

    private static final String SCHEMA = """
            CREATE TABLE users(user_id BIGINT PRIMARY KEY, email TEXT, cognito_sub TEXT);
            CREATE TABLE learners(learner_id BIGINT PRIMARY KEY, user_id BIGINT REFERENCES users(user_id) ON DELETE CASCADE, avatar_key TEXT);
            CREATE TABLE certifications(certification_id BIGINT PRIMARY KEY);
            CREATE TABLE institutions(institution_id BIGINT PRIMARY KEY);
            CREATE TABLE institution_certificates(institution_cert_id BIGINT PRIMARY KEY, institution_id BIGINT REFERENCES institutions(institution_id) ON DELETE CASCADE, certification_id BIGINT REFERENCES certifications(certification_id));
            CREATE TABLE institution_certification_learners(institution_cert_learner_id BIGINT PRIMARY KEY, institution_cert_id BIGINT REFERENCES institution_certificates(institution_cert_id), learner_id BIGINT REFERENCES learners(learner_id), assigned_at TIMESTAMP, status TEXT);
            CREATE TABLE learner_certifications(learner_certification_id BIGINT GENERATED BY DEFAULT AS IDENTITY(START WITH 1000) PRIMARY KEY, learner_id BIGINT REFERENCES learners(learner_id) ON DELETE CASCADE, certification_id BIGINT REFERENCES certifications(certification_id), order_detail_id BIGINT, enrolled_at TIMESTAMP, status TEXT);
            CREATE TABLE departments(department_id BIGINT PRIMARY KEY, institution_id BIGINT REFERENCES institutions(institution_id));
            CREATE TABLE department_learners(department_id BIGINT REFERENCES departments(department_id), institution_cert_learner_id BIGINT REFERENCES institution_certification_learners(institution_cert_learner_id), PRIMARY KEY(department_id,institution_cert_learner_id));
            CREATE TABLE major_categories(major_category_id BIGINT PRIMARY KEY, owner_department_id BIGINT REFERENCES departments(department_id) ON DELETE CASCADE);
            CREATE TABLE lessons(lesson_id BIGINT PRIMARY KEY, major_category_id BIGINT REFERENCES major_categories(major_category_id) ON DELETE CASCADE);
            CREATE TABLE lesson_images(lesson_image_id BIGINT PRIMARY KEY, lesson_id BIGINT);
            CREATE TABLE exams(exam_id BIGINT PRIMARY KEY, owner_department_id BIGINT REFERENCES departments(department_id));
            CREATE TABLE assessment_attempts(assessment_attempt_id BIGINT PRIMARY KEY, exam_id BIGINT REFERENCES exams(exam_id), learner_id BIGINT);
            CREATE TABLE attempt_answers(answer_id BIGINT PRIMARY KEY, assessment_attempt_id BIGINT REFERENCES assessment_attempts(assessment_attempt_id));
            CREATE TABLE assessment_integrity_events(event_id BIGINT PRIMARY KEY, learner_id BIGINT);
            CREATE TABLE institution_files(file_id BIGINT PRIMARY KEY, institution_id BIGINT REFERENCES institutions(institution_id) ON DELETE CASCADE, storage_key TEXT);
            CREATE TABLE institution_learner_records(record_id BIGINT PRIMARY KEY, institution_id BIGINT, learner_id BIGINT);
            CREATE TABLE community_posts(post_id BIGINT PRIMARY KEY, author_learner_id BIGINT REFERENCES learners(learner_id), attachment_key TEXT);
            CREATE TABLE learner_library_items(library_item_id BIGINT PRIMARY KEY, learner_id BIGINT REFERENCES learners(learner_id), item_type TEXT, resource_url TEXT);
            CREATE TABLE user_activity_days(activity_id BIGINT PRIMARY KEY, user_id BIGINT);
            CREATE TABLE tutor_conduct(learner_id BIGINT PRIMARY KEY);
            CREATE TABLE department_head_invitations(department_head_invitation_id BIGINT PRIMARY KEY, email TEXT);
            CREATE TABLE learner_invitations(invitation_id BIGINT PRIMARY KEY, institution_cert_id BIGINT REFERENCES institution_certificates(institution_cert_id), learner_id BIGINT REFERENCES learners(learner_id), email TEXT);
            CREATE TABLE partnership_requests(request_id BIGINT PRIMARY KEY, institution_email TEXT, institution_id BIGINT REFERENCES institutions(institution_id));
            """;
}
