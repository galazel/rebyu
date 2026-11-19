"""Moves formulas out of `code` blocks and into the `formula` block.

A formula is not a program. In a code box it arrives wearing a language chip,
line numbers and a copy button, all of which are lies about it, and the
equation itself is left as flat monospace text with its square roots, powers
and fractions typed out in ASCII. The `formula` block typesets the expression
with KaTeX and lists what each symbol means.

Only the blocks listed here are touched, each matched by the code it currently
holds, so a re-run after an edit changes nothing rather than guessing. Blocks
whose content is a worked procedure or a comparison rather than an equation are
deliberately left alone -- those want a list or a table, not this block.

    python scripts/convert_code_blocks_to_formulas.py            # preview only
    python scripts/convert_code_blocks_to_formulas.py --apply    # write
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


def where(*pairs):
    return [{"id": new_id(), "symbol": symbol, "meaning": meaning} for symbol, meaning in pairs]


def formula(name, latex, symbols=(), note=""):
    return {
        "id": new_id(),
        "name": name,
        "latex": latex,
        "where": where(*symbols),
        "note": note,
    }


# lesson_id -> the code block's current `title` -> the formula block that replaces it.
CONVERSIONS = {
    774: {
        "Basic Electrical Calculations": {
            "smallHeader": "Electrical formulas",
            "description": "",
            "caption": "Key electrical formulas used in industrial facility management and equipment selection.",
            "items": [
                formula(
                    "Ohm's Law",
                    r"V = I \times R",
                    [
                        ("V", "voltage, in volts"),
                        ("I", "current, in amps"),
                        ("R", "resistance, in ohms"),
                    ],
                ),
                formula(
                    "Power",
                    r"P = V \times I = I^2 \times R = \frac{V^2}{R}",
                    [("P", "power, in watts")],
                ),
                formula(
                    "Three-phase power",
                    r"P = \sqrt{3} \times V \times I \times PF",
                    [("PF", "power factor")],
                    note="For three-phase systems √3 ≈ 1.732.",
                ),
                formula(
                    "Energy cost",
                    r"\text{Cost} = \text{Power (kW)} \times \text{Time (h)} \times \text{Rate (\$/kWh)}",
                    [],
                    note="A 50 kW motor running 8 hours at $0.12/kWh costs $48 per shift.",
                ),
            ],
        },
        "Work Standard Calculation": {
            "smallHeader": "From observed time to standard time",
            "description": "",
            "caption": "Each step of a time study, from the stopwatch reading to the standard a line is run to.",
            "items": [
                formula(
                    "Normal time",
                    r"NT = OT \times R_p",
                    [
                        ("NT", "normal time"),
                        ("OT", "observed time, the average of several observations"),
                        ("R_p", "performance rating"),
                    ],
                    note="10 minutes observed at a 1.10 rating gives 11 minutes of normal time.",
                ),
                formula(
                    "Total allowance",
                    r"A = A_{\text{fatigue}} + A_{\text{personal}} + A_{\text{delay}}",
                    [("A", "total allowance, as a fraction of normal time")],
                    note=(
                        "Fatigue is typically 5-10% of normal time, personal 3-5%, "
                        "and delay 2-5%."
                    ),
                ),
                formula(
                    "Standard time",
                    r"ST = NT \times (1 + A)",
                    [("ST", "standard time per unit")],
                    note="11 minutes of normal time with a 15% allowance gives 12.65 minutes per unit.",
                ),
            ],
        },
        "Economic Order Quantity (EOQ) Calculation": {
            "smallHeader": "Economic order quantity",
            "description": "",
            "caption": "EOQ minimises total inventory cost by balancing ordering cost against holding cost.",
            "items": [
                formula(
                    "Economic order quantity",
                    r"EOQ = \sqrt{\frac{2DS}{H}}",
                    [
                        ("D", "annual demand, in units"),
                        ("S", "ordering cost per order"),
                        ("H", "holding cost per unit per year"),
                    ],
                ),
                formula(
                    "Worked example",
                    r"EOQ = \sqrt{\frac{2 \times 10{,}000 \times 50}{2}} = \sqrt{500{,}000} \approx 707",
                    [],
                    note=(
                        "Demand of 10,000 units a year, $50 to place an order and $2 to hold a "
                        "unit for a year gives 707 units per order.\n"
                        "That is 14.1 orders a year, and an average inventory of 354 units."
                    ),
                ),
            ],
        },
        "Linear Programming Example: Production Mix": {
            "smallHeader": "Linear programming: production mix",
            "description": "",
            "caption": "Linear programming finds the production mix that maximises profit within the resources available.",
            "items": [
                formula(
                    "Objective",
                    r"\text{Maximise } Z = 50X + 40Y",
                    [
                        ("X", "units of Product A, at $50 profit each"),
                        ("Y", "units of Product B, at $40 profit each"),
                    ],
                ),
                formula(
                    "Subject to",
                    r"\begin{aligned} 2X + 1Y &\le 100 \\ 1X + 2Y &\le 80 \\ X &\le 40 \\ X,\, Y &\ge 0 \end{aligned}",
                    [],
                    note=(
                        "100 hours of machine time, 80 hours of labour, and 40 units of "
                        "Material A, with neither product produced in negative quantity."
                    ),
                ),
                formula(
                    "Optimal solution",
                    r"X = 40,\quad Y = 20,\quad Z = 50(40) + 40(20) = \$2{,}800",
                    [],
                    note="Found with the simplex method.",
                ),
            ],
        },
        "Net Present Value (NPV) Calculation": {
            "smallHeader": "Net present value",
            "description": "",
            "caption": "NPV says whether a project's benefits exceed its costs once both are stated in today's money.",
            "items": [
                formula(
                    "Net present value",
                    r"NPV = -C_0 + \sum_{t=1}^{n} \frac{CF_t}{(1 + r)^t}",
                    [
                        ("C_0", "initial investment"),
                        ("CF_t", "net cash flow in year t"),
                        ("r", "discount rate, the required return"),
                        ("t", "the year"),
                    ],
                ),
                formula(
                    "Worked example",
                    r"NPV = -\$100{,}000 + \$27{,}273 + \$28{,}926 + \$30{,}053 + \$17{,}075 = \$3{,}327",
                    [],
                    note=(
                        "$100,000 invested at a 10% discount rate, against cash flows of "
                        "$30,000, $35,000, $40,000 and $25,000 over four years.\n"
                        "A positive NPV means the project adds $3,327 of value."
                    ),
                ),
            ],
        },
        "Present Value and Future Value Calculations": {
            "smallHeader": "The time value of money",
            "description": "",
            "caption": "These three let cash flows in different years be compared on equal terms.",
            "items": [
                formula(
                    "Future value",
                    r"FV = PV \times (1 + r)^n",
                    [
                        ("FV", "future value"),
                        ("PV", "present value"),
                        ("r", "interest rate per period"),
                        ("n", "number of periods"),
                    ],
                    note="$1,000 today at 5% for 3 years is worth $1,157.63.",
                ),
                formula(
                    "Present value",
                    r"PV = \frac{FV}{(1 + r)^n}",
                    [],
                    note="$1,000 received in 3 years, discounted at 5%, is worth $863.84 today.",
                ),
                formula(
                    "Annuity payment",
                    r"A = PV \times \frac{r(1+r)^n}{(1+r)^n - 1}",
                    [("A", "payment per period")],
                    note="A $10,000 loan at 6% over 5 years costs $2,374 a year.",
                ),
            ],
        },
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
                        "type": "formula",
                        "data": json.loads(json.dumps(replacement)),
                    }
                    changed = True
                    converted += 1
                    print(f"lesson {lesson_id}: {title!r} -> formula ({len(replacement['items'])} items)")

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
