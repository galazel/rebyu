package com.capstone.rebyu.user.presence;

import com.capstone.rebyu.auth.security.RoleGuard;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;

@RestController
@RequiredArgsConstructor
public class PresenceController {

    private final PresenceService presenceService;
    private final RoleGuard guard;

    /**
     * "Still here." The work happens in {@link PresenceFilter}; this only gives
     * an idle tab something cheap to call. A GET on purpose: every POST flushes
     * the whole Redis response cache, and this fires once a minute per user.
     */
    @GetMapping("/api/presence/heartbeat")
    public ResponseEntity<Void> heartbeat() {
        return ResponseEntity.noContent().build();
    }

    public record PresenceMetrics(
            long onlineUsers,
            long totalUsers,
            long onlineWindowMinutes,
            String period,
            List<PresenceService.Point> history) {}

    /** Online now, total users, and active users over a week, month or year. Admins are not counted. */
    @GetMapping("/api/admin/presence")
    public ResponseEntity<PresenceMetrics> presence(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(defaultValue = "week") String period) {
        guard.requireAdmin(jwt);
        PresenceService.Period resolved;
        try {
            resolved = PresenceService.Period.valueOf(period.toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            return ResponseEntity.badRequest().build();
        }
        return ResponseEntity.ok(new PresenceMetrics(
                presenceService.onlineNow(),
                presenceService.totalUsers(),
                PresenceService.ONLINE_WINDOW.toMinutes(),
                resolved.name().toLowerCase(Locale.ROOT),
                presenceService.history(resolved)));
    }
}
