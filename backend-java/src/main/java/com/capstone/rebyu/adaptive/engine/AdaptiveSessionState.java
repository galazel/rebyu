package com.capstone.rebyu.adaptive.engine;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AdaptiveSessionState {

    public static final String STAGE_MAIN = "MAIN";
    public static final String STAGE_FINAL = "FINAL";
    public static final String STAGE_DONE = "DONE";

    private double mu0;
    private double sigma0;

    private double theta;
    private double se;

    private int targetCount;
    private int mainCount;
    private int finalRoundCount;
    private int servedCount;
    private int answeredCount;
    private String stage = STAGE_MAIN;

    private Map<Long, Double> pKnownByLesson = new LinkedHashMap<>();
    private Map<Long, BktModel.Params> paramsByLesson = new LinkedHashMap<>();

    private Map<Long, Integer> poolCountByLesson = new LinkedHashMap<>();

    private Map<Long, Double> targetShareByLesson = new LinkedHashMap<>();
    private Set<Long> weakLessonIds = new LinkedHashSet<>();
    private Map<Long, Integer> servedCountByLesson = new LinkedHashMap<>();

    private Map<String, Integer> poolCountByType = new LinkedHashMap<>();
    private Map<String, Integer> servedCountByType = new LinkedHashMap<>();

    private List<Long> servedQuestionIds = new ArrayList<>();
    private List<ResponseRecord> responses = new ArrayList<>();

    private Set<Long> seenQuestionIds = new LinkedHashSet<>();
    private Set<Long> cycleSeenQuestionIds = new LinkedHashSet<>();
    private int bankCycle = 1;
    private Set<Long> thisExamQuestionIds = new LinkedHashSet<>();
    private Set<Long> lastAttemptQuestionIds = new LinkedHashSet<>();

    private List<String> servedStems = new ArrayList<>();

    private List<Long> queuedAttemptQuestionIds = new ArrayList<>();

    public static final int RESERVE_DEPTH = 0;

    public static final int START_RESERVE = 0;

    public Long getQueuedAttemptQuestionId() {
        return queuedAttemptQuestionIds.isEmpty() ? null : queuedAttemptQuestionIds.get(0);
    }

    @Data
    @NoArgsConstructor
    public static class ResponseRecord {
        private Long questionId;
        private Long lessonId;
        private double a;
        private double b;
        private double c;
        private boolean correct;
        private double score;

        public ResponseRecord(Long questionId, Long lessonId, IrtModel.ItemParams item, boolean correct) {
            this(questionId, lessonId, item, correct, correct ? 1.0 : 0.0);
        }

        public ResponseRecord(Long questionId, Long lessonId, IrtModel.ItemParams item, boolean correct, double score) {
            this.score = score;
            this.questionId = questionId;
            this.lessonId = lessonId;
            this.a = item.a();
            this.b = item.b();
            this.c = item.c();
            this.correct = correct;
        }

        public IrtModel.Response toResponse() {
            return new IrtModel.Response(new IrtModel.ItemParams(a, b, c), score);
        }
    }

    public List<IrtModel.Response> irtResponses() {
        return responses.stream().map(ResponseRecord::toResponse).toList();
    }

    public boolean inFinalRound() {
        return STAGE_FINAL.equals(stage);
    }

    public boolean done() {
        return STAGE_DONE.equals(stage);
    }
}
