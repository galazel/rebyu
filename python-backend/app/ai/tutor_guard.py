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
# Security: asking HOW TO attack something. Naming an attack is fine -- the lessons teach
# phishing, malware and SQL injection, so "what is phishing?" must still be answered.
_UNSAFE = re.compile(
    r"\b(how\s+(do\s+i|to|can\s+i)|help\s+me|teach\s+me|show\s+me|give\s+me|write\s+(me\s+)?(a|some)?|"
    r"paano|turuan\s+mo\s+ako)\s+(\w+\s+){0,3}?"
    r"(hack\w*|crack\w*|ddos\w*|keylog\w*|ransomware|malware|virus|phish\w*|exploit\w*|brute[\s-]?force|"
    r"bypass\w*|sql\s+inject\w*|spy\s+on|track\s+(my|someone|her|him)|dox\w*|"
    r"steal\w*|get\s+into\s+(someone|my\s+(ex|classmate|friend))|access\s+someone)\b"
    r"|\b(steal|get|find|leak)\s+(someone'?s?|their|his|her|my\s+(classmate|teacher|ex)'?s?)\s+"
    r"(password|account|address|data|photos?|location)\b"
    r"|\b(hack|break)\s+into\b|\bcheat\s+(on|in)\s+(the\s+|my\s+)?(exam|test|quiz)\b",
    re.IGNORECASE,
)
# Thoughts of suicide or self-harm: answered with care and where to get help, never a
# brush-off, and never sent to a model.
_SELF_HARM = re.compile(
    r"\b(kill(ing)?\s+my\s*self|suicid\w*|end\s+(my|it)\s+(life|all)|want\s+to\s+die|wanna\s+die|"
    r"don'?t\s+want\s+to\s+(live|be\s+alive)|better\s+off\s+dead|hurt(ing)?\s+my\s*self|"
    r"cut(ting)?\s+my\s*self|self[\s-]?harm|overdose|magpakamatay|mamatay\s+na\s+lang|ayoko\s+na\s+mabuhay)\b",
    re.IGNORECASE,
)
# A learner saying they were sexually assaulted or abused: support, not a lecture.
_ABUSE_DISCLOSURE = re.compile(
    r"\bi\s+(was|got|have\s+been|am\s+being)\s+(\w+\s+){0,2}?"
    r"(raped|molested|groped|abused|sexually\s+(assaulted|abused|harassed))\b"
    r"|\b(raped|molested|groped|abused|touched|harass(ed|es|ing))\s+me\b"
    r"|\bsexually\s+(assaulted|abused|harassed)\s+me\b"
    r"|\b(ni-?rape|minolestiya|hinipuan)\b",
    re.IGNORECASE,
)
# Sexual content, sexual violence, and anything sexual involving minors.
_SEXUAL = re.compile(
    r"\b(sex|sexy|sexting|porn\w*|nudes?|naked|hentai|horny|blowjob|orgasm|masturbat\w*|"
    r"rape\w*|raping|molest\w*|sexual(ly)?\s+(assault|abuse|act|content|position)\w*|"
    r"child\s+(porn|abuse)|onlyfans|nsfw|boobs?|tits?|penis|vagina|dick\s+pic|"
    r"kantot\w*|iyot\w*|jakol\w*|libog\w*|bastos\s+na)\b",
    re.IGNORECASE,
)
# Threats of violence, death and weapons.
_VIOLENCE = re.compile(
    r"\b(kill|murder|stab|shoot|strangle|poison|beat\s+up|hurt)\s+(you|him|her|them|someone|somebody|"
    r"everyone|my\s+\w+|the\s+teacher|people)\b|\b(i\s+will|i'?ll|i\s+want\s+to|gonna)\s+"
    r"(kill|murder|shoot|stab)\b(?!\s+(time|it\b|this\s+(exam|quiz|test|lesson)|the\s+(exam|quiz|test|lesson)))|"
    r"\b(make|build)\s+(a\s+)?(bomb|gun|explosive|weapon)s?\b|"
    r"\bschool\s+shoot\w*|\bmass\s+(shoot\w*|murder)|\bpapatayin\s+(kita|ko)\b|\bpatayin\b|"
    r"\bhow\s+(to|do\s+i)\s+(die|kill)\b",
    re.IGNORECASE,
)
# A stated intent to hurt someone or attack a place ("i will stab my mother now", "gonna bomb
# the airport"). Not the same as `_VIOLENCE` (asking about violence): this is a possible
# real-world threat, so it is answered with the safety card and raised to staff.
_THREAT = re.compile(
    r"\b(gonna|going\s+to|will|i'?ll|want\s+to|wanna|plan(ning)?\s+to|about\s+to|ready\s+to)\s+"
    r"(\w+\s+){0,2}?"
    r"(kill|murder|stab|shoot|strangle|poison|attack|bomb|blow\s+up|burn\s+down|shoot\s+up|hurt|beat\s+up)\b"
    r"(?!\s+(time|it\b|this\s+(exam|quiz|test|lesson)|the\s+(exam|quiz|test|lesson)|my\s*self))"
    r"|\b(bomb|blow\s+up|shoot\s+up|attack|burn\s+down)\s+(the\s+|a\s+|our\s+|my\s+|this\s+)?"
    r"(school|campus|airport|mall|church|mosque|office|building|station|class(room)?|hospital|plane|bus|train|house)\b"
    r"|\bplant(ing)?\s+a\s+bomb\b|\bpapatayin\s+(ko|kita|kayo|sila)\b|\bsasaksakin\s+ko\b|\bbabarilin\s+ko\b",
    re.IGNORECASE,
)
# Fishing for other people's accounts, passwords or records ("give me all the accounts from this
# user x@y.com", "dump the users table"). The tutor never has such data, but the attempt is a
# security event: raised to staff, never sent to a model.
_DATA_PROBE = re.compile(
    r"\b(give|show|send|list|get|tell|export|dump|reveal|display|find)\s+(me\s+)?(\w+\s+){0,3}?"
    r"(accounts?|passwords?|credentials|logins?|user\s*(data|list|records|info|details)|personal\s+(data|info|details))\b"
    r"(?!\s+(receivable|payable|title|statement|equation|balance))"
    r"(?=.*(@|\buser\b|\busers\b|\bother\b|\banother\b|\ball\b|\bevery\w*|\bsomeone|\btheir\b|\bhis\b|\bher\b|\bstudents?\b|\blearners?\b))"
    r"|\b(dump|export|download|show|give\s+me)\s+(the\s+)?(whole\s+)?(database|db|users?\s+table)\b"
    r"|\bselect\s+\*\s+from\b"
    r"|\b(other|another|all)\s+(users?|learners?|students?|members?)'?s?\s+(accounts?|passwords?|scores?|data|emails?|info|details|records)\b"
    r"|\badmin\s+(password|credentials|account|login)\b",
    re.IGNORECASE,
)
# Drugs and other illegal or dangerous activities.
_ILLEGAL = re.compile(
    r"\b(how\s+(to|do\s+i)|where\s+(to|can\s+i))\s+(\w+\s+){0,2}?(buy|make|cook|sell|get)\s+(\w+\s+){0,1}?"
    r"(drugs?|meth|shabu|cocaine|weed|marijuana|heroin|ecstasy|lsd|fake\s+id)\b|\bshabu\b",
    re.IGNORECASE,
)
# Slurs and hate aimed at a group.
_HATE = re.compile(
    r"\b(n[i1]gg(a|er)s?|f[a@]gg?ots?|retards?|tr[a@]nn(y|ies)|chinks?|bakla\s+ka|"
    r"(all|those)\s+\w+\s+(should\s+die|are\s+animals|are\s+subhuman))\b",
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

# ---- Gibberish ----------------------------------------------------------------------------
# A keyboard mash ("FSADFSDAF", "asdasd", "jfjfjf") is answered with a fixed nudge and never
# reaches a model, which would otherwise politely "respond" to it. Two signals:
# * a word LOOKS mashed: no vowel, one letter repeated, a straight key run, every letter on
#   one keyboard row, a repeated chunk, or almost no vowels in a long word;
# * no word is RECOGNISED: common English/Tagalog function words, plus (for the Dialogue)
#   the lesson's and the question's own vocabulary.
# Recognised words are never counted as mashed, so "flask", "type" or "PDCA" stay fine.

_KEY_ROWS = ("qwertyuiop", "asdfghjkl", "zxcvbnm")
_KEY_POS = {key: (row, col) for row, keys in enumerate(_KEY_ROWS) for col, key in enumerate(keys)}
_COMMON = frozenset("""
a an the and or but if so as at by for from in into of on to up with without about over under
is are was were be been being am do does did done have has had having can could will would shall
should may might must not no yes yeah yep ok okay hi hello hey thanks thank you please sorry
i me my mine we us our you your he him his she her they them their it its this that these those
there here what which who whom whose why how when where because since then than also just only
very more most less least much many some any all each every both other another such same own
like make makes made use uses used get gets got go goes went see seen know think mean means
help need needs want work works way thing things one two three first next last new good bad
right wrong true false example basically eg ie vs etc process system data people
ang ng sa na ay mga ko mo ito iyan yan yung kasi para pag kung hindi oo opo siya sila kami tayo
ako ikaw ka lang din rin po naman talaga parang dahil pero tapos nga ba
""".split())
_MASH_HINT = "Please write it in real words, in a full sentence about the lesson."


def _key_run(word: str) -> bool:
    pos = [_KEY_POS.get(ch) for ch in word]
    if len(word) < 3 or None in pos or len({row for row, _ in pos}) != 1:
        return False
    return {b[1] - a[1] for a, b in zip(pos, pos[1:])} in ({1}, {-1})


def looks_mashed(word: str) -> bool:
    """True when one word looks like keys hit at random rather than a word."""
    w = word.lower()
    if not w.isalpha():
        return False
    if word.isupper() and len(word) <= 5 and len(set(w)) > 1 and not _key_run(w):
        return False  # an acronym: BCP, CIO, PDCA, SLA
    vowels = sum(ch in "aeiouy" for ch in w)
    if vowels == 0 or len(set(w)) == 1 or _key_run(w):
        return True
    if (len(w) >= 5 and len(set(w)) / len(w) <= 0.7
            and len({_KEY_POS[ch][0] for ch in w if ch in _KEY_POS}) == 1):
        return True  # fsadfsdaf, qwerqwer, hjklhjkl
    if len(w) >= 4 and re.fullmatch(r"(.{1,3})\1+.?", w):
        return True  # asdasd, lololo, jfjfjf
    if len(w) >= 6 and vowels / len(w) < 0.2:
        return True
    return False


def _vocab(text: str) -> set[str]:
    return {w.lower() for w in re.findall(r"[A-Za-z]{2,}", text or "")}


def is_gibberish(text: str, vocabulary: str = "") -> bool:
    """True when a message is a keyboard mash rather than words.

    ``vocabulary`` is extra text whose words count as recognised (the lesson material
    and the question being answered), so a lesson term never trips the check."""
    words = re.findall(r"[A-Za-z]{2,}", text or "")
    if not words:
        return bool((text or "").strip()) and not re.search(r"\d", text)  # only symbols
    known = _COMMON | _vocab(vocabulary)
    recognised = [w for w in words if w.lower() in known]
    mashed = [w for w in words if w.lower() not in known and looks_mashed(w)]
    if len(mashed) * 2 >= len(words):
        return True  # half or more of the words are mashes: "sdfd hello", "asdf qwer"
    # Three or more words and not one of them is a real, recognised word.
    return len(words) >= 3 and not recognised and bool(mashed)


# Safety replies are one shared card in every tutor surface (chat, streamed chat, Dialogue).
# The reply starts with this marker; the frontend renders the card for the kind and hides the
# marker. The text after it is a plain fallback for any client that does not render cards.
# Saved history keeps the marker, so a reloaded conversation shows the same card.
SAFETY_KINDS = ("self_harm", "abuse", "threat", "data_probe")


def safety_marker(kind: str) -> str:
    return f"[[rebyu-safety:{kind}]]"


SELF_HARM_REPLY = safety_marker("self_harm") + (
    "I'm really sorry you're feeling this way, and I'm glad you said something. Please talk to someone "
    "you trust right now. In the Philippines you can call the NCMH Crisis Hotline at 1553 (free, 24/7). "
    "If you are in danger right now, call 911."
)
ABUSE_REPLY = safety_marker("abuse") + (
    "I'm sorry that happened to you -- it is not your fault. Please tell an adult you trust. If you are "
    "under 18 you can call Bantay Bata 163. If you're in danger right now, call 911."
)
THREAT_REPLY = safety_marker("threat") + (
    "That sounds like a threat to hurt someone, and it has to be taken seriously. If anyone is in danger "
    "right now, call 911. Please talk to a trusted adult or your guidance counselor today."
)
DATA_PROBE_REPLY = safety_marker("data_probe") + (
    "I can't look up or share anyone's accounts, passwords or personal information."
)

REDIRECTS = {
    "self_harm": SELF_HARM_REPLY,
    "abuse": ABUSE_REPLY,
    "threat": THREAT_REPLY,
    "data_probe": DATA_PROBE_REPLY,
    "sexual": "That's not something I can talk about here. Let's keep it appropriate and focus on the lesson.",
    "violence": "I can't help with anything that could hurt someone. Let's get back to the lesson.",
    "illegal": "I can't help with that, but I'm happy to help you with the lesson.",
    "hate": "Let's keep it respectful to everyone so we can focus on the lesson.",
    "gibberish": "I couldn't make that out. " + _MASH_HINT,
    "vulgar":"Let's keep it respectful so we can focus on the lesson.",
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


def check_learner_message(text: str, vocabulary: str = "") -> LearnerCheck:
    """Screens what a learner typed. Blocking work (models) -- call off the event loop."""
    message = (text or "").strip()
    if not ENABLED or not message:
        return LearnerCheck(False, None, message)

    # Someone who may be at risk is answered first, with care, before any other rule.
    if _SELF_HARM.search(message):
        return LearnerCheck(True, "self_harm", message)
    if _ABUSE_DISCLOSURE.search(message):
        return LearnerCheck(True, "abuse", message)
    # Possible real-world harm and probing for other people's data come before every
    # lesser rule, so they are never mistaken for plain rudeness or an off-topic question.
    if _THREAT.search(message):
        return LearnerCheck(True, "threat", message)
    if _DATA_PROBE.search(message):
        return LearnerCheck(True, "data_probe", message)
    for reason, pattern in (("sexual", _SEXUAL), ("violence", _VIOLENCE), ("hate", _HATE),
                            ("illegal", _ILLEGAL)):
        if pattern.search(message):
            return LearnerCheck(True, reason, message)
    if is_gibberish(message, vocabulary):
        return LearnerCheck(True, "gibberish", message)

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


# Reasons that earn the learner a conduct strike (warning, final warning, then a 7-hour
# lock of every AI tutor feature -- enforced by the Java gateway). Gibberish and swearing
# are only redirected; self-harm and abuse disclosures are people asking for help and
# must NEVER be punished.
SEVERE_REASONS = ("threat", "data_probe", "unsafe", "injection", "violence", "sexual", "hate", "illegal")


def severe_reason(text: str) -> str | None:
    """The strike-worthy reason a message is blocked for, or None. Patterns only (fast,
    deterministic): a strike must never rest on a statistical model's guess."""
    message = (text or "").strip()
    if not ENABLED or not message:
        return None
    if _SELF_HARM.search(message) or _ABUSE_DISCLOSURE.search(message):
        return None
    for reason, pattern in (("threat", _THREAT), ("data_probe", _DATA_PROBE),
                            ("violence", _VIOLENCE), ("sexual", _SEXUAL), ("hate", _HATE),
                            ("illegal", _ILLEGAL), ("unsafe", _UNSAFE), ("injection", _INJECTION)):
        if pattern.search(message):
            return reason
    return None


def safety_alert(text: str) -> str | None:
    """The kind of staff alert a learner message must raise, or None: someone may be at risk
    (self_harm, abuse), may put others at risk (threat), or is probing for other people's data
    (data_probe). Independent of strikes -- a learner asking for help is alerted, never punished."""
    message = (text or "").strip()
    if not ENABLED or not message:
        return None
    if _SELF_HARM.search(message):
        return "self_harm"
    if _ABUSE_DISCLOSURE.search(message):
        return "abuse"
    if _THREAT.search(message):
        return "threat"
    if _DATA_PROBE.search(message):
        return "data_probe"
    return None


def check_tutor_reply(text: str) -> str:
    """The tutor's reply if it is safe to show, else a neutral fallback."""
    reply = text or ""
    if not ENABLED or not reply.strip():
        return reply
    if any(pattern.search(reply) for pattern in (_SEXUAL, _VIOLENCE, _HATE, _ILLEGAL)):
        logger.warning("Tutor reply withheld: unsafe content")
        return SAFE_REPLY
    if scan_sensitive(reply) or _LEAK.search(reply):
        logger.warning("Tutor reply withheld: sensitive data or injected instructions")
        return SAFE_REPLY
    if _fails("toxic", reply):
        logger.warning("Tutor reply withheld: toxic wording")
        return SAFE_REPLY
    return reply
