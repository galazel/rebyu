# REBYU — BKT and IRT

The two algorithms that drive adaptive assessment, in one place.

| | BKT | IRT |
|---|---|---|
| Question it answers | Do you know **this lesson**? | How able are you **overall**? |
| Output | probability 0–1 | θ (theta), −3 to +3 |
| Updated | once per answer, per lesson | once per answer, per attempt |
| Used for | study plan order, weak topics, priorities | picking the next question, proficiency rating |
| Lives in | `python-backend/app/services/bkt_math.py` | `backend-java/.../adaptive/engine/IrtModel.java` |

---

# 1. BKT — Bayesian Knowledge Tracing

Corbett & Anderson (1995). Tracks the probability that a learner knows one lesson.

**File:** `python-backend/app/services/bkt_math.py` — `update_mastery()`

## The four parameters

| Parameter | Default | Meaning |
|---|---|---|
| `prior` | 0.30 | assumed chance of knowing it before any evidence |
| `guess` | 0.25 | chance of answering right **without** knowing (4-option MCQ) |
| `slip` | 0.10 | chance of answering wrong **while** knowing (misread, typo) |
| `learn` | 0.08 | chance of picking it up by attempting the question |
| `forget` | 0.0 | chance of losing it (unused) |

Defined in `python-backend/app/core/config.py:186` as `fallback_*`, and mirrored in
`backend-java/.../adaptive/config/AdaptiveProperties.java` for the live engine.

`guess` and `slip` are the whole point: a right answer might be luck, a wrong answer
might be carelessness. Without them the update would be "right = up, wrong = down".

## Step 1 — Bayes

**Answered correctly:**

```
                    p · (1 − slip)
posterior = ─────────────────────────────────
            p · (1 − slip) + (1 − p) · guess
```

*Of all the ways you could have answered correctly, what share involved knowing it?*

**Answered wrongly:**

```
                     p · slip
posterior = ─────────────────────────────────────
            p · slip + (1 − p) · (1 − guess)
```

*Of all the ways you could have got it wrong, what share involved knowing it anyway?*

## Step 2 — Learning

```
mastery_after = posterior · (1 − forget) + (1 − posterior) · learn
```

Even a wrong answer nudges mastery up slightly — attempting a question teaches you something.

## Partial credit

```
weight    = score, if given, else (1 if correct else 0)
posterior = weight · posterior_right + (1 − weight) · posterior_wrong
```

A half-marked diagram is half the evidence of a right answer, rather than being
rounded to one or the other. This matters for diagrams and code, which rarely
score 0 or 100.

## Also computed

```
predicted_correct = p · (1 − slip) + (1 − p) · guess
```

The model's prediction before seeing the answer.

## Worked example — starting at p = 0.30

**Correct answer**

```
top       = 0.30 × 0.90 = 0.27
bottom    = 0.27 + (0.70 × 0.25) = 0.445
posterior = 0.27 / 0.445 = 0.61
mastery   = 0.61 + (0.39 × 0.08) = 0.64
```

**0.30 → 0.64**

**Wrong answer**

```
top       = 0.30 × 0.10 = 0.03
bottom    = 0.03 + (0.70 × 0.75) = 0.555
posterior = 0.03 / 0.555 = 0.054
mastery   = 0.054 + (0.946 × 0.08) = 0.13
```

**0.30 → 0.13**

**Half marks (score = 0.5)**

```
posterior = 0.5 × 0.61 + 0.5 × 0.054 = 0.33
mastery   = 0.33 + (0.67 × 0.08) = 0.38
```

**0.30 → 0.38**

A wrong answer moves mastery further than a right one. That is correct: with a 25%
guess rate a single right answer is weak evidence, while with only a 10% slip rate a
wrong answer is strong evidence.

## Mastery bands

`python-backend/app/core/config.py:206`

```
>= 0.85   mastered
>= 0.70   good
>= 0.40   developing
else      weak
```

## Where it is stored

`python-backend/app/services/mastery_service.py` — one row per (learner, lesson) in
`bkt.learner_lesson_mastery`, read `with_for_update()` so two answers arriving at once
cannot overwrite each other.

---

# 2. IRT — Item Response Theory (3PL)

Three-parameter logistic model with a Bayesian ability update.

**File:** `backend-java/src/main/java/com/capstone/rebyu/adaptive/engine/IrtModel.java`

## The item parameters

```java
record ItemParams(double a, double b, double c)
```

| | Meaning | Range | Default |
|---|---|---|---|
| **a** | discrimination — how sharply the item separates strong from weak | 0.2 – 4.0 | 1.0 |
| **b** | difficulty, on the same scale as θ | −4.0 – 4.0 | see below |
| **c** | guessing floor | 0.0 – 0.5 | 0.0 |

```java
DIFFICULTY_EASY    = -1.5
DIFFICULTY_AVERAGE =  0.0
DIFFICULTY_HARD    =  1.5
```

Critical-thinking items are given a higher discrimination.

## The ability scale

```java
THETA_MIN      = -3.0
THETA_MAX      =  3.0
THETA_BASELINE =  0.0      // every learner starts here
PRIOR_SIGMA    =  1.7      // starting uncertainty
MIN_SIGMA      =  0.75     // uncertainty never drops below this
```

## Formula 1 — probability of a correct answer

