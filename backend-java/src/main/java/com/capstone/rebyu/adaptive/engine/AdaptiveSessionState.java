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

/**
 * Everything the engine needs between two answers, serialised as JSON onto
 * the attempt. Rebuilt from this on every request, so the engine holds no
 * memory of its own and a restarted server changes nothing.
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class AdaptiveSessionState {

    public static final String STAGE_MAIN = "MAIN";
    public static final String STAGE_FINAL = "FINAL";
    public static final String STAGE_DONE = "DONE";

    /** Prior over ability the session started from. */
    private double mu0;
    private double sigma0;

    /** Current ability estimate and its uncertainty. */
    private double theta;
    private double se;

    private int targetCount;
    private int mainCount;
    private int finalRoundCount;
    private int servedCount;
    private int answeredCount;
    private String stage = STAGE_MAIN;

    /** BKT knowledge state per lesson, and the parameters it is tracked with. */
    private Map<Long, Double> pKnownByLesson = new LinkedHashMap<>();
    private Map<Long, BktModel.Params> paramsByLesson = new LinkedHashMap<>();

    /** Pool composition per lesson (main-pool candidates), for coverage. */
    private Map<Long, Integer> poolCountByLesson = new LinkedHashMap<>();
    private Map<Long, Integer> servedCountByLesson = new LinkedHashMap<>();

    private List<Long> servedQuestionIds = new ArrayList<>();
    private List<ResponseRecord> responses = new ArrayList<>();

    /** Questions this learner had met in any attempt when the session began. */
    private Set<Long> seenQuestionIds = new LinkedHashSet<>();
    /** Questions on the learner's most recent submitted attempt of this exam. */
    private Set<Long> lastAttemptQuestionIds = new LinkedHashSet<>();

    /** Normalised stems of everything served, so a twin under another id is not served too. */
    private List<String> servedStems = new ArrayList<>();

    @Data
    @NoArgsConstructor
    public static class ResponseRecord {
        private Long questionId;
        private Long lessonId;
        private double a;
        private double b;
        private double c;
        private boolean correct;

        public ResponseRecord(Long questionId, Long lessonId, IrtModel.ItemParams item, boolean correct) {
            this.questionId = questionId;
            this.lessonId = lessonId;
            this.a = item.a();
            this.b = item.b();
            this.c = item.c();
            this.correct = correct;
        }

        public IrtModel.Response toResponse() {
            return new IrtModel.Response(new IrtModel.ItemParams(a, b, c), correct);
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
