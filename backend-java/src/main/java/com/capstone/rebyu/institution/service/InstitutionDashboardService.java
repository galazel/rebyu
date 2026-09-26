package com.capstone.rebyu.institution.service;

import lombok.RequiredArgsConstructor;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.sql.Timestamp;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;

/**
 * Everything on the institution dashboard, computed in one place.
 *
 * <p>The page used to stitch four reads together in the browser and fill the
 * gaps with guesses -- a department with no slots became "10 slots", the seat
 * count came from a stored counter that had drifted from the real roster, and
 * graded attempts included learners' practice on certifications the
 * institution never licensed. Here every figure is counted from the rows
 * themselves:
 *
 * <ul>
 *   <li><b>Seats used</b> is the number of live enrollments (active or
 *       completed), not {@code institution_certificates.used_slots}.</li>
 *   <li><b>Attempts and lessons</b> count only work on a certification the
 *       learner is enrolled in through this institution, inside the chosen
 *       date range.</li>
 *   <li><b>Progress</b> is the enrollment's current progress. There is no
 *       history of it to replay, so it does not move with the date range.</li>
 * </ul>
 *
 * <p>Tenant-scoped: every query starts from {@code institution_id = ?}, and the
 * id always comes from the caller's JWT.
 *
 * <p>Seven queries, whatever the size of the roster -- each is a ~50ms round
 * trip to the remote database, so nothing here loops per learner.
 */