```
                        1
p = c + (1 − c) · ───────────────────
                  1 + e^(−a(θ − b))
```

A logistic S-curve. Only **θ − b** matters: ability minus difficulty.

| θ − b | p |
|---|---|
| −1.5 | 0.18 |
| 0.0 | 0.50 |
| +1.5 | 0.82 |

## Formula 2 — Fisher information

```
                 q      ⎛ p − c ⎞²
information = a² · ─ · ⎜───────⎟        where q = 1 − p
                 p      ⎝ 1 − c ⎠
```

**Information peaks at p = 0.5.** A question the learner would get right half the time
is maximally informative, because the outcome is genuinely uncertain. A question they
would certainly pass — or certainly fail — tells us nothing.

This is why the exam adapts: `AdaptiveItemSelector` serves the unseen item with the
highest information at the learner's current θ.

## Formula 3 — the ability update

```
gradient = a · (u − p) · (p − c) / (p · (1 − c))        with c = 0 this is just a(u − p)

                 variance
gain     = ──────────────────────        variance = σ²
           1 + variance · information

θ_new    = clamp(θ + gain · gradient, −3, +3)

                        ⎛        1         ⎞
σ_new    = max(0.75, √ ⎜──────────────────⎟)
                        ⎝ 1/variance + info ⎠
```

Three ideas:

- **`u − p`** — surprise. The learner scored `u`, the model expected `p`.
- **`gain`** — how far to move. High while uncertainty is high, shrinking as σ falls.
- **`σ`** — uncertainty. Only ever decreases, floored at 0.75 so the model never stops learning.

## Formula 4 — standard error across a whole attempt

```
          1              1
total = ────── + Σ information(θ, itemᵢ)      SE = max(0.75, ───────)
         1.7²                                                 √total
```

## Proficiency rating — what the learner sees

```java
rating = ((θ − THETA_MIN) / (THETA_MAX − THETA_MIN)) × 100
       = ((θ + 3) / 6) × 100
```

| θ | rating | band |
|---|---|---|
| −3.0 | 0 | Novice |
| −1.5 | 25 | Developing |
| **0.0** | **50** | **Proficient** (the pass line) |
| +1.5 | 75 | Advanced |
| +3.0 | 100 | Advanced |

```java
rating >= 75   Advanced
rating >= 50   Proficient
rating >= 25   Developing
else           Novice
```

A forfeited attempt returns 0 whatever θ said while it was running. A non-adaptive
attempt (diagnostic, mock) has no proficiency rating at all — only a percentage.

## Worked example — one question from θ = 0

| Question | p | information | θ becomes |
|---|---|---|---|
| Average, correct | 0.500 | 0.250 | **+0.839** |
| Hard, correct | 0.182 | 0.149 | **+1.651** |
| Easy, wrong | 0.818 | 0.149 | **−1.651** |

A **surprising** answer moves θ roughly twice as far as an expected one.

## Worked example — five correct average answers

```
answer 1:   θ +0.839   σ 1.295   rating 64
answer 2:   θ +1.213   σ 1.113   rating 70
answer 3:   θ +1.446   σ 1.008   rating 74
answer 4:   θ +1.614   σ 0.938   rating 77
answer 5:   θ +1.744   σ 0.885   rating 79
```

Steps shrink: +0.84, +0.37, +0.23, +0.17, +0.13. As σ falls, `gain` falls with it, so
the estimate converges instead of running away.

---

# 3. How the two meet

```
learner answers a question
        │
        ├──► IRT    updates θ for this attempt        (Java, instant)
        │           → picks the next question
        │           → proficiency rating at the end
        │
        └──► BKT    outbox event → Python service     (background)
                    → updates mastery for that lesson
                    → feeds study plan order, priorities, readiness
```

IRT is synchronous because the next question depends on it. BKT travels through a
transactional outbox (`bkt_event_outbox`) so a slow or unavailable Python service never
blocks a learner's submit, and no mastery update is ever lost.

Both use the same parameter defaults on each side — Java's `AdaptiveProperties` and
Python's `fallback_*` settings hold identical values.

---

# Answers to likely questions

**Why two models?**
They answer different questions. BKT is per-lesson and durable: it tells the study plan
which topics are weak. IRT is per-attempt and momentary: it tells the engine which
question to serve next and produces the proficiency rating.

**Why not a simple percentage score?**
Because the quiz adapts. Scoring 50% on hard items and 50% on easy items are not the
same achievement, and a raw percentage cannot tell them apart. θ accounts for the
difficulty of the items actually served.

**Why does a wrong answer hurt more than a right answer helps (BKT)?**
Because `guess` (0.25) is larger than `slip` (0.10). A right answer could be a lucky
guess; a wrong answer is much less likely to be a slip, so it is stronger evidence.

**What stops θ running away?**
`gain` falls as σ falls, so each answer moves θ less than the last, and θ is clamped to
±3. σ is floored at 0.75 so the model never becomes so confident it stops responding.

**What about partially-correct answers?**
BKT blends the two posteriors by the score. IRT takes `u` as a 0–1 score rather than a
boolean. Both handle a diagram marked 7/10 without rounding it.

**Are the parameters per-lesson?**
Not currently. `BktParameterProvider` always returns the defaults; per-lesson parameter
fitting is built but switched off.
