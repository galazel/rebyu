"""One-off repair (2026-11-12) of the questions flagged while backfilling explanations.

- 23496: wrong option was marked correct.
- 23485: no option was correct (0101 1100 >> 3 is 0000 1011).
- 381, 387: "pillars of information security" read as CIA, but the answer key uses the
  IPA classification of security MEASURES (technical, physical, human); reworded to say so.
- 23434-23436: keyboard-mash test items, the whole 'World Cup' paper (exam 608). Replaced
  in place with real lesson-1 questions so the paper and its attempt history keep working.

Every question gets its question-level and per-choice explanations. One transaction.

    PYTHONPATH=. .venv/Scripts/python scripts/fix_flagged_questions_2026_11_12.py
"""
from sqlalchemy import text

from app.db.session import SessionLocal

# question_id -> (new stem or None to keep, explanation, {choice_id: (text or None, correct, why)})
FIXES = {
    23496: (None,
            "Organisational structure determines decision-making speed and accountability: it sets who owns each "
            "PDCA step, who approves changes and how results are reported, so it shapes how well each cycle runs.",
            {86446: (None, True, "Correct: structure sets decision speed and accountability, which drive how PDCA is executed."),
             86447: (None, False, "PDCA is used across the whole organisation, so structure matters far beyond IT."),
             86448: (None, False, "Structure is highly relevant: unclear ownership or slow approvals stall the Check and Act steps."),
             86449: (None, False, "Structure affects every improvement activity, not only hiring.")}),
    23485: (None,
            "0b0101 1100 is 92. An arithmetic right shift by 3 divides by 2^3 and copies the sign bit (0 here) "
            "into the vacated bits: 92 / 8 = 11 (remainder dropped), which is 0b0000 1011.",
            {86402: ("0b0000 1011", True, "Correct: shifting right 3 places gives 0000 1011 (92 / 8 = 11)."),
             86403: (None, False, "0010 1110 (46) is a shift of only 1 place."),
             86404: ("0b0001 0111", False, "0001 0111 (23) is a shift of 2 places, not 3."),
             86405: (None, False, "1110 1110 would require a 1 sign bit; this value is positive, so 0s are shifted in.")}),
    381: ("Information security measures are commonly grouped into three categories: technical, physical and "
          "human. Which of the following is one of these three categories?",
          "Security measures are classified as technical (e.g. encryption, access control), physical (e.g. locked "
          "rooms, ID cards) and human (e.g. rules, training, awareness). Human security is one of the three.",
          {653: (None, False, "Economic security concerns a nation's economy, not a category of information security measures."),
           654: (None, False, "Environmental security is about natural surroundings, not information protection measures."),
           655: (None, False, "Political security is a national-policy concept, not a category of security measures."),
           656: (None, True, "Correct: human security measures such as rules, education and awareness are one of the three categories.")}),
    387: ("A company sets a rule that all employees must choose strong, unique passwords and trains them on how to "
          "do it. Which category of information security measure is this?",
          "A rule employees must follow, backed by training, is a human security measure: it protects information "
          "by shaping people's behaviour. Enforcing password strength automatically in software would be technical.",
          {661: (None, False, "Operational security is not one of the three categories (technical, physical, human)."),
           662: (None, False, "Technical measures are enforced by systems, such as software that rejects weak passwords; this is a rule and training for people."),
           663: (None, True, "Correct: a rule plus training aimed at employees' behaviour is a human security measure."),
           664: (None, False, "Physical measures protect premises and equipment, such as locks and entry cards.")}),
    23434: ("A company organises its staff into departments such as sales, manufacturing and accounting, each "
            "specialising in one kind of work. What kind of organisational structure is this?",
            "This is a functional organisation: staff are grouped by specialised function, which builds expertise "
            "and efficiency but can make cross-department coordination slower.",
            {86198: ("Functional organisation", True, "Correct: grouping by function such as sales, manufacturing and accounting is a functional organisation."),
             86199: ("Divisional organisation", False, "A divisional organisation is split by product, region or market, each division with its own functions."),
             86200: ("Matrix organisation", False, "A matrix organisation has staff reporting to both a functional manager and a project manager."),
             86201: ("Project organisation", False, "A project organisation forms temporary teams for a specific project and disbands them afterwards.")}),
    23435: ("Which of the following best describes corporate social responsibility (CSR)?",
            "CSR means a company takes responsibility for its impact on society and its stakeholders, such as "
            "customers, employees, communities and the environment, and does not pursue profit alone.",
            {86202: ("Acting responsibly toward society and stakeholders, not only pursuing profit", True,
                     "Correct: CSR is responsibility to society and all stakeholders beyond profit."),
             86203: ("Maximising dividends for shareholders above every other goal", False,
                     "Putting shareholders above all else is shareholder primacy, the opposite of CSR's broader view."),
             86204: ("Doing only what tax and company laws strictly require", False,
                     "Legal compliance is the minimum; CSR goes beyond what the law requires."),
             86205: ("Outsourcing all social activities to outside charities", False,
                     "CSR is the company's own responsibility; handing it all to others does not meet it.")}),
    23436: ("In a divisional organisation, on what basis is the company divided?",
            "A divisional organisation is divided by product, region or market. Each division has its own functions, "
            "such as sales and production, and is responsible for its own results.",
            {86206: ("By product, region or market, each division with its own functions", True,
                     "Correct: divisions are built around products, regions or markets and are largely self-contained."),
             86207: ("By job function across the whole company", False,
                     "Grouping by job function company-wide is a functional organisation."),
             86208: ("By dual reporting to a function manager and a project manager", False,
                     "Dual reporting is the defining feature of a matrix organisation."),
             86209: ("By temporary teams formed for each project", False,
                     "Temporary teams per project describe a project organisation.")}),
}

session = SessionLocal()
try:
    for qid, (stem, explanation, choices) in FIXES.items():
        own = {row[0] for row in session.execute(
            text("select choice_id from choices where question_id = :q"), {"q": qid})}
        assert set(choices) == own, (qid, sorted(own), sorted(choices))
        assert sum(1 for _, correct, _ in choices.values() if correct) == 1, qid
        if stem:
            session.execute(text("update questions set question_text = :t where question_id = :q"),
                            {"t": stem, "q": qid})
        session.execute(text("update questions set explanation = :e where question_id = :q"),
                        {"e": explanation, "q": qid})
        for cid, (choice_text, correct, why) in choices.items():
            if choice_text:
                session.execute(text("update choices set choice_text = :t where choice_id = :c"),
                                {"t": choice_text, "c": cid})
            session.execute(text("update choices set is_correct = :k, explanation = :w where choice_id = :c"),
                            {"k": correct, "w": why, "c": cid})
        if stem:
            # Attempts snapshot the stem; keep past attempts readable with the new wording.
            session.execute(text("update assessment_attempt_questions set question_text_snapshot = :t "
                                 "where source_question_id = :q"), {"t": stem, "q": qid})
        print(f"fixed {qid}")
    session.commit()
    print("committed")
except Exception:
    session.rollback()
    raise
finally:
    session.close()
