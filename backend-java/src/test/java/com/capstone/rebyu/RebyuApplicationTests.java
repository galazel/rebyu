package com.capstone.rebyu;

import com.capstone.rebyu.assessment.dto.GlobalAssessmentTimers;
import com.capstone.rebyu.assessment.service.AssessmentTimerService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.transaction.annotation.Transactional;

import static org.junit.jupiter.api.Assertions.assertEquals;

@SpringBootTest
class RebyuApplicationTests {

	@Test
	void contextLoads() {
	}

	@Test
	@Transactional
	void assessmentTimersCanBeReadAndSavedOnTheBootstrappedSchema(
			@Autowired AssessmentTimerService timers, @Autowired JdbcTemplate jdbc) {
		assertEquals(Boolean.TRUE, jdbc.queryForObject("""
				SELECT relrowsecurity FROM pg_class WHERE oid = 'assessment_timer_settings'::regclass
				""", Boolean.class));
		jdbc.update("DELETE FROM assessment_timer_settings WHERE id = 1");
		assertEquals(new GlobalAssessmentTimers(10, 30, 60), timers.getGlobal());

		timers.saveGlobal(new GlobalAssessmentTimers(12, 35, 65));
		timers.saveGlobal(new GlobalAssessmentTimers(15, 40, 70));
		assertEquals(new GlobalAssessmentTimers(15, 40, 70), timers.getGlobal());
	}

}
