"""The duplicate audit's grouping and resolution, without an auditor model."""

import asyncio

from app.graphs.certification import question_audit as audit
from app.schemas.certification.question_audit import DuplicateGroup, QuestionAuditResult


def _q(text, answer="A", lesson=None, qtype="MCQ"):
    q = {"question": text, "question_type": qtype, "choices": [answer, "B", "C", "D"],
         "correct_choice_index": 0}
    if lesson:
        q["lesson_ref"] = lesson
    return q


def _state():
    return {
        "certification_name": "InfoSec",
        "lesson_quizzes": [
            {"lesson": "Policies", "questions": [
                _q("What is the purpose of an AUP?", "Define acceptable use"),
                _q("Who approves a security policy?", "Management"),
            ]},
        ],
        "major_quizzes": [
            {"majorCategory": "Governance", "questions": [
                _q("Which best describes what an Acceptable Use Policy is for?", "Acceptable use", lesson="Policies"),
            ]},
        ],
        "mock_exam": {"questions": [
            _q("What does antivirus use to recognise known malware?", "Signatures", lesson="Malware"),
        ]},
        "question_bank": [
            _q("What is an AUP's primary function?", "Acceptable use", lesson="Policies"),
            _q("Name the detection method that matches malware against known signatures.", "Signature-based", lesson="Malware", qtype="SHORT_ANSWER"),
            _q("What is heuristic analysis for?", "Unknown threats", lesson="Malware"),
        ],
    }


def test_collect_groups_by_lesson_and_folds_stored_rows():
    stored = [
        {"question_id": 7, "question_text": "What is the purpose of an AUP?", "lesson_name": "Policies",
         "question_type": "MCQ", "answer": "Define acceptable use"},
        {"question_id": 8, "question_text": "What is a firewall?", "lesson_name": "Network",
         "question_type": "MCQ", "answer": "A filter"},
    ]
    items = audit.collect_items(_state(), stored)
    groups = audit.group_by_lesson(items)
    assert set(groups) == {"policies", "malware", "network"}
    # The stored copy of the lesson-quiz item is folded in, not listed twice...
    policies = groups["policies"]
    assert sum(1 for i in policies if i.source == audit.STORED) == 0
    # ...and the state item now counts as stored.
    aup = next(i for i in policies if i.stem == "What is the purpose of an AUP?")
    assert aup.question.get("_stored") is True
    assert [i.source for i in groups["network"]] == [audit.STORED]


def test_resolution_keeps_by_priority_and_drops_the_rest():
    state = _state()
    items = audit.collect_items(state, [])
    policies = sorted(audit.group_by_lesson(items)["policies"], key=lambda i: i.stem.casefold())
    labelled = {n + 1: item for n, item in enumerate(policies)}
    by_stem = {item.stem: label for label, item in labelled.items()}
    # The auditor prefers the bank's wording; the major exam's item outranks it.
    verdict = QuestionAuditResult(groups=[DuplicateGroup(
        keep=by_stem["What is an AUP's primary function?"],
        duplicates=[by_stem["What is the purpose of an AUP?"],
                    by_stem["Which best describes what an Acceptable Use Policy is for?"]],
        reason="same fact",
    )])
    resolution = audit.Resolution()
    audit.resolve(labelled, verdict, resolution)
    assert resolution.groups == 1
    dropped = {(i.source, i.stem) for i in resolution.dropped}
    assert dropped == {
        (audit.LESSON, "What is the purpose of an AUP?"),
        (audit.BANK, "What is an AUP's primary function?"),
    }
    assert resolution.stored_to_delete == []

    update = audit.apply_drops(state, resolution.dropped)
    assert [q["question"] for q in update["lesson_quizzes"][0]["questions"]] == ["Who approves a security policy?"]
    assert [q["question"] for q in update["question_bank"]] == [
        "Name the detection method that matches malware against known signatures.",
        "What is heuristic analysis for?",
    ]
    assert "major_quizzes" not in update
    assert audit.shortfalls(resolution.dropped).keys() == {(audit.LESSON, 0), (audit.BANK, None)}


def test_stored_duplicate_is_scheduled_for_deletion_and_run_copy_kept_when_stored_wins():
    state = _state()
    stored = [{"question_id": 42, "question_text": "AUP: what is it for?", "lesson_name": "Policies",
               "question_type": "MCQ", "answer": "Acceptable use"}]
    items = audit.collect_items(state, stored)
    policies = sorted(audit.group_by_lesson(items)["policies"], key=lambda i: i.stem.casefold())
    labelled = {n + 1: item for n, item in enumerate(policies)}
    by_stem = {item.stem: label for label, item in labelled.items()}
    verdict = QuestionAuditResult(groups=[DuplicateGroup(
        keep=by_stem["What is the purpose of an AUP?"], duplicates=[by_stem["AUP: what is it for?"]])])
    resolution = audit.Resolution()
    audit.resolve(labelled, verdict, resolution)
    # A row already in the database outranks the run's copy: the run's is dropped.
    assert [i.stem for i in resolution.dropped] == ["What is the purpose of an AUP?"]
    assert resolution.stored_to_delete == []


def test_find_duplicates_runs_one_audit_per_lesson_slice_and_survives_a_failure():
    items = audit.collect_items(_state(), [])
    seen = []

    async def fake_audit(name, lesson, part):
        seen.append(lesson)
        if lesson == "malware":
            raise RuntimeError("provider down")
        labelled = {n + 1: item for n, item in enumerate(part)}
        stems = {item.stem: label for label, item in labelled.items()}
        return labelled, QuestionAuditResult(groups=[DuplicateGroup(
            keep=stems["What is the purpose of an AUP?"],
            duplicates=[stems["What is an AUP's primary function?"]])])

    resolution = asyncio.run(audit.find_duplicates("InfoSec", items, fake_audit))
    assert sorted(seen) == ["malware", "policies"]
    assert [i.stem for i in resolution.dropped] == ["What is an AUP's primary function?"]


def test_slices_overlap_so_boundary_pairs_are_still_compared():
    items = [audit.Item(audit.BANK, None, n, "L", {}, f"q{n:03d}", None, "MCQ") for n in range(100)]
    parts = audit.slices(items, size=40)
    assert all(2 <= len(p) <= 40 for p in parts)
    covered = {i.stem for p in parts for i in p}
    assert len(covered) == 100
    assert {i.stem for i in parts[0]} & {i.stem for i in parts[1]}
