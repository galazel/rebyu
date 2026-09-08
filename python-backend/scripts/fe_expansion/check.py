"""Quality gate for FE content modules. Run it before seeding, every time.

The platform already knows what a weak lesson and a weak question batch look
like -- `app/domain/validation/lessons.py` and `questions.py` encode it, and
the generator's output is measured against them before a reviewer ever sees
it. Hand-written content bypasses that pipeline entirely, so without this
script it is the only content in the product that nothing checks.

So the same rules are applied here, plus the ones specific to this
certification:

  * every item is MCQ -- FE has no written, coded or drawn answer anywhere
  * four choices, exactly one correct
  * no filler distractors ("none of the above" and friends)
  * the correct answer is not parked in one position across a quiz
  * the correct answer is not simply the longest option
  * question openings vary
  * no two questions in the bank are near-duplicates
  * every figure a lesson references is registered and installed
  * every section carries more than one kind of block

Usage:
    python scripts/fe_expansion/check.py             # every content module
    python scripts/fe_expansion/check.py basic_theory_01
"""

import collections
import glob
import importlib
import json
import os
import re
import sys

_HERE = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, _HERE)

from figures import FIGURES, PREFIX  # noqa: E402
from install_figures import OUTPUT_DIR  # noqa: E402

#: Mirrors `app.domain.validation.questions._FILLER_DISTRACTORS`.
FILLER = {"none of the above", "all of the above", "none", "n/a", "na",
          "not applicable", "other", "true", "false", "both a and b"}

#: `app.schemas.certification.question_schema.MIN_EXPLANATION_CHARS`.
MIN_EXPLANATION_CHARS = 20
#: `app.domain.validation.questions.MAX_QUESTION_CHARS`.
MAX_QUESTION_CHARS = 2000
#: `app.domain.validation.questions.DUPLICATE_SIMILARITY_THRESHOLD`.
DUPLICATE_THRESHOLD = 0.75
#: `app.domain.validation.questions.MAX_CORRECT_POSITION_SHARE`.
MAX_POSITION_SHARE = 0.5
#: `app.domain.validation.questions.MAX_LONGEST_CORRECT_SHARE`.
MAX_LONGEST_SHARE = 0.6
#: `app.core.config.lesson_min_sections`.
MIN_SECTIONS = 22
#: `app.domain.validation.lessons` caps objectives at 8.
MAX_OBJECTIVES = 8

_WORDS = re.compile(r"\w+")

#: Sections whose content is structural rather than instructional, so the
#: "more than one kind of block" rule does not apply to them.
STRUCTURAL_SECTIONS = {"Introduction", "Key Terms", "Summary"}

problems = []
notes = []


def fail(module, message):
    problems.append("%s: %s" % (module, message))


def warn(module, message):
    notes.append("%s: %s" % (module, message))


def _norm(text):
    return set(_WORDS.findall((text or "").lower()))


# ------------------------------------------------------------------ lesson

def check_structure(module_name, lesson):
    name = lesson["name"]
    structure = lesson["structure"]

    if len(structure) < MIN_SECTIONS:
        fail(module_name, "%s: %d sections, below the platform's minimum of %d"
             % (name, len(structure), MIN_SECTIONS))

    if structure[0]["sectionName"] != name or structure[0]["content"]:
        fail(module_name, "%s: first section must be the lesson name with no "
                          "content -- the renderer uses it as the title block"
             % name)

    section_names = [s["sectionName"] for s in structure]
    duplicates = [n for n, count in collections.Counter(section_names).items()
                  if count > 1]
    if duplicates:
        fail(module_name, "%s: duplicate section names %s" % (name, duplicates))

    objectives = structure[2]["content"][0]["data"]["items"]
    if len(objectives) > MAX_OBJECTIVES:
        fail(module_name, "%s: %d learning objectives; the platform warns "
                          "above %d" % (name, len(objectives), MAX_OBJECTIVES))

    blocks = [b for s in structure for b in s["content"]]
    kinds = collections.Counter(b["type"] for b in blocks)

    visual = {"image", "image-left-text", "image-right-text", "video",
              "intro-image-card", "image-feature-grid", "media-text-block"}
    if not (set(kinds) & visual):
        fail(module_name, "%s: no visual block at all" % name)

    # The point of this whole curriculum's block palette: a section that is
    # one kind of block repeated is prose with extra steps.
    monotone = [s["sectionName"] for s in structure
                if s["content"]
                and len({b["type"] for b in s["content"]}) < 2
                and s["sectionName"] not in STRUCTURAL_SECTIONS]
    if monotone:
        warn(module_name, "%s: single-block-type sections %s"
             % (name, monotone[:4]))

    prose_share = kinds["description"] / max(len(blocks), 1)
    if prose_share > 0.72:
        warn(module_name, "%s: %.0f%% of blocks are plain paragraphs"
             % (name, 100 * prose_share))

    # Every figure must be registered AND on disk, because a missing file is
    # invisible until a learner opens the lesson.
    for block in blocks:
        key = block["data"].get("imageKey")
        if not key:
            continue
        slug = os.path.basename(key)
        if not slug.startswith(PREFIX):
            fail(module_name, "%s: figure %r is not an FE figure" % (name, key))
            continue
        registered = slug[len(PREFIX):-len(".svg")]
        if registered not in FIGURES:
            fail(module_name, "%s: figure %r is not registered in figures.py"
                 % (name, registered))
        elif not os.path.exists(os.path.join(OUTPUT_DIR, slug)):
            fail(module_name, "%s: figure %s not installed -- run "
                              "install_figures.py" % (name, slug))

    words = sum(len(json.dumps(b["data"]).split()) for b in blocks)
    return {"sections": len(structure), "blocks": len(blocks),
            "words": words, "kinds": kinds}


