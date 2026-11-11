package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.entity.ProgrammingQuestionConfig;
import com.capstone.rebyu.assessment.entity.Question;

import java.util.Locale;

/**
 * SQL questions are answered by a statement, not by a program that runs.
 *
 * <p>A SQL item shows the learner tables with their data (the {@code starter_code} script of
 * CREATE TABLE and INSERT statements) and asks for the statement that does what the question
 * says. The learner cannot run anything: the statement they type is compared with the correct
 * statement, which a SQL item keeps in {@code expected_output}.
 *
 * <p>The comparison first ignores what never changes meaning -- comments, whitespace and line
 * breaks, keyword and identifier case outside string literals, spacing around punctuation, a
 * trailing semicolon. A statement that still differs is judged by AI against the correct one
 * (see {@code AssessmentAttemptService#gradeSqlStatement}), so a different alias or join order
 * that returns the same result is not marked wrong.
 */
final class SqlStatementGrading {

    static final String LANGUAGE = "SQL";

    private SqlStatementGrading() {
    }

    static boolean isSqlStatementQuestion(Question source) {
        ProgrammingQuestionConfig config = source == null ? null : source.getProgrammingQuestionConfig();
        return config != null && LANGUAGE.equalsIgnoreCase(trim(config.getLanguage()));
    }

    static String tablesScript(Question source) {
        ProgrammingQuestionConfig config = source == null ? null : source.getProgrammingQuestionConfig();
        return config == null ? null : config.getStarterCode();
    }

    static String correctStatement(Question source) {
        ProgrammingQuestionConfig config = source == null ? null : source.getProgrammingQuestionConfig();
        return config == null ? null : config.getExpectedOutput();
    }

    static boolean sameStatement(String learner, String correct) {
        String a = normalize(learner);
        return !a.isEmpty() && a.equals(normalize(correct));
    }

    /**
     * Canonical text of a statement: comments removed, case folded and whitespace collapsed
     * outside quoted literals, no space around punctuation, no trailing semicolons.
     */
    static String normalize(String sql) {
        if (sql == null) {
            return "";
        }
        StringBuilder out = new StringBuilder(sql.length());
        boolean pendingSpace = false;
        int i = 0;
        int n = sql.length();
        while (i < n) {
            char c = sql.charAt(i);
            if (c == '-' && i + 1 < n && sql.charAt(i + 1) == '-') {
                while (i < n && sql.charAt(i) != '\n') {
                    i++;
                }
                pendingSpace = true;
                continue;
            }
            if (c == '/' && i + 1 < n && sql.charAt(i + 1) == '*') {
                int end = sql.indexOf("*/", i + 2);
                i = end < 0 ? n : end + 2;
                pendingSpace = true;
                continue;
            }
            if (Character.isWhitespace(c)) {
                pendingSpace = true;
                i++;
                continue;
            }
            if (c == '\'') {
                int start = i++;
                while (i < n) {
                    if (sql.charAt(i) == '\'') {
                        if (i + 1 < n && sql.charAt(i + 1) == '\'') {
                            i += 2;
                            continue;
                        }
                        i++;
                        break;
                    }
                    i++;
                }
                appendToken(out, sql.substring(start, i), pendingSpace);
                pendingSpace = false;
                continue;
            }
            if (c == '"' || c == '`' || c == '[') {
                // Quoted identifiers are case-insensitive in SQLite; drop the quotes and fold.
                char close = c == '[' ? ']' : c;
                int end = sql.indexOf(close, i + 1);
                String name = sql.substring(i + 1, end < 0 ? n : end);
                i = end < 0 ? n : end + 1;
                appendToken(out, name.toLowerCase(Locale.ROOT), pendingSpace);
                pendingSpace = false;
                continue;
            }
            if (isPunctuation(c)) {
                out.append(c);
                pendingSpace = false;
                i++;
                continue;
            }
            int start = i;
            while (i < n) {
                char d = sql.charAt(i);
                if (Character.isWhitespace(d) || isPunctuation(d) || d == '\'' || d == '"'
                        || d == '`' || d == '[' || (d == '-' && i + 1 < n && sql.charAt(i + 1) == '-')
                        || (d == '/' && i + 1 < n && sql.charAt(i + 1) == '*')) {
                    break;
                }
                i++;
            }
            appendToken(out, sql.substring(start, i).toLowerCase(Locale.ROOT), pendingSpace);
            pendingSpace = false;
        }
        String result = out.toString().trim();
        while (result.endsWith(";")) {
            result = result.substring(0, result.length() - 1).trim();
        }
        return result;
    }

    private static void appendToken(StringBuilder out, String token, boolean space) {
        if (space && !out.isEmpty() && !isPunctuation(out.charAt(out.length() - 1))) {
            out.append(' ');
        }
        out.append(token);
    }

    private static boolean isPunctuation(char c) {
        return c == '(' || c == ')' || c == ',' || c == ';' || c == '=' || c == '<' || c == '>'
                || c == '+' || c == '-' || c == '*' || c == '/' || c == '%' || c == '.' || c == '|' || c == '!';
    }

    private static String trim(String value) {
        return value == null ? null : value.trim();
    }
}