@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class InstitutionDashboardService {

    /** Below this, an unfinished enrollment is flagged as needing support. */
    private static final int SUPPORT_THRESHOLD = 30;

    private final JdbcTemplate jdbc;

    // ---------------------------------------------------------------- DTOs

    public record RangeDto(LocalDate from, LocalDate to, String granularity) {}

    public record SummaryDto(
            int learners,
            int enrollments,
            int completed,
            int inProgress,
            int notStarted,
            int needingSupport,
            BigDecimal averageProgress,
            int seatsTotal,
            int seatsUsed,
            int activeLearners,
            long lessonsCompleted,
            long gradedAttempts,
            long passedAttempts,
            Integer passRate,
            Integer averageScore) {}

    public record CertificationDto(
            Long institutionCertId,
            Long certificationId,
            String title,
            String status,
            LocalDate accessStartDate,
            LocalDate accessExpiryDate,
            int totalSlots,
            int seatsUsed,
            int departmentSlots) {}

    /** {@code departmentId == null} is the "not in a department" row. */
    public record DepartmentDto(
            Long departmentId,
            String name,
            Long institutionCertId,
            String certificationTitle,
            Integer allottedSlots,
            int enrolled,
            BigDecimal averageProgress,
            int completed,
            int inProgress,
            int notStarted,
            long lessonsCompleted,
            long gradedAttempts,
            Integer passRate,
            Integer averageScore) {}

    /** One row per enrollment: a learner in two certifications is two rows. */
    public record EnrollmentDto(
            Long learnerId,
            String name,
            Long institutionCertId,
            String certificationTitle,
            Long departmentId,
            String departmentName,
            String status,
            BigDecimal progress,
            long lessonsCompleted,
            long gradedAttempts,
            Integer passRate,
            Integer averageScore,
            LocalDateTime lastActivityAt) {}

    public record ProgressBucketDto(String label, int enrollments) {}

    public record TrendPointDto(LocalDateTime bucket, long gradedAttempts, long lessonsCompleted, long activeLearners) {}

    public record InvitationDto(Long invitationId, String email, String name, String status, LocalDateTime sentAt) {}

    public record InvitationsDto(int pending, List<InvitationDto> recent) {}

    public record InstitutionDashboardDto(
            RangeDto range,
            SummaryDto summary,
            List<CertificationDto> certifications,
            List<DepartmentDto> departments,
            List<EnrollmentDto> enrollments,
            List<ProgressBucketDto> progressBuckets,
            List<TrendPointDto> trend,
            InvitationsDto invitations) {}

    // ------------------------------------------------------------- queries

    /** Live enrollments of this institution, keyed to the certification they are for. */
    private static final String ROSTER = """
            roster AS (
              SELECT icl.learner_id, ic.certification_id
                FROM institution_certification_learners icl
                JOIN institution_certificates ic ON ic.institution_cert_id = icl.institution_cert_id
               WHERE ic.institution_id = ? AND icl.status IN ('active', 'completed')
               GROUP BY icl.learner_id, ic.certification_id
            )""";

    private record Enrollment(
            long enrollmentId, long learnerId, long institutionCertId, long certificationId,
            String certificationTitle, String status, BigDecimal progress, boolean completed,
            String name, Long departmentId, String departmentName) {}

    private record Tally(long attempts, long passed, double scoreSum, long scored, long lessons, LocalDateTime last) {
        static final Tally EMPTY = new Tally(0, 0, 0, 0, 0, null);

        Tally plus(Tally o) {
            LocalDateTime latest = last == null ? o.last : o.last == null ? last : (last.isAfter(o.last) ? last : o.last);
            return new Tally(attempts + o.attempts, passed + o.passed, scoreSum + o.scoreSum,
                    scored + o.scored, lessons + o.lessons, latest);
        }

        Integer passRate() {
            return attempts == 0 ? null : (int) Math.round(passed * 100.0 / attempts);
        }

        Integer averageScore() {
            return scored == 0 ? null : (int) Math.round(scoreSum / scored);
        }
    }

    public InstitutionDashboardDto dashboard(Long institutionId, LocalDate from, LocalDate to) {
        LocalDate today = LocalDate.now();
        if (to == null) to = from == null ? LocalDate.of(today.getYear(), 12, 31) : from;
        if (from == null) from = LocalDate.of(to.getYear(), 1, 1);
        if (to.isBefore(from)) {
            LocalDate swap = from;
            from = to;
            to = swap;
        }
        LocalDateTime start = from.atStartOfDay();
        LocalDateTime end = to.plusDays(1).atStartOfDay();
        long days = ChronoUnit.DAYS.between(from, to) + 1;
        String unit = days <= 1 ? "hour" : days <= 62 ? "day" : "month";

        List<CertificationDto> certRows = certifications(institutionId);
        List<Enrollment> roster = enrollments(institutionId);
        List<Object[]> departmentRows = departments(institutionId);
        Map<String, Tally> tallies = tallies(institutionId, start, end);
        List<TrendPointDto> trend = trend(institutionId, start, end, unit);
        InvitationsDto invitations = invitations(institutionId);

        // --- per enrollment
        List<EnrollmentDto> enrollmentDtos = new ArrayList<>();
        Map<Long, Tally> byEnrollment = new HashMap<>();
        for (Enrollment e : roster) {
            Tally t = tallies.getOrDefault(e.learnerId + ":" + e.certificationId, Tally.EMPTY);
            byEnrollment.put(e.enrollmentId, t);
            enrollmentDtos.add(new EnrollmentDto(
                    e.learnerId, e.name, e.institutionCertId, e.certificationTitle,
                    e.departmentId, e.departmentName, e.completed ? "completed" : "active",
                    e.progress, t.lessons, t.attempts, t.passRate(), t.averageScore(), t.last));
        }
        enrollmentDtos.sort(Comparator.comparing(EnrollmentDto::progress).thenComparing(EnrollmentDto::name,
                Comparator.nullsLast(String::compareToIgnoreCase)));

        // --- summary
        Set<Long> learners = new HashSet<>();
        Set<Long> activeLearners = new HashSet<>();
        int completed = 0, notStarted = 0, inProgress = 0, needingSupport = 0;
        BigDecimal progressSum = BigDecimal.ZERO;
        Tally total = Tally.EMPTY;
        for (Enrollment e : roster) {
            learners.add(e.learnerId);
            Tally t = byEnrollment.get(e.enrollmentId);
            if (t.attempts > 0 || t.lessons > 0) activeLearners.add(e.learnerId);
            total = total.plus(t);
            progressSum = progressSum.add(e.progress);
            switch (stage(e)) {
                case "completed" -> completed++;
                case "notStarted" -> notStarted++;
                default -> inProgress++;
            }
            if (!e.completed && e.progress.compareTo(BigDecimal.valueOf(SUPPORT_THRESHOLD)) < 0) needingSupport++;
        }
        int seatsTotal = certRows.stream().filter(c -> "active".equals(c.status())).mapToInt(CertificationDto::totalSlots).sum();
        int seatsUsed = certRows.stream().filter(c -> "active".equals(c.status())).mapToInt(CertificationDto::seatsUsed).sum();

        SummaryDto summary = new SummaryDto(
                learners.size(), roster.size(), completed, inProgress, notStarted, needingSupport,
                roster.isEmpty() ? null : progressSum.divide(BigDecimal.valueOf(roster.size()), 1, RoundingMode.HALF_UP),
                seatsTotal, seatsUsed, activeLearners.size(),
                total.lessons, total.attempts, total.passed, total.passRate(), total.averageScore());

        // --- departments: every active department, even an empty one, then
        // the enrollments that sit in none of them.
        Map<Long, List<Enrollment>> byDepartment = new LinkedHashMap<>();
        List<Enrollment> unassigned = new ArrayList<>();
        for (Enrollment e : roster) {
            if (e.departmentId == null) unassigned.add(e);
            else byDepartment.computeIfAbsent(e.departmentId, k -> new ArrayList<>()).add(e);
        }
        List<DepartmentDto> departmentDtos = new ArrayList<>();
        for (Object[] d : departmentRows) {
            Long id = (Long) d[0];
            departmentDtos.add(department(id, (String) d[1], (Long) d[2], (String) d[3], (Integer) d[4],
                    byDepartment.getOrDefault(id, List.of()), byEnrollment));
        }
        if (!unassigned.isEmpty()) {
            departmentDtos.add(department(null, "Not in a department", null, null, null, unassigned, byEnrollment));
        }

        // --- progress distribution
        int[] buckets = new int[4];
        for (Enrollment e : roster) {
            double p = e.progress.doubleValue();
            buckets[p <= 25 ? 0 : p <= 50 ? 1 : p <= 75 ? 2 : 3]++;
        }
        List<ProgressBucketDto> progressBuckets = List.of(
                new ProgressBucketDto("0-25%", buckets[0]),
                new ProgressBucketDto("26-50%", buckets[1]),
                new ProgressBucketDto("51-75%", buckets[2]),
                new ProgressBucketDto("76-100%", buckets[3]));

        return new InstitutionDashboardDto(
                new RangeDto(from, to, unit),
                summary, certRows, departmentDtos, enrollmentDtos, progressBuckets,
                zeroFill(trend, start, end, unit), invitations);
    }

    private static String stage(Enrollment e) {
        if (e.completed) return "completed";
        return e.progress.signum() == 0 ? "notStarted" : "inProgress";
    }

    private DepartmentDto department(Long id, String name, Long institutionCertId, String certTitle,
                                     Integer slots, List<Enrollment> members, Map<Long, Tally> byEnrollment) {
        int completed = 0, notStarted = 0, inProgress = 0;
        BigDecimal sum = BigDecimal.ZERO;
        Tally t = Tally.EMPTY;
        for (Enrollment e : members) {
            sum = sum.add(e.progress);
            t = t.plus(byEnrollment.get(e.enrollmentId));
            switch (stage(e)) {
                case "completed" -> completed++;
                case "notStarted" -> notStarted++;
                default -> inProgress++;
            }
        }
        return new DepartmentDto(id, name, institutionCertId, certTitle, slots, members.size(),
                members.isEmpty() ? null : sum.divide(BigDecimal.valueOf(members.size()), 1, RoundingMode.HALF_UP),
                completed, inProgress, notStarted, t.lessons, t.attempts, t.passRate(), t.averageScore());
    }

    private List<CertificationDto> certifications(Long institutionId) {
        return jdbc.query("""
                SELECT ic.institution_cert_id, ic.certification_id, c.title, ic.status,
                       ic.access_start_date, ic.access_expiry_date, ic.total_slots,
                       (SELECT count(*) FROM institution_certification_learners icl
                         WHERE icl.institution_cert_id = ic.institution_cert_id
                           AND icl.status IN ('active', 'completed')) AS seats_used,
                       (SELECT coalesce(sum(d.total_slots), 0) FROM departments d
                         WHERE d.institution_cert_id = ic.institution_cert_id AND d.status = 'active') AS dept_slots
                  FROM institution_certificates ic
                  JOIN certifications c ON c.certification_id = ic.certification_id
                 WHERE ic.institution_id = ?
                 ORDER BY c.title""",
                (rs, i) -> new CertificationDto(
                        rs.getLong("institution_cert_id"),
                        rs.getLong("certification_id"),
                        rs.getString("title"),
                        rs.getString("status"),
                        rs.getObject("access_start_date", LocalDate.class),
                        rs.getObject("access_expiry_date", LocalDate.class),
                        rs.getInt("total_slots"),
                        rs.getInt("seats_used"),
                        rs.getInt("dept_slots")),
                institutionId);
    }

    private List<Enrollment> enrollments(Long institutionId) {
        List<Enrollment> rows = jdbc.query("""
                SELECT DISTINCT ON (icl.institution_cert_learner_id)
                       icl.institution_cert_learner_id, icl.learner_id, icl.institution_cert_id,
                       ic.certification_id, c.title, icl.status, icl.progress_percentage, icl.completed_at,
                       l.first_name, l.last_name, l.username,
                       d.department_id, d.department_name
                  FROM institution_certification_learners icl
                  JOIN institution_certificates ic ON ic.institution_cert_id = icl.institution_cert_id
                  JOIN certifications c ON c.certification_id = ic.certification_id
                  JOIN learners l ON l.learner_id = icl.learner_id
                  LEFT JOIN department_learners dl
                         ON dl.institution_cert_learner_id = icl.institution_cert_learner_id AND dl.status = 'active'
                  LEFT JOIN departments d ON d.department_id = dl.department_id AND d.status = 'active'
                 WHERE ic.institution_id = ? AND icl.status IN ('active', 'completed')
                 ORDER BY icl.institution_cert_learner_id, d.department_id NULLS LAST""",
                (rs, i) -> {
                    BigDecimal progress = rs.getBigDecimal("progress_percentage");
                    String status = rs.getString("status");
                    boolean completed = "completed".equals(status) || rs.getTimestamp("completed_at") != null
                            || (progress != null && progress.compareTo(BigDecimal.valueOf(100)) >= 0);
                    long departmentId = rs.getLong("department_id");
                    Long dept = rs.wasNull() ? null : departmentId;
                    return new Enrollment(
                            rs.getLong("institution_cert_learner_id"),
                            rs.getLong("learner_id"),
                            rs.getLong("institution_cert_id"),
                            rs.getLong("certification_id"),
                            rs.getString("title"),
                            status,
                            progress == null ? BigDecimal.ZERO : progress.setScale(1, RoundingMode.HALF_UP),
                            completed,
                            displayName(rs.getString("first_name"), rs.getString("last_name"),
                                    rs.getString("username"), rs.getLong("learner_id")),
                            dept,
                            dept == null ? null : rs.getString("department_name"));
                },
                institutionId);
        return rows;
    }

    /** Active departments: id, name, institution_cert_id, certification title, allotted slots. */
    private List<Object[]> departments(Long institutionId) {
        return jdbc.query("""
                SELECT d.department_id, d.department_name, d.institution_cert_id, c.title, d.total_slots
                  FROM departments d
                  JOIN institution_certificates ic ON ic.institution_cert_id = d.institution_cert_id
                  JOIN certifications c ON c.certification_id = ic.certification_id
                 WHERE d.institution_id = ? AND d.status = 'active'
                 ORDER BY d.department_name""",
                (rs, i) -> new Object[]{
                        rs.getLong(1), rs.getString(2), rs.getLong(3), rs.getString(4), rs.getInt(5)},
                institutionId);
    }

    /** Attempts and lessons in the range, per learner and certification ("learnerId:certificationId"). */
    private Map<String, Tally> tallies(Long institutionId, LocalDateTime start, LocalDateTime end) {
        Map<String, Tally> out = new HashMap<>();
        jdbc.query("WITH " + ROSTER + """
                SELECT a.learner_id, e.certification_id,
                       count(*) AS attempts,
                       count(*) FILTER (WHERE a.passed) AS passed,
                       coalesce(sum(a.percentage), 0) AS score_sum,
                       count(a.percentage) AS scored,
                       max(a.submitted_at) AS last_at
                  FROM assessment_attempts a
                  JOIN exams e ON e.exam_id = a.exam_id
                  JOIN roster r ON r.learner_id = a.learner_id AND r.certification_id = e.certification_id
                 WHERE a.status = 'SUBMITTED' AND a.submitted_at >= ? AND a.submitted_at < ?
                 GROUP BY a.learner_id, e.certification_id""",
                rs -> {
                    Timestamp last = rs.getTimestamp("last_at");
                    out.merge(rs.getLong(1) + ":" + rs.getLong(2),
                            new Tally(rs.getLong("attempts"), rs.getLong("passed"), rs.getDouble("score_sum"),
                                    rs.getLong("scored"), 0, last == null ? null : last.toLocalDateTime()),
                            Tally::plus);
                },
                institutionId, Timestamp.valueOf(start), Timestamp.valueOf(end));
        jdbc.query("WITH " + ROSTER + """
                SELECT lc.learner_id, mj.certification_id, count(*) AS lessons, max(lc.completed_at) AS last_at
                  FROM learner_completed_lessons lc
                  JOIN lessons ls ON ls.lesson_id = lc.lesson_id
                  JOIN middle_categories mc ON mc.middle_category_id = ls.middle_category_id
                  JOIN major_categories mj ON mj.major_category_id = mc.major_category_id
                  JOIN roster r ON r.learner_id = lc.learner_id AND r.certification_id = mj.certification_id
                 WHERE lc.completed_at >= ? AND lc.completed_at < ?
                 GROUP BY lc.learner_id, mj.certification_id""",
                rs -> {
                    Timestamp last = rs.getTimestamp("last_at");
                    out.merge(rs.getLong(1) + ":" + rs.getLong(2),
                            new Tally(0, 0, 0, 0, rs.getLong("lessons"), last == null ? null : last.toLocalDateTime()),
                            Tally::plus);
                },
                institutionId, Timestamp.valueOf(start), Timestamp.valueOf(end));
        return out;
    }

    /** {@code unit} is one of hour/day/month, chosen above -- never caller input. */
    private List<TrendPointDto> trend(Long institutionId, LocalDateTime start, LocalDateTime end, String unit) {
        return jdbc.query("WITH " + ROSTER + """
                , work AS (
                  SELECT a.submitted_at AS at, a.learner_id, 1 AS attempt, 0 AS lesson
                    FROM assessment_attempts a
                    JOIN exams e ON e.exam_id = a.exam_id
                    JOIN roster r ON r.learner_id = a.learner_id AND r.certification_id = e.certification_id
                   WHERE a.status = 'SUBMITTED' AND a.submitted_at >= ? AND a.submitted_at < ?
                  UNION ALL
                  SELECT lc.completed_at, lc.learner_id, 0, 1
                    FROM learner_completed_lessons lc
                    JOIN lessons ls ON ls.lesson_id = lc.lesson_id
                    JOIN middle_categories mc ON mc.middle_category_id = ls.middle_category_id
                    JOIN major_categories mj ON mj.major_category_id = mc.major_category_id
                    JOIN roster r ON r.learner_id = lc.learner_id AND r.certification_id = mj.certification_id
                   WHERE lc.completed_at >= ? AND lc.completed_at < ?
                )
                SELECT date_trunc('%s', at) AS bucket, sum(attempt) AS attempts, sum(lesson) AS lessons,
                       count(DISTINCT learner_id) AS learners
                  FROM work GROUP BY 1 ORDER BY 1""".formatted(unit),
                (rs, i) -> new TrendPointDto(
                        rs.getTimestamp("bucket").toLocalDateTime(),
                        rs.getLong("attempts"), rs.getLong("lessons"), rs.getLong("learners")),
                institutionId, Timestamp.valueOf(start), Timestamp.valueOf(end),
                Timestamp.valueOf(start), Timestamp.valueOf(end));
    }

    /** Every bucket in the range, so a quiet month is a zero on the line rather than a gap. */
    private static List<TrendPointDto> zeroFill(List<TrendPointDto> points, LocalDateTime start, LocalDateTime end, String unit) {
        Map<LocalDateTime, TrendPointDto> byBucket = new HashMap<>();
        points.forEach(p -> byBucket.put(p.bucket(), p));
        List<TrendPointDto> out = new ArrayList<>();
        LocalDateTime cursor = switch (unit) {
            case "hour" -> start.truncatedTo(ChronoUnit.HOURS);
            case "day" -> start.truncatedTo(ChronoUnit.DAYS);
            default -> start.withDayOfMonth(1).truncatedTo(ChronoUnit.DAYS);
        };
        while (cursor.isBefore(end)) {
            out.add(byBucket.getOrDefault(cursor, new TrendPointDto(cursor, 0, 0, 0)));
            cursor = switch (unit) {
                case "hour" -> cursor.plusHours(1);
                case "day" -> cursor.plusDays(1);
                default -> cursor.plusMonths(1);
            };
        }
        return out;
    }

    private InvitationsDto invitations(Long institutionId) {
        int[] pending = {0};
        List<InvitationDto> recent = jdbc.query("""
                SELECT li.invitation_id, li.email, li.first_name, li.last_name, li.status, li.sent_at,
                       count(*) FILTER (WHERE li.status = 'PENDING') OVER () AS pending
                  FROM learner_invitations li
                  JOIN institution_certificates ic ON ic.institution_cert_id = li.institution_cert_id
                 WHERE ic.institution_id = ?
                 ORDER BY li.sent_at DESC NULLS LAST
                 LIMIT 5""",
                (rs, i) -> {
                    pending[0] = rs.getInt("pending");
                    String name = ((rs.getString("first_name") == null ? "" : rs.getString("first_name")) + " "
                            + (rs.getString("last_name") == null ? "" : rs.getString("last_name"))).trim();
                    Timestamp sent = rs.getTimestamp("sent_at");
                    return new InvitationDto(rs.getLong("invitation_id"), rs.getString("email"),
                            name.isEmpty() ? null : name, rs.getString("status"),
                            sent == null ? null : sent.toLocalDateTime());
                },
                institutionId);
        return new InvitationsDto(pending[0], recent);
    }

    private static String displayName(String first, String last, String username, long learnerId) {
        String full = ((first == null ? "" : first) + " " + (last == null ? "" : last)).trim();
        if (!full.isEmpty()) return full;
        return username == null || username.isBlank() ? "Learner #" + learnerId : username;
    }
}
