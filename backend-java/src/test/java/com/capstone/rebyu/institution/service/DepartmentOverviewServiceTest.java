package com.capstone.rebyu.institution.service;

import com.capstone.rebyu.institution.dto.InstitutionLearningStatsDtos.MemberLearningStatsDto;
import com.capstone.rebyu.institution.service.DepartmentOverviewService.CertificationSeats;
import com.capstone.rebyu.institution.service.DepartmentOverviewService.LearnerStatus;
import com.capstone.rebyu.institution.service.DepartmentOverviewService.Totals;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class DepartmentOverviewServiceTest {

    private static final LocalDateTime NOW = LocalDateTime.of(2026, 11, 6, 12, 0);

    private static MemberLearningStatsDto member(int assigned, int completed, long lessons, long attempts,
                                                 long passed, Integer avg, LocalDateTime last) {
        Integer passRate = attempts == 0 ? null : (int) Math.round(passed * 100.0 / attempts);
        return new MemberLearningStatsDto(1L, "A", "a", assigned, assigned, completed,
                BigDecimal.TEN, lessons, attempts, passed, passRate, avg, last);
    }

    @Test
    void statusRules() {
        assertThat(DepartmentOverviewService.statusOf(null, NOW)).isEqualTo(LearnerStatus.not_started);
        assertThat(DepartmentOverviewService.statusOf(member(1, 0, 0, 0, 0, null, null), NOW))
                .isEqualTo(LearnerStatus.not_started);
        assertThat(DepartmentOverviewService.statusOf(member(1, 1, 3, 2, 0, 20, NOW.minusDays(40)), NOW))
                .isEqualTo(LearnerStatus.completed);
        assertThat(DepartmentOverviewService.statusOf(member(1, 0, 3, 4, 1, 45, NOW), NOW))
                .isEqualTo(LearnerStatus.at_risk);
        // Reading only (no attempts) recently is on track, not at risk.
        assertThat(DepartmentOverviewService.statusOf(member(1, 0, 5, 0, 0, null, NOW.minusDays(2)), NOW))
                .isEqualTo(LearnerStatus.on_track);
        assertThat(DepartmentOverviewService.statusOf(member(1, 0, 5, 2, 2, 80, NOW.minusDays(20)), NOW))
                .isEqualTo(LearnerStatus.dormant);
    }

    @Test
    void reasonsStateRealNumbers() {
        var m = member(1, 0, 3, 4, 1, 45, NOW);
        assertThat(DepartmentOverviewService.reasonFor(LearnerStatus.at_risk, m, NOW))
                .isEqualTo("Averaging 45% over 4 attempts");
        var idle = member(1, 0, 5, 2, 2, 80, NOW.minusDays(20));
        assertThat(DepartmentOverviewService.reasonFor(LearnerStatus.dormant, idle, NOW))
                .isEqualTo("No activity in 20 days");
    }

    @Test
    void alertsAreSortedAndOnlyRaisedWhenTrue() {
        var expiring = new CertificationSeats(7L, 3L, "IT Passport", 20, 20, "active",
                LocalDate.of(2026, 1, 1), LocalDate.of(2026, 11, 10), 4L);
        var totals = new Totals(10, 8, 1, 2, 1, 0, 6, 0, 0, 2, 1, 1, 0, 20, 20);
        var alerts = DepartmentOverviewService.alerts(List.of(expiring), totals);

        assertThat(alerts).extracting(DepartmentOverviewService.Alert::id)
                .containsExactly("access-expiring-7", "seats-full-7", "learners-at-risk", "learners-dormant");
        assertThat(alerts.get(0).severity()).isEqualTo("critical");
        assertThat(alerts.get(2).title()).isEqualTo("2 learners are at risk");

        var quiet = new Totals(3, 3, 0, 0, 0, 0, 3, 0, 0, 1, 1, 1, 0, 0, 0);
        assertThat(DepartmentOverviewService.alerts(List.of(), quiet)).isEmpty();
    }
}
