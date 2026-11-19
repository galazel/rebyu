"""Moves worked examples out of `code` blocks and into the `example` block.

The companion to convert_code_blocks_to_formulas.py. Those blocks held
equations; these hold demonstrations -- a sampling plan applied to a real lot,
a critical path traced across an activity network, a simulation run and its
metrics. A code box flattened all of it: the figures the example starts from,
the steps, and the conclusion arrived as one grey wall with line numbers.

One of the four is not an example at all. The scheduling comparison is three
rules measured on the same three things, which is a table, and it is converted
to one.

Matched by the block's current `title`, so a re-run after an edit changes
nothing rather than guessing.

    python scripts/convert_code_blocks_to_examples.py            # preview only
    python scripts/convert_code_blocks_to_examples.py --apply    # write
"""

from __future__ import annotations

import json
import os
import sys
import uuid

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from sqlalchemy import text

from app.db.session import SessionLocal


def new_id() -> str:
    return str(uuid.uuid4())


def givens(*pairs):
    return [{"id": new_id(), "label": label, "value": value} for label, value in pairs]


def steps(*pairs):
    return [{"id": new_id(), "title": title, "detail": detail} for title, detail in pairs]


def example(**data):
    return {"type": "example", "data": {"smallHeader": "", "description": "", **data}}


def table(columns, rows, **data):
    return {
        "type": "table",
        "data": {
            "smallHeader": "",
            "description": "",
            "rowHeaders": True,
            "footer": "",
            "columns": [{"id": new_id(), "label": label} for label in columns],
            "rows": [{"id": new_id(), "cells": list(cells)} for cells in rows],
            **data,
        },
    }


CONVERSIONS = {
    774: {
        "Acceptance Sampling Plan Example": example(
            label="Worked example",
            title="Accepting a lot of 1,000 units",
            scenario=(
                "Acceptance sampling decides a whole lot from a sample of it, so the "
                "plan has to say how big the sample is and how many defects it will "
                "tolerate before the lot is rejected."
            ),
            givens=givens(
                ("Lot size", "1,000 units"),
                ("Sample size (n)", "125 units"),
                ("Acceptance number (c)", "3 defects"),
            ),
            steps=steps(
                (
                    "State the decision rule",
                    "Accept the lot if the sample contains 3 defects or fewer; reject it above 3.",
                ),
                ("Inspect the sample", "125 units are inspected and 2 defects are found."),
                (
                    "Apply the rule",
                    "2 is within the acceptance number of 3, so the lot passes.",
                ),
            ),
            resultLabel="Decision",
            result="Accept the lot \\(2 \\le 3\\).",
            takeaway=(
                "Two risks remain whatever the plan: the producer's risk \\(\\alpha\\) of "
                "rejecting a good lot, and the consumer's risk \\(\\beta\\) of accepting a bad "
                "one. Typical targets are \\(\\alpha = 0.05\\) and \\(\\beta = 0.10\\)."
            ),
            caption="Acceptance sampling balances inspection cost against the risk of accepting defective products.",
        ),
        "Critical Path Method (CPM) Example": example(
            label="Worked example",
            title="Finding the critical path of a five-activity project",
            scenario=(
                "Each activity depends on the one before it, so the project cannot finish "
                "sooner than the longest chain of them takes."
            ),
            givens=givens(
                ("A — Design", "2 weeks"),
                ("B — Procurement", "4 weeks, after A"),
                ("C — Fabrication", "3 weeks, after B"),
                ("D — Assembly", "2 weeks, after C"),
                ("E — Testing", "1 week, after D"),
            ),
            steps=steps(
                (
                    "Trace every path through the network",
                    "Each activity has exactly one predecessor, so there is one path: A to B to C to D to E.",
                ),
                (
                    "Add the durations along it",
                    "\\(2 + 4 + 3 + 2 + 1 = 12\\) weeks.",
                ),
                (
                    "Take the longest path as critical",
                    "It is the only path, so every activity on it is critical and none has slack.",
                ),
            ),
            resultLabel="Project duration",
            result="12 weeks, along the critical path A → B → C → D → E.",
            takeaway=(
                "A delay to any activity on the critical path delays the whole project. "
                "Activities off it have slack and can slip by that much without doing so."
            ),
            caption="CPM identifies the sequence of activities that determines how long a project takes.",
        ),
        "Discrete Event Simulation Example: Queue System": example(
            label="Worked example",
            title="Simulating a single-server service counter",
            scenario=(
                "Arrivals and service times vary, so the queue cannot be worked out with "
                "one calculation. A simulation runs the system event by event and measures "
                "what actually happens."
            ),
            givens=givens(
                ("Servers", "1"),
                ("Arrivals", "Random, averaging 10 per hour"),
                ("Service time", "Random, averaging 5 minutes"),
            ),
            steps=steps(
                (
                    "Generate the arrivals",
                    "Draw arrival times from an exponential distribution.",
                ),
                (
                    "Serve or queue each arrival",
                    "If the server is idle, service starts at once; if it is busy, the customer joins the queue.",
                ),
                (
                    "Release the server on completion",
                    "Start the next customer if the queue is not empty, otherwise the server goes idle.",
                ),
                (
                    "Track the measures that matter",
                    "Wait time, service time, queue length and server utilisation.",
                ),
            ),
            resultLabel="Output metrics",
            result=(
                "Average wait 2.3 minutes.\n"
                "Average queue length 0.8 customers.\n"
                "Server utilisation 83%."
            ),
            takeaway=(
                "A second server would cut the average wait to about 0.1 minutes — the "
                "queue is driven by how close utilisation is to capacity, not by the "
                "average arrival rate alone."
            ),
            caption="Discrete event simulation models queuing systems to evaluate service capacity.",
        ),
        "Scheduling Rules Comparison": table(
            ["Rule", "Sequence", "Completion times", "Late jobs"],
            [
                ["First-come-first-served", "A, B, C, D", "5, 8, 12, 14", "D, by 8 days"],
                ["Shortest job first", "D, B, C, A", "2, 5, 9, 14", "A, by 4 days"],
                ["Earliest due date", "D, B, A, C", "2, 5, 10, 14", "C, by 2 days"],
            ],
            caption=(
                "Four jobs — A (5 days, due 10), B (3, due 8), C (4, due 12), D (2, due 6) "
                "— sequenced three ways."
            ),
            footer=(
                "Earliest due date minimises the worst lateness here. The rule to pick "
                "depends on which measure matters."
            ),
        ),
    }
}


