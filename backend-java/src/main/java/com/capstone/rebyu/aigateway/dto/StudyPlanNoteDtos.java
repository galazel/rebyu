package com.capstone.rebyu.aigateway.dto;

import java.util.List;

/**
 * The learner's free-text study note, and the schedule rules the AI service reads out of it.
 *
 * <p>The calendar itself is still built by the planner in the browser. All that crosses this
 * boundary is the handful of rules that planner accepts, so a model can never place a lesson,
 * move an exam date or drop a topic on its own.
 */
public final class StudyPlanNoteDtos {

  private StudyPlanNoteDtos() {}

  /**
   * @param note the learner's own words, at most 500 characters
   * @param today the learner's date, so "next week" resolves
   * @param examDate the plan's target exam date, so nothing is scheduled past it
   * @param topics the lesson and topic names the plan can schedule, for priority matching
   */
  public record Request(String note, String today, String examDate, List<String> topics) {}

  /**
   * @param days weekdays to study on, 0=Sunday to 6=Saturday, or null when the note is silent
   * @param time 24-hour start time, "HH:mm", or null
   * @param shortSessions shorter sessions with breaks
   * @param noCatchUp drop the weekly catch-up day
   * @param maxLessonsPerDay hard cap on new lessons a day, 1-4, or null
   * @param skipDates individual ISO dates with no studying
   * @param priorityTopics topic names to study first, as they appear in the curriculum
   * @param applied one line per rule applied, shown back to the learner
   * @param unsupported one line per request the schedule cannot express
   * @param unavailable why the note could not be read at all -- no AI access, no uses left, or
   *     the service being down. The note is then ignored rather than half-applied.
   */
  public record Rules(
      List<Integer> days,
      String time,
      boolean shortSessions,
      boolean noCatchUp,
      Integer maxLessonsPerDay,
      List<String> skipDates,
      List<String> priorityTopics,
      List<String> applied,
      List<String> unsupported,
      String unavailable) {

    public static Rules empty() {
      return new Rules(null, null, false, false, null, List.of(), List.of(), List.of(), List.of(), null);
    }

    /** Nothing was read: the plan is built as if the note were empty. */
    public static Rules unavailable(String reason) {
      return new Rules(null, null, false, false, null, List.of(), List.of(), List.of(), List.of(), reason);
    }
  }
}
