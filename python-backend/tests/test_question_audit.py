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
    policies = groups["policies"]
    assert sum(1 for i in policies if i.source == audit.STORED) == 0
    aup = next(i for i in policies if i.stem == "What is the purpose of an AUP?")
    assert aup.question.get("_stored") is True
    assert [i.source for i in groups["network"]] == [audit.STORED]


def test_resolution_keeps_by_priority_and_drops_the_rest():
    state = _state()
    items = audit.collect_items(state, [])
    policies = sorted(audit.group_by_lesson(items)["policies"], key=lambda i: i.stem.casefold())
    labelled = {n + 1: item for n, item in enumerate(policies)}
    by_stem = {item.stem: label for label, item in labelled.items()}
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

    resolution = asyncio.run(audit.find_duplicates("InfoSec", items, fake_audit, jobs=audit.lesson_slices))
    assert sorted(seen) == ["malware", "policies"]
    assert [i.stem for i in resolution.dropped] == ["What is an AUP's primary function?"]


def test_slices_overlap_so_boundary_pairs_are_still_compared():
    items = [audit.Item(audit.BANK, None, n, "L", {}, f"q{n:03d}", None, "MCQ") for n in range(100)]
    parts = audit.slices(items, size=40)
    assert all(2 <= len(p) <= 40 for p in parts)
    covered = {i.stem for p in parts for i in p}
    assert len(covered) == 100
    assert {i.stem for i in parts[0]} & {i.stem for i in parts[1]}


def _aup_resolution(state):
    items = audit.collect_items(state, [])
    policies = sorted(audit.group_by_lesson(items)["policies"], key=lambda i: i.stem.casefold())
    labelled = {n + 1: item for n, item in enumerate(policies)}
    by_stem = {item.stem: label for label, item in labelled.items()}
    verdict = QuestionAuditResult(groups=[DuplicateGroup(
        keep=by_stem["What is an AUP's primary function?"],
        duplicates=[by_stem["What is the purpose of an AUP?"],
                    by_stem["Which best describes what an Acceptable Use Policy is for?"]],
        reason="same fact",
    )])
    resolution = audit.Resolution()
    audit.resolve(labelled, verdict, resolution)
    return resolution


def test_duplicate_review_lists_each_group_with_where_each_copy_lives():
    state = _state()
    review = audit.build_duplicate_review(state, _aup_resolution(state), kept=set())
    assert review["kind"] == "duplicates" and review["total_duplicates"] == 2
    group = review["groups"][0]
    assert group["reason"] == "same fact"
    assert group["keep"]["where"] == "Major category exam: Governance"
    wheres = sorted(d["where"] for d in group["duplicates"])
    assert wheres == ["Lesson quiz: Policies", "Question bank"]
    assert all(d["choice"] == audit.REPLACE for d in group["duplicates"])


def test_copies_already_kept_are_not_asked_about_again():
    from app.domain.question_stem import stem as normalise

    state = _state()
    kept = {normalise("What is the purpose of an AUP?"), normalise("What is an AUP's primary function?")}
    assert audit.build_duplicate_review(state, _aup_resolution(state), kept) is None


def test_choices_default_to_replace_and_skip_keeps_everything():
    state = _state()
    review = audit.build_duplicate_review(state, _aup_resolution(state), kept=set())
    ids = [d["id"] for d in review["groups"][0]["duplicates"]]

    picked = audit.choices_from_decision(review, {"action": "approve", "payload": {"choices": {ids[0]: "keep"}}})
    assert picked == {ids[0]: "keep", ids[1]: "replace"}
    assert set(audit.choices_from_decision(review, {"action": "approve"}).values()) == {"replace"}
    assert set(audit.choices_from_decision(review, {"action": "skip"}).values()) == {"keep"}
    # An unknown id or value from the browser is ignored, not trusted.
    odd = audit.choices_from_decision(review, {"action": "approve", "payload": {"choices": {"x": "keep", ids[1]: "drop"}}})
    assert odd == {ids[0]: "replace", ids[1]: "replace"}