def main(apply: bool) -> int:
    converted = 0

    with SessionLocal() as session:
        for lesson_id, by_title in CONVERSIONS.items():
            row = (
                session.execute(
                    text(
                        "SELECT lesson_id, name, lesson_component_structure "
                        "FROM lessons WHERE lesson_id = :id"
                    ),
                    {"id": lesson_id},
                )
                .mappings()
                .first()
            )
            if not row:
                print(f"lesson {lesson_id}: not found")
                continue

            structure = row["lesson_component_structure"] or []
            changed = False
            seen = set()

            for section in structure:
                if not isinstance(section, dict):
                    continue
                for index, block in enumerate(section.get("content") or []):
                    if not isinstance(block, dict) or block.get("type") != "code":
                        continue
                    title = (block.get("data") or {}).get("title")
                    replacement = by_title.get(title)
                    if not replacement:
                        continue

                    seen.add(title)
                    section["content"][index] = {
                        "id": block.get("id") or new_id(),
                        **json.loads(json.dumps(replacement)),
                    }
                    changed = True
                    converted += 1
                    print(f"lesson {lesson_id}: {title!r} -> {replacement['type']}")

            for title in by_title:
                if title not in seen:
                    print(f"lesson {lesson_id}: NO MATCH for {title!r} (already converted, or retitled)")

            if changed and apply:
                session.execute(
                    text(
                        "UPDATE lessons SET lesson_component_structure = CAST(:structure AS jsonb) "
                        "WHERE lesson_id = :id"
                    ),
                    {"structure": json.dumps(structure), "id": lesson_id},
                )

        if apply:
            session.commit()

    print(f"\n{converted} block(s) {'converted' if apply else 'would be converted'}.")
    if not apply:
        print("Re-run with --apply to write.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main("--apply" in sys.argv))
