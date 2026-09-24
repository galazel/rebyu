"""User-message builders for the certification workflow."""

from __future__ import annotations

from typing import Any


def build_document_audit_prompt(
    certification_name: str, certification_description: str, document_samples: str
) -> str:
    return (
        f"Certification Name: {certification_name}\n"
        f"Description: {certification_description}\n\n"
        f"Document Samples:\n{document_samples}"
    )


def build_curriculum_prompt(
    certification_name: str, certification_description: str, context: str,
    total_lessons: int | None = None,
) -> str:
    prompt = f"""
Create a complete certification curriculum.

Certification:
{certification_name}

Description:
{certification_description}

Reference Materials:
{context}
""".rstrip()

    # Carried on the prompt rather than in the system prompt because the
    # system prompt is built once, when the agent is created and cached,
    # while this number is the admin's answer for THIS run. Stated as an
    # exact total, since "3 to 5 per topic" multiplies out to a range wide
    # enough that the admin cannot predict what they will get.
    if total_lessons:
        prompt += f"""

HOW MANY LESSONS
This curriculum must contain EXACTLY {total_lessons} lessons in total across
the whole certification -- not per category, per certification. Distribute
them across the major and middle categories by how much material each area
actually holds, rather than dividing them evenly.

This number governs. Where it conflicts with any per-category count given in
your instructions, this total wins: produce however many categories it takes
to hold exactly {total_lessons} lessons.

It is a target, not a ceiling to shelter under: {total_lessons} lessons is
what the admin asked to be taught, and a plan that stops at half of it leaves
the rest of the syllabus untaught, because no later stage adds lessons."""

    return prompt + "\n\nGenerate the curriculum now."


def _key_topics(lesson: dict[str, Any]) -> str:
    """The planner's topic list for a lesson, as prompt text.

    Falls back to the old `lessonGenerationInstructions` object so a run whose
    curriculum was checkpointed before the planner was slimmed down still
    carries its guidance into the lesson prompt -- those runs resume from
    Postgres and would otherwise lose it silently. See
    `app.schemas.certification.curriculum_schema`.
    """
    topics = lesson.get("key_topics")
    if isinstance(topics, (list, tuple)):
        return "\n".join(f"- {topic}" for topic in topics if topic)
    return str(topics or lesson.get("lessonGenerationInstructions") or "")


def build_lesson_prompt(
    certification_name: str,
    major: dict[str, Any],
    middle: dict[str, Any],
    lesson: dict[str, Any],
    source_material: str = "",
) -> str:
    prompt = f"""
Generate a complete lesson.

Certification:
{certification_name}

Major Category:
{major.get("name", "")}

Middle Category:
{middle.get("name", "")}

Lesson:
{lesson.get("name", "")}

Learning Objective:
{lesson.get("learning_objective", "")}

Key Topics to cover:
{_key_topics(lesson)}

Every topic listed above MUST be taught in this lesson -- explained, worked
through and exemplified, not named in passing. This list is the curriculum's
guarantee that the certification covers its whole domain: a topic assigned
here and skipped is a topic the learner is never taught anywhere, because no
other lesson is responsible for it. Give each one its own section or sections.
""".strip()

    # Source precedence, stated where the material is, not in the system
    # prompt: the admin uploaded these documents so that the certification
    # would be built from THEM. Searching first and reading them second is how
    # a course ends up teaching a topic in terminology the real exam does not
    # use, while the exam's own syllabus sits unread in the index.
    if source_material:
        prompt += f"""

--------------------------------------------------
SOURCE MATERIAL -- from the documents uploaded for this certification
--------------------------------------------------
{source_material}
--------------------------------------------------

This is the certification's OWN material and it takes precedence over
everything else you know. Teach these topics as this material frames them:
its terminology, its definitions, its emphasis, its worked examples. Where it
covers a topic, you do not need to search -- you already have the authoritative
source, and a web result that disagrees with it is wrong for this
certification whatever it says.

Use `search_more_lesson_info` only for a topic in the list above that this
material does NOT cover, or where it is too thin to teach from. Never
contradict the material above with something you searched; if a search
disagrees, the material above wins.

Be more informative than the source, not a thinner copy of it -- add the
context it assumes and the worked example it omits -- but do not drift from
what it actually teaches."""
    else:
        prompt += """

No source material was indexed for this lesson. Write it from your own
knowledge of the certification, and use `search_more_lesson_info` to ground
anything you are not certain of."""

    # Carried as its own field rather than appended to the topic list, so
    # reviewer prose can never be mistaken for a topic the lesson must cover.
    feedback = lesson.get("review_feedback")
    if feedback:
        prompt += (
            "\n\nReviewer feedback on the previous version of this lesson "
            f"-- apply it:\n{feedback}"
        )
    return prompt


def build_lesson_audit_prompt(certification_name: str, curriculum: Any, lessons: Any) -> str:
    return f"""
Review the generated lessons.

Certification:
{certification_name}

Curriculum:
{curriculum}

Generated Lessons:
{lessons}

Determine whether every generated lesson follows the curriculum,
its learning objective, and its key topics.
""".strip()


def build_question_audit_prompt(certification_name: str, lesson_name: str, items: list[dict]) -> str:
    """One lesson's questions, labelled, for the duplicate audit. `items` are
    `{label, type, question, answer}`; the answer is shown because two stems
    worded apart can still be the same question, and the answer is what gives
    that away."""
    lines = []
    for item in items:
        answer = item.get("answer") or "(open answer)"
        lines.append(
            f"[{item['label']}] ({item.get('type') or 'QUESTION'}) {item['question']}\n"
            f"    answer: {answer}"
        )
    listed = "\n".join(lines)
    return f"""
Find the duplicate questions among these.

Certification: {certification_name}
Lesson: {lesson_name}

Questions ({len(items)}):
{listed}

Group every set of questions that test the same thing; name the one to keep in
each group and the labels of its duplicates. Use only the labels shown.
""".strip()