# --------------------------------------------------------------- questions

def check_quiz(module_name, lesson):
    name = lesson["name"]
    quiz = lesson["quiz"]
    if not quiz:
        fail(module_name, "%s: no quiz" % name)
        return

    positions = []
    longest_correct = 0
    for item in quiz:
        if item["type"] != "MCQ":
            fail(module_name, "%s: %r is %s; this certification is MCQ-only"
                 % (name, item["question"][:40], item["type"]))
            continue

        choices = item["choices"]
        correct = [i for i, (_t, ok) in enumerate(choices) if ok]
        if len(correct) != 1:
            fail(module_name, "%s: %r has %d correct choices"
                 % (name, item["question"][:40], len(correct)))
            continue
        positions.append(correct[0])

        for choice_text, _ok in choices:
            if choice_text.strip().lower().rstrip(".") in FILLER:
                fail(module_name, "%s: filler distractor %r"
                     % (name, choice_text))

        # Only the SOLE longest counts, matching
        # `_check_correct_choice_length` in the platform's own validator. A
        # tie gives nothing away -- and without the tie test, four numeric
        # options of equal length ("2.00", "2.80", "3.00", "2.40") would be
        # reported as a shape tell when they are the opposite of one.
        lengths = [len(t.strip()) for t, _ in choices]
        if lengths[correct[0]] == max(lengths) and lengths.count(max(lengths)) == 1:
            longest_correct += 1

        if len(item["explanation"]) < MIN_EXPLANATION_CHARS:
            fail(module_name, "%s: explanation too short for %r"
                 % (name, item["question"][:40]))
        if len(item["question"]) > MAX_QUESTION_CHARS:
            fail(module_name, "%s: question over %d characters: %r"
                 % (name, MAX_QUESTION_CHARS, item["question"][:40]))

    if positions:
        counts = collections.Counter(positions)
        top, hits = counts.most_common(1)[0]
        if hits / len(positions) > MAX_POSITION_SHARE:
            fail(module_name, "%s: correct answer is in position %d for "
                              "%d of %d items (max %.0f%%)"
                 % (name, top + 1, hits, len(positions),
                    100 * MAX_POSITION_SHARE))
        if longest_correct / len(positions) > MAX_LONGEST_SHARE:
            fail(module_name, "%s: correct answer is the longest option in "
                              "%d of %d items" % (name, longest_correct,
                                                  len(positions)))

    first_words = collections.Counter(
        item["question"].split()[0].lower() for item in quiz)
    top_word, top_count = first_words.most_common(1)[0]
    if top_count / len(quiz) > 0.3:
        warn(module_name, "%s: %d of %d questions open with %r"
             % (name, top_count, len(quiz), top_word))

    difficulties = collections.Counter(item["difficulty"] for item in quiz)
    if max(difficulties.values()) / len(quiz) > 0.8:
        warn(module_name, "%s: difficulty is %s-heavy" % (name, difficulties))


def check_duplicates(all_questions):
    """Near-duplicate detection across the whole bank, not just one quiz."""
    seen = [(name, text, _norm(text)) for name, text in all_questions]
    for i in range(len(seen)):
        for j in range(i + 1, len(seen)):
            a, b = seen[i], seen[j]
            union = a[2] | b[2]
            if not union:
                continue
            similarity = len(a[2] & b[2]) / len(union)
            if similarity >= DUPLICATE_THRESHOLD:
                fail("bank", "near-duplicate (%.2f):\n    %s\n    %s"
                     % (similarity, a[1][:70], b[1][:70]))


# -------------------------------------------------------------------- main

def main_for(names):
    """The gate, runnable from `seed.py` as well as from the command line.

    Resets the module-level accumulators first, so a caller that runs it more
    than once in a process does not see the previous run's findings.
    """
    del problems[:]
    del notes[:]

    if not names:
        names = [os.path.basename(p)[len("content_"):-len(".py")]
                 for p in sorted(glob.glob(os.path.join(_HERE, "content_*.py")))]
    if not names:
        print("no content modules yet")
        return 0

    all_questions = []
    totals = collections.Counter()
    lesson_count = 0

    for batch in names:
        module = importlib.import_module("content_%s" % batch)
        for lesson in module.LESSONS:
            lesson_count += 1
            stats = check_structure(batch, lesson)
            check_quiz(batch, lesson)
            all_questions.extend((lesson["name"], item["question"])
                                 for item in lesson["quiz"])
            totals["sections"] += stats["sections"]
            totals["blocks"] += stats["blocks"]
            totals["words"] += stats["words"]
            totals["questions"] += len(lesson["quiz"])
            print("  %-58s %2d sections %3d blocks %5d words %2d items"
                  % (lesson["name"][:58], stats["sections"], stats["blocks"],
                     stats["words"], len(lesson["quiz"])))

    check_duplicates(all_questions)

    if lesson_count:
        print("\n%d lesson(s): avg %.0f sections, %.0f blocks, %.0f words, "
              "%.0f questions"
              % (lesson_count, totals["sections"] / lesson_count,
                 totals["blocks"] / lesson_count,
                 totals["words"] / lesson_count,
                 totals["questions"] / lesson_count))

    for note in notes:
        print("  note  %s" % note)
    for problem in problems:
        print("  FAIL  %s" % problem)

    print("\n%d problem(s), %d note(s)" % (len(problems), len(notes)))
    return 1 if problems else 0


def main():
    return main_for([a for a in sys.argv[1:] if not a.startswith("--")])


if __name__ == "__main__":
    sys.exit(main())
