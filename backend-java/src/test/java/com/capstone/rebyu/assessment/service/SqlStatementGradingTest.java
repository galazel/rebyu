package com.capstone.rebyu.assessment.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class SqlStatementGradingTest {

    @Test
    void formattingCaseCommentsAndSemicolonDoNotMatter() {
        String correct = "SELECT name, SUM(amount) AS total\nFROM orders\nWHERE status = 'PAID'\nGROUP BY name\nORDER BY total DESC;";
        String learner = "-- my answer\nselect name,sum( amount ) as total from Orders /* paid only */\n"
                + "  where status='PAID' group by name order by total desc";
        assertTrue(SqlStatementGrading.sameStatement(learner, correct));
    }

    @Test
    void stringLiteralsKeepTheirCase() {
        assertFalse(SqlStatementGrading.sameStatement(
                "SELECT * FROM t WHERE s = 'paid'", "SELECT * FROM t WHERE s = 'PAID'"));
    }

    @Test
    void differentStatementsDiffer() {
        assertFalse(SqlStatementGrading.sameStatement(
                "SELECT name FROM t ORDER BY name", "SELECT name FROM t ORDER BY name DESC"));
        assertFalse(SqlStatementGrading.sameStatement("", "SELECT 1"));
    }

    @Test
    void normalisesOperatorsAndQuotedIdentifiers() {
        assertEquals(SqlStatementGrading.normalize("SELECT a - b FROM \"T\""),
                SqlStatementGrading.normalize("select a-b from t"));
    }
}