def test_replace_removes_the_chosen_copy_tops_up_and_remembers_the_kept_one(monkeypatch):
    state = _state()
    review = audit.build_duplicate_review(state, _aup_resolution(state), kept=set())
    copies = {d["where"]: d["id"] for d in review["groups"][0]["duplicates"]}
    state = {**state, "duplicate_review": review, "duplicate_rounds": 1,
             "duplicate_choices": {copies["Lesson quiz: Policies"]: "keep", copies["Question bank"]: "replace"}}

    monkeypatch.setattr(audit, "_load_stored", lambda _cid: [])

    async def fake_top_up(working, update, source, entry, lost, stems):
        fresh = [{"question": f"New {source} question {n}"} for n in range(len(lost))]
        update[source] = list(update.get(source) or working.get(source) or []) + fresh
        return fresh

    monkeypatch.setattr(audit, "_top_up", fake_top_up)
    update = asyncio.run(audit.replace_duplicates_node(state))

    assert update["status"] == "DUPLICATES_REPLACED"
    bank = [q["question"] for q in update["question_bank"]]
    assert "What is an AUP's primary function?" not in bank and "New question_bank question 0" in bank
    assert "lesson_quizzes" not in update  # the kept copy is untouched
    assert update["duplicates_kept"] == ["What is the purpose of an AUP?"]
    assert update["question_audit"]["replaced"] == 1 and update["question_audit"]["kept"] == 1
    assert audit.route_after_replacing({**state, **update}) == "check"


def test_keeping_everything_ends_the_review_without_another_check(monkeypatch):
    state = _state()
    review = audit.build_duplicate_review(state, _aup_resolution(state), kept=set())
    state = {**state, "duplicate_review": review, "duplicate_rounds": 1,
             "duplicate_choices": audit.choices_from_decision(review, {"action": "skip"})}
    monkeypatch.setattr(audit, "_load_stored", lambda _cid: [])
    update = asyncio.run(audit.replace_duplicates_node(state))
    assert update["status"] == "DUPLICATES_KEPT"
    assert audit.route_after_replacing({**state, **update}) == "done"


def test_only_the_first_duplicate_check_asks_the_admin(monkeypatch):
    import app.graphs.certification.review_mode as review_mode

    monkeypatch.setattr(review_mode, "auto_approving", lambda state, scope=None: False)
    state = _state()
    review = audit.build_duplicate_review({**state, "duplicate_rounds": 1}, _aup_resolution(state), kept=set())
    assert review["round"] == 2
    update = audit.await_duplicate_review_node({**state, "duplicate_review": review})
    assert update["status"] == "DUPLICATES_AUTO_REPLACED"
    assert set(update["duplicate_choices"].values()) == {"replace"}


def _fake_embed(vectors):
    return lambda texts: [vectors[t.split("\n")[0]] for t in texts]


def test_similar_questions_far_apart_still_share_a_batch():
    """The old windows compared only alphabetical neighbours; every similar
    pair must now be audited together, wherever the two questions sit."""
    items = audit.collect_items(_state(), [])
    stems = [i.stem for i in items]
    vectors = {stem: [0.0] * 8 for stem in stems}
    for n, stem in enumerate(stems):
        vectors[stem][n % 8] = 1.0
    # make the two AUP questions in different assessments near-identical
    a, b = "What is the purpose of an AUP?", "What is an AUP's primary function?"
    vectors[b] = list(vectors[a])
    batches = audit.similar_batches(items, embed=_fake_embed(vectors), threshold=0.9)
    together = [{i.stem for i in batch} for _label, batch in batches]
    assert any({a, b} <= group for group in together)
    # questions similar to nothing are not sent to the auditor at all
    assert all(len(group) >= 2 for group in together)
    assert sum(len(group) for group in together) < len(items)


def test_every_candidate_pair_is_covered_even_past_the_batch_size():
    items = [audit.Item(audit.BANK, None, n, "L", {}, f"Q{n}", "A", "MCQ") for n in range(7)]
    same = {f"Q{n}": [1.0, 0.0] for n in range(7)}
    batches = audit.similar_batches(items, embed=_fake_embed(same), threshold=0.9, size=3)
    seen = set()
    for _label, batch in batches:
        keys = [i.index for i in batch]
        seen |= {(x, y) for x in keys for y in keys if x < y}
    assert seen == {(x, y) for x in range(7) for y in range(7) if x < y}
