"""Installs the CodeStrike, Blueprint Arena and Champions Cup problem sets.

One transaction. It creates the new questions (with explanations), points each
arena's exam at its 9 or 30 questions in roadmap/stage order, writes the node
layout, and sets the current Champions Cup edition's stages, mirroring what
ChallengeArenaService.saveProblems and WorldCupEditionService.publish do.

Old arena questions are detached from the arenas, not deleted: past attempts still
reference them.

    PYTHONPATH=. .venv/Scripts/python scripts/challenges/install_challenges.py            # dry run
    PYTHONPATH=. .venv/Scripts/python scripts/challenges/install_challenges.py --apply
"""
from __future__ import annotations

import json
import sys
from datetime import datetime
from pathlib import Path

from sqlalchemy import text

sys.path.insert(0, str(Path(__file__).parent))

import blueprint_problems  # noqa: E402
import champions_cup_questions  # noqa: E402
import codestrike_problems  # noqa: E402
from app.db.session import SessionLocal  # noqa: E402
from app.repositories import java_backend as repo  # noqa: E402

LESSON_ID = 1            # where the existing arena questions and the cup edition are filed
EXAMS = {"codestrike": 609, "blueprint": 610, "worldcup": 608}
CUP_EDITION_ID = 3       # the current (week of 2026-11-02) Champions Cup edition
POINTS = 10


def existing_id(session, stem: str) -> int | None:
    return session.execute(text(
        "select question_id from questions where lesson_id = :l and question_text = :t "
        "and parent_question_id is null order by question_id limit 1"),
        {"l": LESSON_ID, "t": stem}).scalar()


def new_question(session, qtype: str, stem: str, explanation: str) -> tuple[int, bool]:
    found = existing_id(session, stem)
    if found:
        return found, False   # a re-run reuses what the first run created
    qid = repo.insert_question(session, lesson_id=LESSON_ID, question_type=qtype,
                               difficulty="HARD", question_text=stem, explanation=explanation)
    return qid, True


def wire(session, arena: str, ordered: list[tuple[int, int]], points) -> None:
    exam_id = EXAMS[arena]
    session.execute(text("delete from exam_questions where exam_id = :e"), {"e": exam_id})
    for order, (qid, _) in enumerate(ordered, start=1):
        session.execute(text(
            "insert into exam_questions (exam_id, question_id, display_order, points) "
            "values (:e, :q, :o, :p)"), {"e": exam_id, "q": qid, "o": order, "p": points})
    session.execute(text("update exams set total_questions = :n, updated_at = :u where exam_id = :e"),
                    {"n": len(ordered), "u": datetime.now(), "e": exam_id})
    session.execute(text(
        "update challenge_arena_configs set node_layout_json = :j, updated_at = :u where arena_id = :a"),
        {"j": json.dumps([node for _, node in ordered]), "u": datetime.now(), "a": arena})


def main(apply: bool) -> None:
    session = SessionLocal()
    created = 0
    try:
        # ---- CodeStrike
        code = []
        for p in codestrike_problems.build():
            qid, made = new_question(session, "CRITICAL_THINKING", p["question"], p["explanation"])
            if made:
                repo.insert_programming_config(session, qid, p["starter"], p["expected"], language="PYTHON")
                created += 1
            code.append((qid, p["node"]))
        wire(session, "codestrike", code, POINTS)

        # ---- Blueprint: existing three gain explanations, six new ones join them
        for qid, (why, mistake) in blueprint_problems.EXISTING.items():
            session.execute(text(
                "update questions set explanation = :e where question_id = :q "
                "and coalesce(trim(explanation), '') = ''"),
                {"e": f"{why}\n\nCommon mistake: {mistake}", "q": qid})
        by_node = {1: [23262], 2: [23263], 3: [23264]}
        for p in blueprint_problems.build():
            qid, made = new_question(session, "CRITICAL_THINKING", p["question"], p["full_explanation"])
            if made:
                repo.insert_diagram_config(session, qid, p["diagram_type"], p["instructions"], p["xml"])
                created += 1
            by_node[p["node"]].append(qid)
        wire(session, "blueprint", [(q, n) for n in (1, 2, 3) for q in by_node[n]], POINTS)

        # ---- Champions Cup
        stages: dict[str, list[int]] = {}
        cup = []
        for node, (stage, items) in enumerate(champions_cup_questions.STAGES.items(), start=1):
            stages[stage] = []
            for stem, explanation, choices in items:
                qid, made = new_question(session, "MCQ", stem, explanation)
                if made:
                    for choice_text, correct, why in choices:
                        repo.insert_choice(session, qid, choice_text, is_correct=correct, explanation=why)
                    created += 1
                stages[stage].append(qid)
                cup.append((qid, node))
        wire(session, "worldcup", cup, None)
        session.execute(text(
            "update world_cup_editions set stages_json = :s, updated_at = :u where edition_id = :e"),
            {"s": json.dumps(stages), "u": datetime.now(), "e": CUP_EDITION_ID})

        print(f"created {created} question(s); codestrike {len(code)}, blueprint "
              f"{sum(len(v) for v in by_node.values())}, champions cup {len(cup)}")
        if apply:
            session.commit()
            print("committed")
        else:
            session.rollback()
            print("dry run -- rolled back (pass --apply to keep)")
    except Exception:
        session.rollback()
        raise
    finally:
        session.close()


if __name__ == "__main__":
    main(apply="--apply" in sys.argv)
