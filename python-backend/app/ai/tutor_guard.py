"""Guardrails for every AI tutor surface: the free chat (plain and streamed) and
the guided Dialogue.

Two directions, both screened before anything is shown or stored:

* **learner -> tutor** (`check_learner_message`): vulgar or abusive language,
  attempts to jailbreak or re-instruct the tutor, requests for unsafe help
  (hacking, cheating). A blocked message never reaches a model -- it is answered
  with a calm, fixed redirect, which also costs no tokens. Email addresses and
  phone numbers are redacted rather than blocked, so a learner who shares one
  by accident still gets help without their details going to a model provider.
* **tutor -> learner** (`check_tutor_reply`): toxic wording, and the existing
  secret/injection scanners from `app.ai.guardrails`.

Layered like `app.ai.guardrails`: fast deterministic patterns are the floor and
always run; the Guardrails AI validators (profanity, toxicity)
are consulted on top when installed (the jailbreak model was left out: over 1 GB of
memory for what the instruction-override patterns and the dialogue's on-topic check
already catch). A validator that is missing, fails to load
or errors is skipped -- a safety layer must never take the tutor down.
"""

from __future__ import annotations

import logging
import os
import re
import threading
from dataclasses import dataclass

from app.ai.guardrails import scan_sensitive

logger = logging.getLogger(__name__)

ENABLED = os.getenv("TUTOR_GUARDRAILS", "on").lower() not in ("0", "off", "false", "no")

_VULGAR = re.compile(
    r"\b(f+u+c+k\w*|f\*+\w*|sh[i1]t\w*|s\*+t|b[i1]tch\w*|asshole|bastard|dick(head)?|cunt|"
    r"motherf\w*|wtf|stfu|putang\s*ina|gago|tanga|bobo|ulol|tarantado)\b",
    re.IGNORECASE,
)
_INJECTION = re.compile(
    r"(ignore|disregard|forget)\s+(all\s+|any\s+|the\s+|your\s+)?(previous\s+|prior\s+|above\s+|earlier\s+)?"
    r"(instructions|rules|prompt)|system\s+prompt|developer\s+mode|jailbreak|\bDAN\b|you\s+are\s+now\s+|"
    r"pretend\s+(you|to)\s+(are|be|have)\s+no|mark\s+(everything|it|all)\s+(as\s+)?correct|give\s+me\s+full\s+marks",
    re.IGNORECASE,
)
_UNSAFE = re.compile(
    r"\b(hack|hacking|exploit|crack|ddos|malware|keylogger|ransomware|phish\w*|steal\s+(password|data)|"
    r"bypass\s+(login|security)|sql\s+injection|cheat\s+on|make\s+a\s+bomb|kill\s+(myself|someone))\b",
    re.IGNORECASE,
)
# The tutor echoing its own instructions or chat-template tokens. Polite refusals
# ("I'm sorry, but I can only help with this lesson") are fine and NOT matched.
_LEAK = re.compile(
    r"(my|the)\s+system\s+prompt\s+(is|says)|here\s+(is|are)\s+my\s+instructions|<\|im_(start|end)\|>|<\|endoftext\|>",
    re.IGNORECASE,
)
_EMAIL = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}\b")
_PHONE = re.compile(r"(?<!\d)(?:\+?\d[\d\s().-]{8,}\d)(?!\d)")

REDIRECTS = {
    "vulgar": "Let's keep it respectful so we can focus on the lesson.",
    "toxic": "Let's keep it respectful so we can focus on the lesson.",
    "injection": "I can only help you with this lesson, so let's stay on track.",
    "jailbreak": "I can only help you with this lesson, so let's stay on track.",
    "unsafe": "I can't help with that, but I'm happy to help you with the lesson.",
}
SAFE_REPLY = (
    "Sorry, I couldn't write a good answer to that. Could you ask it another way, "
    "about something in this lesson?"
)


@dataclass(frozen=True)
class LearnerCheck:
    blocked: bool
    reason: str | None
    text: str  # the message to send on, with personal details redacted

    @property
    def redirect(self) -> str:
        return REDIRECTS.get(self.reason or "", REDIRECTS["injection"])


# ---- Guardrails AI validators, loaded once and lazily -----------------------------------

_lock = threading.Lock()
_guards: dict[str, object] | None = None


def _load_guards() -> dict[str, object]:
    global _guards
    if _guards is not None:
        return _guards
    with _lock:
        if _guards is not None:
            return _guards
        guards: dict[str, object] = {}
        try:
            from guardrails import Guard
        except Exception as error:  # noqa: BLE001 -- optional dependency
            logger.info("Guardrails AI not installed; tutor guard runs on patterns only (%s)", error)
            _guards = guards
            return guards

        makers = {
            "profanity": lambda: __import__("guardrails_ai.profanity_free", fromlist=["ProfanityFree"])
            .ProfanityFree(on_fail="noop"),
            "toxic": lambda: __import__("guardrails_ai.toxic_language", fromlist=["ToxicLanguage"])
            .ToxicLanguage(threshold=0.6, validation_method="full", on_fail="noop"),
        }
        for name, make in makers.items():
            try:
                guards[name] = Guard().use(make())
            except Exception as error:  # noqa: BLE001 -- one broken validator must not disable the rest
                logger.warning("Guardrails validator %s unavailable: %s", name, error)
        logger.info("Tutor guardrails loaded: %s", ", ".join(guards) or "none")
        _guards = guards
        return guards


def warm_up() -> None:
    """Loads the validator models ahead of the first learner message."""
    if ENABLED:
        _load_guards()


def _fails(name: str, text: str) -> bool:
    guard = _load_guards().get(name)
    if guard is None:
        return False
    try:
        return not guard.validate(text).validation_passed
    except Exception as error:  # noqa: BLE001
        logger.warning("Guardrails validator %s errored, skipped: %s", name, error)
        return False


# ---- Public checks ------------------------------------------------------------------------

def redact_personal_details(text: str) -> str:
    text = _EMAIL.sub("[email removed]", text)
    return _PHONE.sub("[phone removed]", text)


def check_learner_message(text: str) -> LearnerCheck:
    """Screens what a learner typed. Blocking work (models) -- call off the event loop."""
    message = (text or "").strip()
    if not ENABLED or not message:
        return LearnerCheck(False, None, message)

    if _VULGAR.search(message):
        return LearnerCheck(True, "vulgar", message)
    if _INJECTION.search(message):
        return LearnerCheck(True, "injection", message)
    if _UNSAFE.search(message):
        return LearnerCheck(True, "unsafe", message)

    redacted = redact_personal_details(message)
    if _fails("profanity", redacted):
        return LearnerCheck(True, "vulgar", redacted)
    if _fails("toxic", redacted):
        return LearnerCheck(True, "toxic", redacted)
    return LearnerCheck(False, None, redacted)


def check_tutor_reply(text: str) -> str:
    """The tutor's reply if it is safe to show, else a neutral fallback."""
    reply = text or ""
    if not ENABLED or not reply.strip():
        return reply
    if scan_sensitive(reply) or _LEAK.search(reply):
        logger.warning("Tutor reply withheld: sensitive data or injected instructions")
        return SAFE_REPLY
    if _fails("toxic", reply):
        logger.warning("Tutor reply withheld: toxic wording")
        return SAFE_REPLY
    return reply
