"""Classroom-conduct check for Live Tutor learner messages.

A cheap word-boundary scan, not a model call: it runs on every submitted
answer, so it must be instant and free. It only decides *how* the teacher
should respond; the voice model still words the response itself.
"""
from __future__ import annotations

import re
from dataclasses import dataclass

# English and Filipino/Taglish, as learners actually type or are transcribed.
_PROFANITY = [
    r"f+u+c+k\w*", r"sh+i+t+\w*", r"bitch\w*", r"asshole\w*", r"bastard\w*", r"dick(head)?s?",
    r"pussy", r"cunt\w*", r"motherf\w*", r"wtf", r"stfu", r"damn(it)?", r"crap",
    r"putang\s*ina\w*", r"puta\w*", r"tang\s*ina\w*", r"pota", r"gago\w*", r"gaga", r"ulol\w*",
    r"leche", r"lintik", r"punyeta", r"pakyu", r"pak\s*yu", r"hayop\s*ka", r"kupal\w*", r"tarantado\w*",
    r"bwisit\w*", r"pucha",
]
# Name-calling aimed at the teacher (or anyone), not just a stray swear word.
_INSULT = [
    r"(you('?re| are)|ur|u r)\s+(so\s+)?(stupid|dumb|useless|an?\s+idiot|trash|garbage|retarded|annoying|boring|worthless)",
    r"(stupid|dumb|useless|idiot|trash)\s+(teacher|tutor|bot|ai)",
    r"shut\s+up", r"(go\s+)?kill\s+yourself", r"kys",
    r"(bobo|tanga|inutil|engot|tonto)\s*(ka|mo|naman|talaga)?", r"ang\s+(bobo|tanga)\s+mo",
]
_SEXUAL = [r"sex+y", r"nudes?", r"porn\w*", r"horny", r"boobs?", r"send\s+(me\s+)?pics", r"kantot\w*", r"jakol\w*", r"libog\w*"]
_THREAT = [r"i('?ll| will)\s+(kill|hurt|beat|stab|shoot)\s+(you|him|her|them|someone)", r"papatayin\s+kita", r"bomb\s+(the\s+)?school"]
# Never scold these. A teacher stops the lesson and checks on the student.
_DISTRESS = [r"kill\s+myself", r"want\s+to\s+die", r"end\s+my\s+life", r"suicid\w*", r"hurt\s+myself", r"self[-\s]?harm", r"magpapakamatay", r"gusto\s+ko\s+(nang\s+)?mamatay"]


def _compile(patterns: list[str]) -> re.Pattern:
    return re.compile(r"(?<![a-z])(" + "|".join(patterns) + r")(?![a-z])", re.IGNORECASE)


_CHECKS = [
    ("distress", _compile(_DISTRESS)),
    ("threat", _compile(_THREAT)),
    ("sexual", _compile(_SEXUAL)),
    ("insult", _compile(_INSULT)),
    ("profanity", _compile(_PROFANITY)),
]

# Common masking: f*ck, sh!t, b1tch, @ss.
_UNMASK = {"*": "", "@": "a", "$": "s", "!": "i", "1": "i", "|": "i", "0": "o"}


@dataclass(frozen=True)
class Conduct:
    kind: str  # "ok", "profanity", "insult", "sexual", "threat", "distress"

    @property
    def is_misconduct(self) -> bool:
        return self.kind in ("profanity", "insult", "sexual", "threat")


def classify(message: str | None) -> Conduct:
    text = re.sub(r"[*@$!1|0]", lambda match: _UNMASK[match.group()], message or "")
    for kind, pattern in _CHECKS:
        if pattern.search(text):
            return Conduct(kind)
    return Conduct("ok")


_BASE = (
    "CLASSROOM CONDUCT: respond like an experienced, caring classroom teacher, not a chatbot. "
    "Never repeat the offensive word, never swear back, never mock, shame, threaten, or lecture at length. "
    "Speak calmly and firmly in a short, natural sentence or two, name the behaviour (not the person), state the expectation, "
    "then steer straight back to the lesson concept you were on. Do not grade or answer the inappropriate part. "
)

_BY_STRIKE = {
    1: "This is the FIRST time. Give a brief, calm reminder, the way a teacher would in class, "
       "e.g. 'Hey, let's keep our language respectful here.' If it sounds like frustration with the topic, acknowledge that it's hard, "
       "then redirect: 'I can see this part is tricky, let's slow down.' Then continue teaching.",
    2: "This is the SECOND time. Be noticeably firmer and more serious, like a teacher who has already warned the class once, "
       "e.g. 'I've already asked you once. That kind of language isn't okay in our lesson.' Ask them to answer the question properly, then continue.",
    3: "This has happened THREE or more times. Stop the lesson flow briefly, like a teacher having a quiet word after class: "
       "say plainly that you won't continue the lesson while they speak this way, suggest they take a short break and come back ready to learn, "
       "and that you'll pick up from the same concept. Stay calm and respectful; do not be harsh or sarcastic.",
}

_KIND = {
    "profanity": "",
    "insult": "The learner insulted you or someone. Don't take it personally or get defensive; a teacher stays composed and sets a boundary. ",
    "sexual": "The learner made a sexual or inappropriate remark. Shut it down immediately and seriously, with no joking and no engagement with the content. ",
    "threat": "The learner said something threatening or violent. Take it seriously: say clearly that threats are never okay, "
              "and that if anyone is in danger they must tell a parent, teacher, or school staff right now. Do not continue teaching until they respond. ",
}

_DISTRESS_DIRECTIVE = (
    "WELLBEING: the learner may be expressing thoughts of self-harm or wanting to die. Do NOT scold, do NOT continue the lesson. "
    "Stop teaching and respond like a caring teacher: tell them you're glad they said something, that they matter, and ask gently if they are safe right now. "
    "Encourage them to talk to someone they trust today, a parent, teacher, guidance counselor, or friend, and that in the Philippines they can call or text "
    "the NCMH crisis hotline at 1553, or in an emergency call 911. Keep it warm and short. Only return to the lesson if they say they're okay and want to."
)


def conduct_directive(conduct: Conduct, strikes: int) -> str:
    if conduct.kind == "distress":
        return _DISTRESS_DIRECTIVE
    if not conduct.is_misconduct:
        return ""
    return _BASE + _KIND[conduct.kind] + _BY_STRIKE[min(max(strikes, 1), 3)]
