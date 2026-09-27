package com.capstone.rebyu.user.presence;

import com.capstone.rebyu.user.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.sql.Timestamp;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;

/**
 * Who is online now, and how many people used REBYU over a week, month or year.
 *
 * <p>Online means "made a signed-in request within {@link #ONLINE_WINDOW}".
 * The frontend pings {@code /api/presence/heartbeat} every minute while a tab
 * is visible, so an idle-but-open page still counts, and a closed tab drops
 * out on its own a few minutes later -- no logout needed.
 *
 * <p>Every database trip costs ~50ms against the remote DB, so a user is
 * written at most once per {@link #TOUCH_INTERVAL}, and that write -- the
 * {@code last_seen_at} stamp plus the day's activity row -- is one statement.
 *
 * <p>Admins are left out of every count: the dashboard measures the people the
 * platform serves, not the people running it.
 */
@Service
@RequiredArgsConstructor
public class PresenceService {

    private static final Logger log = LoggerFactory.getLogger(PresenceService.class);

    public static final Duration ONLINE_WINDOW = Duration.ofMinutes(5);
    private static final Duration TOUCH_INTERVAL = Duration.ofMinutes(1);

    private static final String NOT_ADMIN = "upper(t.user_type_text) <> 'ADMIN'";

    private final UserRepository userRepository;
    private final JdbcTemplate jdbc;

    /** Cognito subject -> nanoTime of the last write for that user. */
    private final Map<String, Long> lastTouched = new ConcurrentHashMap<>();

    public void touch(String cognitoSub) {
        long now = System.nanoTime();
        Long previous = lastTouched.get(cognitoSub);
        if (previous != null && now - previous < TOUCH_INTERVAL.toNanos()) {
            return;
        }
        lastTouched.put(cognitoSub, now);
        try {
            jdbc.update("""
                    with seen as (
                      update users set last_seen_at = ? where cognito_sub = ? returning user_id
                    )
                    insert into user_activity_days (user_id, activity_date)
                    select user_id, ? from seen
                    on conflict (user_id, activity_date) do nothing""",
                    Timestamp.valueOf(LocalDateTime.now()), cognitoSub, LocalDate.now());
        } catch (RuntimeException e) {
            // Presence is a nicety; it must never fail the request it rode in on.
            lastTouched.remove(cognitoSub);
            log.debug("Could not record presence for a user", e);
        }
    }

    public long onlineNow() {
        return userRepository.countNonAdminsSeenSince(LocalDateTime.now().minus(ONLINE_WINDOW));
    }

    public long totalUsers() {
        return userRepository.countNonAdmins();
    }

    /** week and month are drawn a day at a time; year a month at a time. */
    public enum Period {
        WEEK("1 day"),
        MONTH("1 day"),
        YEAR("1 month");

        private final String step;

        Period(String step) {
            this.step = step;
        }

        LocalDate start(LocalDate today) {
            return switch (this) {
                case WEEK -> today.minusDays(6);
                case MONTH -> today.minusDays(29);
                case YEAR -> today.withDayOfMonth(1).minusMonths(11);
            };
        }

        LocalDate end(LocalDate today) {
            return this == YEAR ? today.withDayOfMonth(1) : today;
        }
    }

    public record Point(LocalDate bucket, long activeUsers, long totalUsers) {}

    /**
     * One point per bucket: distinct non-admin users active in it, and
     * non-admin accounts that existed by its end. One query, whatever the period.
     * {@code step} comes from the enum, never from the caller.
     */
    public List<Point> history(Period period) {
        LocalDate today = LocalDate.now();
        String sql = """
                select cast(g.b as date) as bucket,
                  (select count(distinct a.user_id)
                     from user_activity_days a
                     join users u on u.user_id = a.user_id
                     join user_types t on t.user_type_id = u.user_type_id
                    where a.activity_date >= cast(g.b as date)
                      and a.activity_date < cast(g.b + interval '%1$s' as date)
                      and %2$s) as active_users,
                  (select count(*)
                     from users u
                     join user_types t on t.user_type_id = u.user_type_id
                    where u.joined_at < g.b + interval '%1$s'
                      and %2$s) as total_users
                from generate_series(cast(? as timestamp), cast(? as timestamp), interval '%1$s') as g(b)
                order by 1""".formatted(period.step, NOT_ADMIN);
        return jdbc.query(sql,
                (rs, i) -> new Point(
                        rs.getDate("bucket").toLocalDate(),
                        rs.getLong("active_users"),
                        rs.getLong("total_users")),
                Timestamp.valueOf(period.start(today).atStartOfDay()),
                Timestamp.valueOf(period.end(today).atStartOfDay()));
    }
}
