"""Technology Element -> Human Interface, both lessons.

Syllabus minor categories 1 (human interface technology) and 2 (interface
design).

The examination treats usability as a measurable requirement rather than a
matter of taste, which is the framing this lesson keeps: every principle here
is stated so that a design can be judged against it, and accessibility is
presented as a functional requirement because that is how the paper asks
about it.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Technology Element"
MIDDLE = "Human Interface"

# ==========================================================================
# Lesson 1: Human interface technology
# ==========================================================================

_hit_sections = [
    ("Why This Is an Engineering Topic", [
        desc(
            "A system that is technically correct and that people cannot use "
            "has not met its requirement. The examination takes that position "
            "seriously, and it is why interface design appears in a technical "
            "certification rather than being left to designers."
        ),
        desc(
            "The consequences are measurable in exactly the terms the rest of "
            "the syllabus uses. A confusing form produces data entry errors, "
            "which become data quality problems, which become wrong reports. "
            "An unclear confirmation produces duplicate transactions. A slow "
            "interface produces workarounds -- staff keeping their own "
            "spreadsheets, which then become an unmanaged system nobody "
            "backs up."
        ),
        table(
            ["Interface failure", "The operational consequence"],
            [["No feedback on an action",
              "The user repeats it, creating duplicates"],
             ["Destructive control beside a common one",
              "Accidental deletion, blamed on the user"],
             ["Unclear error messages",
              "Support calls, and users guessing"],
             ["Too many steps for a frequent task",
              "Workarounds outside the system"],
             ["Inconsistent behaviour between screens",
              "Every screen must be learned separately"]],
            caption="Five interface faults and what each actually costs.",
            footer="Every row has a cost that appears somewhere other than "
                   "the interface budget, which is why these faults survive "
                   "so long."),
    ]),

    ("Usability Defined", [
        desc(
            "Usability has a standard definition -- the extent to which a "
            "product lets specified users achieve specified goals with "
            "effectiveness, efficiency and satisfaction in a specified "
            "context of use. The repeated word 'specified' is doing real "
            "work: usability is not a property of a product alone, but of a "
            "product with particular users doing a particular thing."
        ),
        image(fig("usability-model")),
        table(
            ["Component", "The question it asks", "How it is measured"],
            [["Learnability", "How quickly can a new user become "
                              "productive?",
              "Time to first successful task"],
             ["Efficiency", "How fast once learned?",
              "Time or keystrokes per task"],
             ["Memorability", "Is it still usable after a month away?",
              "Time to re-establish proficiency"],
             ["Error tolerance", "How often do users err, and can they "
                                 "recover?",
              "Error rate, and recovery time"],
             ["Satisfaction", "Is it acceptable to use?",
              "Survey scores, and continued use"]],
            caption="Five components, each with a measurement.",
            footer="Because each is measurable, usability can be stated as a "
                   "requirement -- 'a new operator completes a booking within "
                   "five minutes without assistance' -- and tested like any "
                   "other."),
        desc(
            "The components conflict, which is what makes this a design "
            "activity rather than a checklist. Maximising learnability tends "
            "to mean showing everything and confirming often, which is "
            "exactly what reduces efficiency for an expert doing the task "
            "for the thousandth time -- so the question is always which "
            "users, doing what, how often."
        ),
    ]),

    ("Interaction Styles", [
        desc(
            "How a person tells a system what to do has a small number of "
            "recognised forms, and the examination asks which suits a "
            "described situation."
        ),
        image(fig("interaction-styles")),
        content_accordion(
            "THE STYLES THE SYLLABUS NAMES",
            "Each is best for someone; none is best for everyone.",
            [("Command language",
              "The user types instructions. Precise, composable and "
              "scriptable, so a task can be repeated exactly or automated. "
              "Nothing is discoverable -- the user must already know what to "
              "type -- which makes it excellent for experts and impenetrable "
              "for everyone else."),
             ("Menu selection",
              "The user chooses from presented options. Nothing to remember "
              "and nothing to mistype, so it suits occasional users. Becomes "
              "slow when the option list grows, which is why deep menu "
              "hierarchies are frustrating to anyone who knows where they are "
              "going."),
             ("Form filling",
              "Structured data entry with labelled fields. Right for entering "
              "records, and its quality depends almost entirely on the "
              "details -- sensible defaults, validation at the point of "
              "entry, and a logical tab order that matches the source "
              "document."),
             ("Direct manipulation",
              "The user acts on visible objects and sees the effect "
              "immediately -- dragging, resizing, selecting. Highly "
              "discoverable and intuitive; poor for repetitive bulk work, "
              "where doing something to a thousand items one at a time is "
              "not viable."),
             ("Natural language and voice",
              "The user expresses intent in ordinary language. Requires no "
              "learning at all and is inherently ambiguous, so it suits "
              "simple requests and struggles with precision.")]),
        desc(
            "The mature answer is usually to provide more than one. A "
            "discoverable interface for learning and occasional use, plus a "
            "command, keyboard or scripting path for the expert, serves both "
            "populations -- and every serious professional tool has arrived "
            "at exactly that arrangement."
        ),
    ]),

    ("Design Principles", [
        desc(
            "A set of principles recurs across every treatment of interface "
            "design, and the examination expects them by name and by "
            "application."
        ),
        table(
            ["Principle", "Means", "Violated by"],
            [["Consistency", "The same thing behaves the same way "
                             "everywhere",
              "A button that saves on one screen and submits on another"],
             ["Visibility", "The available actions and current state are "
                            "apparent",
              "A function reachable only by a gesture nobody mentions"],
             ["Feedback", "Every action produces a perceptible response",
              "A press with no acknowledgement"],
             ["Affordance", "How something looks suggests how to use it",
              "Text styled to look like a button that is not one"],
             ["Constraint", "Invalid actions are prevented rather than "
                            "punished",
              "Allowing a date of birth in the future, then rejecting the "
              "form"],
             ["Reversibility", "Mistakes can be undone",
              "Immediate irreversible deletion with no confirmation"],
             ["Error prevention", "The design makes errors unlikely",
              "Two adjacent buttons with opposite effects"]],
            caption="Seven principles, each with the failure it names.",
            footer="Read the right-hand column first when judging a design. "
                   "The principles are easier to apply as a list of things to "
                   "look for than as abstractions."),
        image(fig("feedback-loop-ui")),
        desc(
            "FEEDBACK deserves particular emphasis because its absence is the "
            "single commonest fault and the one with the most direct "
            "operational cost. A control that does not acknowledge being "
            "used gets used again, which is precisely how duplicate orders, "
            "double payments and repeated submissions are created -- and the "
            "resulting data problem is invariably attributed to the user."
        ),
    ]),

    ("Mental Models and Metaphor", [
        desc(
            "A user forms a mental model of how a system works and predicts "
            "its behaviour from that model. Where the model and the system "
            "agree, the system feels obvious; where they diverge, it feels "
            "arbitrary and its behaviour has to be memorised."
        ),
        compare_grid(
            "WHERE MENTAL MODELS COME FROM",
            "The designer does not control whether users form a model, only "
            "whether the system rewards the one they form.",
            [("Metaphor",
              "Borrowing a familiar structure -- files in folders, a "
              "shopping basket, a desktop. Powerful because it arrives "
              "already understood, and it misleads wherever the metaphor "
              "breaks down."),
             ("Convention",
              "What similar systems do. A user's expectations come mostly "
              "from other software, which is why departing from a convention "
              "costs more than the improvement usually earns."),
             ("The system's own consistency",
              "Once a user learns one part, they predict the rest. This is "
              "why consistency matters more than any individual screen being "
              "optimal.")]),
        desc(
            "The examination's angle on this is that a design should be "
            "judged against the user's model rather than the implementer's. A "
            "structure that mirrors the database schema is obvious to the "
            "person who built it and arbitrary to everyone else -- which is "
            "the most common way an internally sensible interface becomes "
            "unusable."
        ),
    ]),

    ("Response Time and What Users Notice", [
        desc(
            "Speed is a usability property, and the thresholds at which "
            "people notice a delay are well established and worth knowing "
            "because they determine what an interface must do."
        ),
        table(
            ["Delay", "How it is experienced", "What the interface must do"],
            [["Under 0.1 second", "Instantaneous; the system feels direct",
              "Nothing -- the response is the feedback"],
             ["Up to 1 second", "Noticeable, and thought is uninterrupted",
              "Nothing, though the pause is felt"],
             ["Up to 10 seconds", "Attention wanders; the user waits",
              "Show that work is in progress"],
             ["Over 10 seconds", "The user turns to something else",
              "Show progress and expected duration, and allow the user to "
              "continue elsewhere"]],
            caption="Four bands, each with a different design obligation.",
            footer="These thresholds are about human perception rather than "
                   "technology, so they have not changed as machines got "
                   "faster -- which is why they remain a design constraint."),
        desc(
            "The practical consequence is that PERCEIVED responsiveness can "
            "be improved without making anything faster. Acknowledging an "
            "action immediately, showing partial results as they arrive, and "
            "letting the user continue while work completes in the background "
            "all change the experience without touching the underlying time "
            "-- which is often the only available option when the delay is a "
            "network round trip or a slow external system."
        ),
        desc(
            "CONSISTENCY of response time matters too, and is often "
            "underrated. An operation that usually takes half a second and "
            "occasionally takes eight is more disruptive than one reliably "
            "taking two, because the user cannot form an expectation and must "
            "watch for completion rather than proceeding confidently."
        ),
    ]),

    ("Designing for Error", [
        desc(
            "People make mistakes, and an interface that treats every error "
            "as user failure has misunderstood its job. The syllabus expects "
            "the distinction between the kinds of error, because they need "
            "different remedies."
        ),
        compare_grid(
            "TWO KINDS OF HUMAN ERROR",
            "The distinction comes from human factors research and it "
            "determines what design can do about each.",
            [("A slip",
              "The intention was right and the execution was wrong -- "
              "clicking the adjacent button, typing a transposed digit, "
              "selecting the wrong row. Addressed by DESIGN: separate "
              "destructive controls, confirm irreversible actions, make undo "
              "available."),
             ("A mistake",
              "The intention itself was wrong, because the user "
              "misunderstood the system or the situation. Addressed by "
              "CLARITY: better labels, visible state, and feedback that "
              "reveals the misunderstanding early rather than after the "
              "consequences.")]),
        desc(
            "The design responses genuinely differ, which is why the "
            "distinction is worth making. No amount of confirmation prevents "
            "a mistake -- the user confirms confidently, because they believe "
            "they are doing the right thing -- and no amount of explanation "
            "prevents a slip, because the user already knew what they "
            "intended."
        ),
        desc(
            "This is also where CONFIRMATION DIALOGUES earn their poor "
            "reputation. A confirmation shown for every action is dismissed "
            "reflexively within a day, so it protects nothing while slowing "
            "everything. Reserve them for genuinely irreversible actions, and "
            "prefer UNDO wherever it is possible, since undo costs the user "
            "nothing when they were right."
        ),
    ]),

    ("Multi-Device and Responsive Interfaces", [
        desc(
            "The same system is now reached from screens of very different "
            "sizes and with very different input methods, and the syllabus "
            "expects the implications."
        ),
        ul([
            "SCREEN SIZE changes what fits, so a layout must reflow rather "
            "than shrink -- text scaled down until it is unreadable is not a "
            "mobile design.",
            "INPUT METHOD changes what is possible. A finger is far less "
            "precise than a pointer, so touch targets must be larger, and "
            "hover -- which many desktop interfaces rely on to reveal "
            "information -- does not exist on touch at all.",
            "CONTEXT changes what matters. Someone using a phone is often "
            "standing, interrupted and in a hurry, so the mobile case is "
            "usually a subset of tasks done more urgently rather than the "
            "same tasks on a smaller screen.",
            "CONNECTIVITY changes what can be assumed. A mobile connection "
            "drops, so an interface that loses entered data when a request "
            "fails is unusable in exactly the circumstances it is most "
            "needed.",
        ]),
        desc(
            "The examination's framing is usually that designing for the "
            "smallest and most constrained case first produces a better "
            "result than adapting a desktop design downward -- because the "
            "constraint forces a decision about what actually matters, and "
            "that decision improves the larger version too."
        ),
    ]),

    ("Internationalisation", [
        desc(
            "An interface used in more than one language or region has "
            "requirements that are far easier to build in than to retrofit, "
            "and the syllabus separates two terms that are often confused."
        ),
        compare_grid(
            "INTERNATIONALISATION AND LOCALISATION",
            "One is done once by developers; the other is done per market and "
            "repeatedly.",
            [("Internationalisation (i18n)",
              "Designing so the system CAN be adapted: text held separately "
              "from code, layouts that tolerate longer strings, no assumption "
              "that dates, numbers, names or addresses take one form. Done "
              "once, and expensive to add later."),
             ("Localisation (l10n)",
              "Actually adapting for a locale: translating text, formatting "
              "dates and currency, adjusting images and examples. Done per "
              "market, repeatedly, and cheap only if the first was done.")]),
        desc(
            "The assumptions that cause the most trouble are the ones nobody "
            "notices making. Text expands substantially in translation, so a "
            "layout fitted exactly to English breaks; names do not divide "
            "reliably into first and last; addresses have wildly different "
            "shapes; and sorting order depends on the language rather than on "
            "the character codes."
        ),
        desc(
            "This connects directly to the character encoding of the Theory "
            "of Information lesson. Supporting multiple scripts requires "
            "Unicode throughout, and a system that assumed one byte per "
            "character somewhere in its history will fail on the first name "
            "that does not fit -- usually in a way that corrupts stored data "
            "rather than reporting an error."
        ),
    ]),

    ("Menus, Icons and Labels", [
        desc(
            "The smallest elements of an interface carry a disproportionate "
            "share of its clarity, and the examination asks about them "
            "directly."
        ),
        ul([
            "A LABEL should use the user's vocabulary rather than the "
            "system's. Internal terminology forces every user to maintain a "
            "translation, and it never appears as a defect report because "
            "nobody reports being mildly confused.",
            "An ICON is ambiguous unless it depicts something with an "
            "established convention. A floppy disk means save because "
            "everyone learned it, not because it resembles saving -- so a "
            "novel icon needs a label rather than a tooltip.",
            "A MENU should group by task rather than by the module that "
            "implements the function, and the grouping should survive the "
            "organisational reshuffle that renames the modules.",
            "A BUTTON should say what it does -- 'Delete order' rather than "
            "'OK' -- because a user confirming a dialogue reads the button "
            "and not always the sentence above it.",
        ]),
        desc(
            "That last point is worth stating as a rule, because it is both "
            "simple and widely ignored. A dialogue offering OK and Cancel "
            "requires the user to have read and retained the question; one "
            "offering 'Delete order' and 'Keep order' does not, and the "
            "difference shows up directly in how often the wrong choice is "
            "made."
        ),
    ]),

    ("Standards and Guidelines", [
        desc(
            "Interface quality is not left entirely to judgement. Published "
            "standards and platform guidelines codify a great deal of it, and "
            "the examination expects awareness that they exist."
        ),
        table(
            ["Source", "Covers", "Status"],
            [["ISO 9241", "Ergonomics of human-system interaction",
              "International standard, and the source of the usability "
              "definition"],
             ["WCAG", "Web content accessibility",
              "The reference most accessibility law points at"],
             ["Platform guidelines", "Conventions for a specific operating "
                                     "system or device",
              "Not binding, and departing from them surprises users"],
             ["Organisational design system", "Components and patterns for "
                                              "one organisation",
              "Internal, and what actually gets used day to day"]],
            caption="Four sources of interface guidance, in decreasing "
                    "formality.",
            footer="The last row matters most in practice. A design system "
                   "supplies reviewed components, so consistency is achieved "
                   "by reuse rather than by everyone remembering the same "
                   "rules."),
        desc(
            "A DESIGN SYSTEM is worth understanding as an engineering answer "
            "rather than a documentation one. Publishing a rule requires "
            "every designer and developer to know and apply it; publishing a "
            "COMPONENT that already embodies the rule means the correct "
            "behaviour is the default and the incorrect one takes deliberate "
            "effort -- which is the same argument the Programming lesson made "
            "for structural protection over conventional protection."
        ),
    ]),

    ("Who the Users Actually Are", [
        desc(
            "Every judgement in this lesson depends on knowing who will use "
            "the system, and that knowledge is gathered rather than assumed. "
            "The syllabus names the techniques."
        ),
        content_accordion(
            "FINDING OUT ABOUT USERS",
            "Each answers a different question, and the common failure is "
            "using the cheapest one for every question.",
            [("Observation",
              "Watching people do the work as it is currently done. Reveals "
              "what actually happens, including the workarounds nobody would "
              "mention -- and those workarounds are usually the most valuable "
              "requirement in the room."),
             ("Interviews",
              "Asking users about their work. Good for understanding goals "
              "and constraints, and unreliable for what people actually do, "
              "since everyone describes the intended process rather than the "
              "real one."),
             ("Personas",
              "Composite descriptions of representative users, used so that "
              "design arguments refer to somebody specific rather than to "
              "'the user' -- who is otherwise whoever the speaker finds "
              "convenient."),
             ("Task analysis",
              "Breaking down what must be accomplished into steps and "
              "decisions, which is what reveals how many interface actions a "
              "single real task actually requires."),
             ("Analytics",
              "Measuring what people do in an existing system. Precise about "
              "behaviour and silent about intention, so it identifies where "
              "the problem is and not what it is.")]),
        desc(
            "The recurring examination point is that DESIGNERS ARE NOT THE "
            "USERS. Someone who built a system cannot experience it as "
            "unfamiliar, and someone who understands the domain cannot "
            "imagine not understanding it -- so intuition about clarity is "
            "systematically unreliable in exactly the direction that matters."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where human interface items are lost."),
        ul([
            "Treating usability as subjective. Its components are measurable "
            "and can be stated as requirements.",
            "Assuming one interaction style suits all users. Experts and "
            "occasional users want opposite things.",
            "Judging a design by whether it looks clean rather than whether "
            "the tasks succeed.",
            "Omitting feedback, which causes repeated actions and duplicate "
            "data.",
            "Modelling the interface on the database structure rather than "
            "on the user's task.",
            "Departing from convention for a small improvement, which costs "
            "more in relearning than it gains.",
            "Treating error prevention and error messages as alternatives. "
            "Preventing is better, and both are needed.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"An order entry system shows a Submit button. After a click, "
            "nothing visible happens for several seconds while the order is "
            "processed. Users report duplicate orders. What is the interface "
            "fault and what is the fix?\""
        ),
        ol([
            "Identify the symptom: users act more than once, so they were not "
            "told their first action registered.",
            "Name the principle violated: FEEDBACK. The action produced no "
            "perceptible response within the time a user waits before "
            "concluding nothing happened.",
            "The fix at the interface: acknowledge the click immediately -- "
            "disable the button, show a progress indicator, change its label "
            "-- so the state is visible while processing continues.",
            "The fix behind it: make the operation IDEMPOTENT, so a duplicate "
            "submission is recognised and ignored rather than creating a "
            "second order.",
            "Both are needed. The interface change prevents most duplicates; "
            "the idempotency handles the rest, including a genuine network "
            "retry the user never initiated.",
        ]),
        desc(
            "Step five is what distinguishes a complete answer. An interface "
            "fix reduces the incidence and cannot eliminate it, because a "
            "browser refresh or a network retry can resubmit without any user "
            "action -- so the durable answer is at both layers, which is why "
            "the examination poses this as a system question rather than a "
            "cosmetic one."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Interface quality reaches further than it appears to."),
        ul([
            "Usability requirements are stated in Software Requirements "
            "Definition and tested in Acceptance Support.",
            "Data entry errors become the data quality problems of Database "
            "and of Business Analysis.",
            "Workarounds outside the system are the shadow IT of System "
            "Utilisation Promotion.",
            "Idempotency comes from the Network and Middleware lessons.",
            "Accessibility is a legal requirement in several jurisdictions, "
            "treated in Other Laws and Guidelines.",
            "Error prevention is the fool-proof design of Measurement and "
            "Control.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five results this lesson expects immediately.",
            [("The five components of usability",
              "Learnability, efficiency, memorability, error tolerance, "
              "satisfaction",
              "Each is measurable, which is what makes usability a "
              "requirement rather than an opinion."),
             ("The commonest interface fault",
              "Missing feedback",
              "An unacknowledged action is repeated, which is how duplicate "
              "orders and double payments are created."),
             ("Affordance",
              "How something looks suggests how to use it",
              "Violated by text styled as a button that is not one, and by a "
              "button that looks inert."),
             ("Command language against direct manipulation",
              "Precise and scriptable against discoverable and immediate",
              "Experts want the first for repetition; occasional users need "
              "the second. Serious tools provide both."),
             ("Why departing from convention is costly",
              "Expectations come from other software",
              "A small improvement rarely repays the relearning it forces on "
              "every user.")]),
    ]),
]

_hit_quiz = [
    mcq("AVERAGE",
        "Users of an order system report submitting duplicate orders. "
        "Investigation shows the Submit button gives no visible response "
        "during several seconds of processing.\n\n"
        "Which design principle has been violated?",
        [("Consistency", False),
         ("Feedback", True),
         ("Affordance", False),
         ("Reversibility", False)],
        "Feedback requires every action to produce a perceptible response. "
        "With none, a user concludes the click did not register and clicks "
        "again -- which is precisely how duplicates arise, and the resulting "
        "data problem is invariably blamed on the user. Affordance concerns "
        "whether something looks usable, consistency concerns behaving the "
        "same way across screens, and reversibility concerns undoing a "
        "completed action."),

    mcq("EASY",
        "Which set correctly names components of usability as the standard "
        "definition treats them?",
        [("Learnability, efficiency, memorability, error tolerance, "
          "satisfaction", True),
         ("Speed, capacity, reliability, availability and total cost of "
          "ownership", False),
         ("Colour, layout, typography, spacing, imagery", False),
         ("Requirements, design, build, test, deploy", False)],
        "These five are the components the definition is built from, and each "
        "is measurable -- time to first successful task, keystrokes per task, "
        "error rate, and so on -- which is exactly what allows usability to "
        "be written as a testable requirement rather than argued about. The "
        "second set describes system performance, the third visual design, "
        "and the fourth a development lifecycle."),

    mcq("AVERAGE",
        "An interface is being designed for warehouse staff who will perform "
        "the same three operations several hundred times a day.\n\n"
        "Which characteristic matters most?",
        [("Learnability, so new staff can begin immediately", False),
         ("Efficiency, so each repetition costs as little as possible", True),
         ("Satisfaction, so that staff find the interface pleasant to "
          "look at all day", False),
         ("Memorability, so the interface survives long absences", False)],
        "With a small number of operations repeated hundreds of times daily, "
        "the staff will be expert within a day and will then spend years at "
        "that level -- so seconds saved per repetition compound enormously "
        "while learnability is paid for once. This is why usability targets "
        "must name the users and the frequency: the same interface judged for "
        "occasional public use would give the opposite answer."),

    mcq("HARD",
        "A design team proposes an interface whose navigation mirrors the "
        "underlying database table structure.\n\n"
        "What is the principal objection?",
        [("Database structures change far more often than the interfaces "
          "built over them", False),
         ("It reflects the implementer's model rather than the user's task",
          True),
         ("Exposing table names creates a security vulnerability", False),
         ("Normalised structures cannot be represented visually", False)],
        "A schema is organised for storage integrity, not around the sequence "
        "of steps a person performs -- so a navigation mirroring it is "
        "obvious to whoever built it and arbitrary to everyone else, who must "
        "then memorise it rather than predict it. This is the most common way "
        "an internally sensible interface becomes unusable, and the remedy is "
        "to organise around the user's task."),

    mcq("AVERAGE",
        "Which interaction style is most discoverable for an occasional user "
        "but least suitable for performing the same operation on a thousand "
        "records?",
        [("Command language entry", False),
         ("Direct manipulation", True),
         ("Form and menu selection", False),
         ("Batch scripting", False)],
        "Direct manipulation shows the objects and responds immediately, so a "
        "new user learns it by exploring -- and it requires an action per "
        "object, which does not scale to a thousand of them. A command "
        "language reverses both properties: nothing is discoverable, and one "
        "instruction can address every record at once. Providing both is the "
        "arrangement every serious professional tool arrives at."),

    mcq("AVERAGE",
        "A form permits a date of birth in the future and rejects the whole "
        "submission afterwards with an error.\n\n"
        "Which principle would have avoided this?",
        [("Constraint, by preventing the invalid entry at the point of "
          "input", True),
         ("Consistency, by using the same date format throughout", False),
         ("Memorability, by making the field easier to recall", False),
         ("Reversibility, by allowing the completed submission to be "
          "undone afterwards", False)],
        "A constraint prevents an invalid action rather than punishing it "
        "afterwards -- here, a date picker that cannot select a future date, "
        "or validation at the field as it is entered. Rejecting the whole "
        "form after the fact makes the user find the problem among everything "
        "they typed, which is the difference between error PREVENTION and "
        "error reporting."),

    mcq("HARD",
        "After fixing the missing feedback on a Submit button, duplicate "
        "orders still occur occasionally.\n\n"
        "What further measure is required?",
        [("Increasing the server's processing speed so that the visible "
          "delay disappears", False),
         ("Making the submission idempotent so repeats create no second "
          "order", True),
         ("Adding a confirmation dialogue before every submission", False),
         ("Logging each submission so duplicates can be found later", False)],
        "An interface change reduces user-initiated repeats and cannot "
        "eliminate duplicates, because a browser refresh, a network retry or "
        "a proxy can resubmit with no user action at all. Making the "
        "operation idempotent -- recognising a repeat of the same submission "
        "and ignoring it -- addresses every case. Faster processing narrows "
        "the window without closing it, and logging detects the problem "
        "rather than preventing it."),

    mcq("EASY",
        "Text is styled to look exactly like the system's clickable buttons "
        "but does nothing when pressed.\n\n"
        "Which principle does this violate?",
        [("Feedback", False),
         ("Affordance", True),
         ("Constraint", False),
         ("Efficiency", False)],
        "Affordance is the property that an object's appearance suggests how "
        "it can be used. Something that looks like a button invites a press, "
        "so styling inert text that way misleads the user into an action that "
        "cannot succeed. Feedback concerns the response AFTER a genuine "
        "action, and constraint concerns preventing invalid ones."),

    mcq("AVERAGE",
        "A team proposes replacing a widely recognised interface convention "
        "with an arrangement they consider modestly better.\n\n"
        "What is the main argument against?",
        [("Conventions are protected by design copyright", False),
         ("The relearning cost across all users usually exceeds the gain",
          True),
         ("Non-standard interfaces cannot be automated or tested "
          "reliably at all", False),
         ("Modern frameworks do not support custom arrangements", False)],
        "Users' expectations are formed overwhelmingly by other software, so "
        "a departure means every user must notice, learn and remember the "
        "difference -- a cost paid by everyone, repeatedly, against a modest "
        "one-off improvement. The bar for departing from a convention is "
        "therefore high, and 'modestly better' does not usually clear it. "
        "Custom arrangements are perfectly testable and not a copyright "
        "matter."),

    mcq("HARD",
        "Staff at a company have begun maintaining their own spreadsheets "
        "alongside the official system, re-entering the same data.\n\n"
        "What does this most likely indicate?",
        [("Staff have not been adequately trained on the official system",
          False),
         ("The official system is too slow or awkward for a frequent task",
          True),
         ("The spreadsheets provide functionality the system was never "
          "specified to have", False),
         ("Data in the official system is known to be inaccurate", False)],
        "Duplicating effort is costly, so people do it when the sanctioned "
        "route is worse than the duplication -- typically because a frequent "
        "task takes too many steps or too long. The spreadsheets are a "
        "usability symptom, and they create a real second problem: an "
        "unmanaged store that nobody backs up, secures or audits. Training "
        "addresses not knowing how, which is a different diagnosis from "
        "knowing how and avoiding it."),
]

LESSON_HI_TECH = lesson(
    MAJOR, MIDDLE,
    "Human Interface Technology and Interaction Models",
    _hit_quiz,
    lesson_structure(
        "Human Interface Technology and Interaction Models",
        "A system that is technically correct and unusable has not met its "
        "requirement, and this lesson treats that as an engineering claim "
        "rather than a sentiment. It defines usability in the five measurable "
        "components that let it be written as a testable requirement, works "
        "through the interaction styles and who each one actually suits, sets "
        "out the design principles as a list of failures to look for, and "
        "explains why an interface organised around the implementer's model "
        "rather than the user's task is the most common way something "
        "internally sensible becomes unusable.",
        [
            "Explain why interface quality has measurable operational "
            "consequences",
            "Define usability by its five components and state each as a "
            "requirement",
            "Compare the interaction styles and match one to a described user "
            "and task",
            "Apply the design principles to identify a fault in a described "
            "interface",
            "Explain why missing feedback produces duplicate transactions",
            "Explain mental models, metaphor and the cost of departing from "
            "convention",
        ],
        55,
        _hit_sections,
        [
            ("Usability",
             "The extent to which specified users can achieve specified goals "
             "effectively, efficiently and with satisfaction in a specified "
             "context. A property of product, users and task together."),
            ("Learnability",
             "How quickly a new user becomes productive. Measured as time to "
             "first successful task."),
            ("Efficiency",
             "How fast a task is once learned. What matters most for staff "
             "repeating an operation hundreds of times a day."),
            ("Memorability",
             "Whether the system is still usable after a period away, which "
             "matters for occasional users."),
            ("Consistency",
             "The same element behaving the same way throughout, so that "
             "learning one part predicts the rest."),
            ("Visibility",
             "Available actions and current state being apparent rather than "
             "requiring prior knowledge."),
            ("Feedback",
             "Every action producing a perceptible response. Its absence is "
             "the commonest interface fault and the cause of duplicate "
             "transactions."),
            ("Affordance",
             "An object's appearance suggesting how it can be used. Violated "
             "by inert elements styled to look interactive."),
            ("Constraint",
             "Preventing an invalid action rather than rejecting it "
             "afterwards -- error prevention rather than error reporting."),
            ("Direct manipulation",
             "Acting on visible objects with immediate effect. Highly "
             "discoverable, and poor for bulk repetitive work."),
            ("Command language",
             "Typed instructions: precise, composable and scriptable, and "
             "entirely undiscoverable."),
            ("Mental model",
             "The user's internal account of how a system works, from which "
             "they predict its behaviour. A system that contradicts it must "
             "be memorised rather than reasoned about."),
        ],
        "Interface quality is an engineering concern because its failures "
        "have costs that appear elsewhere -- duplicate orders from missing "
        "feedback, data quality problems from confusing forms, and unmanaged "
        "spreadsheets from a system too awkward for a frequent task. "
        "Usability is defined by five measurable components -- learnability, "
        "efficiency, memorability, error tolerance and satisfaction -- which "
        "is what lets it be stated as a requirement and tested, and those "
        "components conflict, so the design question is always which users "
        "doing what, how often. The interaction styles each suit somebody: "
        "command languages are precise, scriptable and undiscoverable; direct "
        "manipulation is discoverable and hopeless for bulk work; forms and "
        "menus present the valid options and slow down as they grow -- and "
        "the mature answer is to offer more than one. The design principles "
        "are most usable as a list of faults to look for, with missing "
        "feedback the commonest and most expensive, since an unacknowledged "
        "action gets repeated. And a user predicts a system from the mental "
        "model they have formed, which comes from metaphor, from convention "
        "and from the system's own consistency -- so an interface organised "
        "around the database schema is obvious to its author and arbitrary to "
        "everyone else.",
        exam_notes=[
            desc(
                "Human interface items on Subject A describe a fault and ask "
                "for the principle, or describe users and ask which property "
                "matters."
            ),
            ul([
                "Naming the principle a described interface fault violates.",
                "Choosing the usability component that matters for a stated "
                "user population.",
                "Matching an interaction style to a described task.",
                "Explaining why missing feedback causes duplicate "
                "transactions.",
                "Recognising an interface organised around implementation "
                "rather than task.",
                "Interpreting workarounds as a usability symptom.",
            ]),
            desc(
                "Read for the USERS and the FREQUENCY in the stem. Almost "
                "every judgement item here turns on whether the people "
                "described are expert and repetitive or occasional and "
                "unfamiliar, and the correct answer reverses between them."
            ),
        ],
    ))

# ==========================================================================
# Lesson 2: Interface design
# ==========================================================================

_id_sections = [
    ("From Principles to a Screen", [
        desc(
            "The previous lesson established what to aim for. This one is "
            "about the decisions that produce an actual screen: how "
            "information is arranged, how input is collected, how errors are "
            "handled, and how the result is checked against real users."
        ),
        table(
            ["Decision", "Governed by"],
            [["What goes on this screen at all",
              "The task the user came to perform"],
             ["Where each element sits",
              "Reading order, grouping and visual hierarchy"],
             ["How input is collected",
              "The nature of the data and the errors it invites"],
             ["What happens when something is wrong",
              "Prevention first, then a message that helps"],
             ["Whether it worked",
              "Testing with representative users, not opinion"]],
            caption="Five decisions, in the order they are best made.",
            footer="The first row is the one skipped most often. A screen "
                   "that shows everything available rather than what this "
                   "task needs is the default outcome of not deciding."),
    ]),

    ("Screen Layout", [
        desc(
            "Arrangement carries meaning whether or not it is designed to. A "
            "reader takes grouping, size and position as statements about "
            "importance and relatedness, so an accidental arrangement makes "
            "accidental claims."
        ),
        image(fig("screen-zones")),
        ul([
            "GROUPING: elements that belong together are placed together and "
            "separated from what they do not belong with. Proximity is read "
            "as relatedness before any label is.",
            "VISUAL HIERARCHY: size, weight and position signal importance, "
            "so the most important thing should be the most prominent -- and "
            "if everything is emphasised, nothing is.",
            "ALIGNMENT: consistent edges let the eye scan without "
            "re-anchoring, which is why a ragged form is measurably slower to "
            "read than an aligned one.",
            "READING ORDER: the sequence in which elements are encountered "
            "should match the sequence of the task, which for most scripts "
            "means top to bottom and left to right.",
            "WHITE SPACE: separation is what makes grouping visible. A dense "
            "screen is not more informative; it is harder to extract anything "
            "from.",
        ]),
        desc(
            "The examination's usual framing is a described screen with a "
            "stated complaint -- users miss a field, or cannot find a "
            "function -- and the answer is nearly always grouping or "
            "hierarchy: the element is present and not where the eye goes, or "
            "it is emphasised no more than the things around it."
        ),
    ]),

    ("Designing Input", [
        desc(
            "Data entry is where most interface faults become data faults, so "
            "the details matter more here than anywhere else on a screen."
        ),
        content_accordion(
            "WHAT MAKES A FORM WORK",
            "Each of these prevents a class of error rather than reporting "
            "it.",
            [("Choose the right control",
              "A control that permits only valid values prevents invalid "
              "ones. A date picker, a dropdown of known values or a set of "
              "radio buttons removes a whole category of error that free text "
              "invites."),
             ("Validate at the point of entry",
              "Checking a field as it is completed lets the user fix it while "
              "they are still thinking about it. Validating only on "
              "submission makes them hunt through everything they typed."),
             ("Supply sensible defaults",
              "The most likely value, pre-filled, is both faster and less "
              "error-prone -- and a default that is wrong for this case is "
              "visible and correctable, which a blank field is not."),
             ("Match the source document",
              "Where data is copied from a paper form, the screen's field "
              "order should match it. A different order forces the user to "
              "search the source for every field, which is slow and "
              "produces transposition errors."),
             ("Make required fields obvious before submission",
              "Not after. Marking them in advance is prevention; reporting "
              "them afterwards is a rejection the user has to interpret.")]),
        desc(
            "One further point the syllabus raises: input validation at the "
            "interface is for the USER's benefit and is not a security "
            "control. It can be bypassed entirely by anything that is not the "
            "interface, so the same checks must be repeated on the server -- "
            "which the Security lessons treat at length."
        ),
    ]),

    ("Error Messages", [
        desc(
            "Prevention is better than a message, and messages are still "
            "needed. A good one answers three questions."
        ),
        image(fig("error-handling-order")),
        table(
            ["The message must say", "Bad example", "Better"],
            [["What went wrong", "Error 0x8007",
              "The account number was not found"],
             ["Why, in the user's terms", "Invalid input",
              "Account numbers are 8 digits; this one has 7"],
             ["What to do next", "Operation failed",
              "Check the number on the invoice and try again"]],
            caption="Three questions, and the difference between answering "
                    "them and not.",
            footer="A message that names a code and nothing else transfers "
                   "the work to the user or to a support desk. The system "
                   "knows what happened; the message is where it says so."),
        desc(
            "Two further rules the examination expects. A message should be "
            "phrased WITHOUT BLAME -- 'the date must be in the past' rather "
            "than 'you entered an invalid date' -- because blame adds nothing "
            "and discourages reporting. And it should be shown WHERE the "
            "problem is, beside the field, rather than only in a banner at "
            "the top that the user must map back onto their input."
        ),
        desc(
            "There is a security qualification worth noting, since the two "
            "goals genuinely conflict. A login failure must NOT say which of "
            "the username and password was wrong, because that tells an "
            "attacker which usernames exist. Helpfulness is the default and "
            "authentication is the documented exception."
        ),
    ]),

    ("Accessibility", [
        desc(
            "An interface usable only by people with typical vision, hearing, "
            "motor control and cognition excludes a substantial population -- "
            "and in many jurisdictions doing so is unlawful, which makes "
            "accessibility a requirement rather than a courtesy."
        ),
        table(
            ["Barrier", "Affects", "What the design must provide"],
            [["Colour used alone to convey meaning",
              "Colour-blind users, and anyone printing in monochrome",
              "A second cue: text, shape or position"],
             ["Low contrast text", "Low vision, and anyone in bright light",
              "Sufficient contrast against the background"],
             ["Images without alternative text", "Screen reader users",
              "A description of what the image conveys"],
             ["Mouse-only interaction", "Motor impairments, keyboard users",
              "Every function reachable by keyboard"],
             ["Audio or video without captions", "Deaf and hard of hearing",
              "Captions and transcripts"],
             ["Fixed small text", "Low vision, older users",
              "Text that reflows when enlarged"]],
            caption="Six barriers and what removes each.",
            footer="Notice how many of these help everyone. Captions serve a "
                   "noisy room, keyboard access serves power users, and "
                   "contrast serves anyone outdoors."),
        desc(
            "That last observation is the general one. Accessible design is "
            "usually better design for everybody, because the constraints it "
            "imposes -- clear structure, more than one cue, adjustable "
            "presentation -- are what makes an interface robust under "
            "conditions nobody planned for."
        ),
        desc(
            "The Markup lesson's semantic structure is the mechanism behind "
            "most of this. A screen reader offers navigation by heading only "
            "if headings are marked as headings, and keyboard focus moves "
            "sensibly only if interactive elements are genuinely interactive "
            "elements -- so accessibility is largely a consequence of "
            "describing content correctly rather than a separate layer."
        ),
    ]),

    ("Testing the Design", [
        desc(
            "Whether a design works is a question about users, so it is "
            "answered by observing users rather than by discussion among the "
            "people who built it."
        ),
        compare_grid(
            "WAYS TO EVALUATE AN INTERFACE",
            "The examination distinguishes these, and they answer different "
            "questions.",
            [("Usability testing",
              "Representative users attempt real tasks while being observed. "
              "Finds what actually goes wrong, and a surprisingly small "
              "number of participants surfaces most of the serious "
              "problems."),
             ("Heuristic evaluation",
              "Specialists inspect the interface against a list of "
              "principles. Cheaper and faster than testing, and it finds "
              "violations rather than the specific confusions real users "
              "have."),
             ("A/B testing",
              "Two versions shown to different users, with a measured "
              "outcome deciding. Answers 'which performs better' precisely "
              "and does not explain why."),
             ("Analytics and support data",
              "Where users abandon a process, and what they call about. "
              "Points at the problem areas continuously, without saying what "
              "is wrong with them.")]),
        desc(
            "The point the examination emphasises is that observing a user "
            "attempt a task is not the same as asking their opinion. People "
            "are poor at predicting their own behaviour and generous when "
            "asked directly, so a design that tests badly and reviews well is "
            "a design with a problem -- and the observation is the evidence "
            "that matters."
        ),
    ]),

    ("Navigation and Information Architecture", [
        desc(
            "Beyond a single screen, a user must be able to find things and "
            "know where they are. That is information architecture, and the "
            "examination asks about it through the symptoms of getting it "
            "wrong."
        ),
        table(
            ["The user asks", "Provided by"],
            [["Where am I?", "A visible indication of the current location"],
             ["How did I get here?", "A breadcrumb trail"],
             ["Where can I go?", "Visible navigation, not hidden menus"],
             ["How do I get back?", "A reliable back path that does not lose "
                                    "work"],
             ["Where is the thing I want?", "Search, and a structure that "
                                            "matches how users think"]],
            caption="Five questions a navigation scheme must answer.",
            footer="The last row is the hard one. A structure organised by "
                   "the company's departments is obvious internally and "
                   "meaningless to a customer, who is looking for a task "
                   "rather than an owner."),
        desc(
            "The DEPTH against BREADTH trade is examined. A deep hierarchy "
            "has few choices at each level and many levels, so each decision "
            "is easy and there are many of them; a broad one has many choices "
            "at each level and few levels. Broad and shallow generally wins "
            "for findability, because scanning a list is faster than making a "
            "sequence of guesses -- and each wrong guess costs a return "
            "journey."
        ),
    ]),

    ("Forms That People Complete", [
        desc(
            "Long forms are abandoned, and the abandonment is usually "
            "designed in rather than inherent. Several techniques address it "
            "directly."
        ),
        ul([
            "ASK FOR LESS. Every field costs completion rate, so a field "
            "should be present only if someone would act differently knowing "
            "the answer -- and 'we might want it later' does not qualify.",
            "SHOW PROGRESS on a multi-step form, so the user can judge "
            "whether to start and whether to continue. An unbounded sequence "
            "of steps is abandoned at the point the user decides it may never "
            "end.",
            "PRESERVE ENTERED DATA across errors, navigation and session "
            "loss. Discarding a half-completed form on a validation failure "
            "is the most reliable way to lose a user permanently.",
            "GROUP RELATED FIELDS and label the groups, so a long form reads "
            "as several short ones.",
            "MARK OPTIONAL rather than required fields when most are "
            "required, since the shorter marking is the one that gets read.",
        ]),
        desc(
            "The first point is the one with the widest reach and it is a "
            "requirements question rather than a design one. Fields are "
            "usually requested because somebody might find them useful, and "
            "each one measurably reduces the number of people who finish -- "
            "so the argument for a field has to be made against a cost, which "
            "is a discipline the Software Requirements lesson formalises."
        ),
    ]),

    ("Presenting Data", [
        desc(
            "A great deal of what an interface shows is data rather than "
            "controls, and how it is presented determines whether anyone can "
            "act on it."
        ),
        table(
            ["Presentation", "Suits", "Fails at"],
            [["A table", "Comparing exact values across records",
              "Showing a trend, or holding attention past a screenful"],
             ["A chart", "Showing a shape -- trend, distribution, "
                         "proportion",
              "Reading an exact value off it"],
             ["A summary figure", "Answering one question at a glance",
              "Any question other than that one"],
             ["A list", "Scanning for one item among many",
              "Comparing items on several attributes at once"]],
            caption="Four presentations and what each is bad at.",
            footer="The pairing that recurs is a chart for the shape with the "
                   "table beneath it for the values -- because the two "
                   "questions are genuinely different and each presentation "
                   "answers only one."),
        desc(
            "The recurring fault is presenting everything available rather "
            "than what the reader came for. A dashboard showing forty "
            "measures is a list of numbers nobody reads; one showing four, "
            "with the rest a click away, is a dashboard. Deciding what to "
            "leave out is the design work, and it requires knowing what "
            "decision the reader is making."
        ),
    ]),

    ("Consistency Across a System", [
        desc(
            "A user learns a system once if it behaves consistently and "
            "screen by screen if it does not. Consistency operates at several "
            "levels, and the examination distinguishes them."
        ),
        table(
            ["Level", "Means", "Broken by"],
            [["Within a screen", "Similar things look and behave similarly",
              "Two buttons with the same label doing different things"],
             ["Across the system", "A pattern learned once applies "
                                   "everywhere",
              "Save on one screen, Submit on another, Apply on a third"],
             ["With the platform", "Following the conventions of the "
                                   "operating system or device",
              "Reinventing a standard control so it behaves differently"],
             ["With the real world", "Matching terms and sequences the user "
                                     "already knows",
              "Using internal jargon in place of the business term"]],
            caption="Four levels of consistency, each with its failure.",
            footer="The fourth is the one that damages a system quietly. "
                   "Internal terminology on user-facing screens forces every "
                   "user to maintain a translation, and it never appears as a "
                   "defect report."),
        desc(
            "There is one legitimate reason to break consistency, and the "
            "examination expects it: when the situation genuinely differs and "
            "looking the same would mislead. A destructive action SHOULD look "
            "different from a routine one, because making it look identical "
            "is consistency working against the user."
        ),
    ]),

    ("Help and Documentation", [
        desc(
            "The best help is an interface that needs none, and some is "
            "always needed. Where it sits determines whether it is used."
        ),
        compare_grid(
            "WHERE HELP CAN LIVE",
            "The closer help sits to the moment of confusion, the more likely "
            "it is to be read.",
            [("In the interface itself",
              "A field hint, an example value, a short explanation beside the "
              "control. Read, because it costs nothing to read and appears "
              "where the question arises."),
             ("Context-sensitive help",
              "Reached from the screen and about that screen. Read when "
              "someone is genuinely stuck, which is the point at which they "
              "will accept an interruption."),
             ("A separate manual",
              "Comprehensive, current at the moment of writing, and "
              "consulted rarely -- because finding the relevant passage costs "
              "more than guessing, so people guess."),
             ("Training",
              "Necessary for genuinely complex systems and no substitute for "
              "clarity. A system that cannot be used without training must "
              "still be usable by someone who has forgotten it.")]),
        desc(
            "The examination's point is that help is not a remedy for a "
            "design problem. Documenting a confusing screen leaves it "
            "confusing for everyone who does not read the documentation, "
            "which is most people -- so where a choice exists between "
            "explaining something and removing the need to explain it, the "
            "second is the design answer."
        ),
    ]),

    ("Prototyping", [
        desc(
            "A design is tested before it is built, because changing a "
            "drawing costs almost nothing and changing a built system costs a "
            "great deal. The syllabus names the fidelity levels."
        ),
        compare_grid(
            "LOW AND HIGH FIDELITY",
            "Each answers different questions, and using the wrong one wastes "
            "the exercise.",
            [("Low fidelity -- sketches and wireframes",
              "Structure, flow and content, with no visual detail. Cheap "
              "enough to discard, which is the point: people criticise a "
              "sketch honestly and defend something that looks finished."),
             ("High fidelity -- realistic and interactive",
              "Appearance and interaction, close enough to test properly with "
              "users. Expensive to change, and it draws feedback about "
              "colours and fonts when the structure is what needed "
              "deciding.")]),
        desc(
            "The sequencing follows: settle structure and flow with something "
            "cheap, then refine appearance with something realistic. Starting "
            "at high fidelity means the expensive artefact exists before the "
            "cheap questions have been answered, and its very polish "
            "discourages the fundamental change that testing may call for."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where interface design items are lost."),
        ul([
            "Validating only on submission rather than at the point of "
            "entry.",
            "Writing error messages that state a code without saying what to "
            "do.",
            "Using colour as the only cue for meaning.",
            "Treating accessibility as an optional enhancement rather than a "
            "requirement.",
            "Relying on client-side validation as a security control. It can "
            "be bypassed entirely.",
            "Asking users their opinion instead of observing them attempt the "
            "task.",
            "Emphasising everything on a screen, which emphasises nothing.",
            "Telling a failed login which of the two fields was wrong.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A form validates all fields only when Submit is pressed, then "
            "displays a list of errors at the top of the page. Users report "
            "the form is frustrating. Identify the faults and the "
            "improvements.\""
        ),
        ol([
            "Fault one: validation timing. Errors are reported long after the "
            "user finished thinking about each field, so they must "
            "reconstruct what they intended. Validate at the point of entry.",
            "Fault two: error location. A list at the top must be mapped back "
            "onto the fields below it. Show each message beside the field it "
            "concerns.",
            "Fault three: the errors were permitted at all. Where a control "
            "could have prevented invalid input -- a date picker, a list of "
            "valid values -- prevention beats reporting.",
            "Fault four, likely: the messages themselves. Each should say "
            "what is wrong, why in the user's terms, and what to do.",
            "Note what does NOT change: the server must still validate "
            "everything, because interface validation is a convenience and "
            "not a control.",
        ]),
        desc(
            "The final step is what separates a complete answer from a "
            "partial one, and it is the point at which this lesson connects "
            "to Security. Every improvement above is for the user; none of "
            "them protects the system, because anything not using the "
            "interface bypasses all of it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Interface design touches the legal and development majors."),
        ul([
            "Semantic markup from the Markup lesson is the mechanism behind "
            "accessibility.",
            "Client-side validation not being a control is a Security "
            "principle.",
            "Not disclosing which credential failed is authentication design "
            "from Security.",
            "Usability requirements are specified in Software Requirements "
            "Definition.",
            "Usability testing is a form of acceptance testing.",
            "Accessibility obligations appear in Other Laws, Guidelines and "
            "Engineer Ethics.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five results this lesson expects immediately.",
            [("The three things an error message must say",
              "What is wrong, why, and what to do",
              "A code alone transfers the work to the user or the support "
              "desk."),
             ("Why colour must never be the only cue",
              "Colour-blind users and monochrome output lose it entirely",
              "Add text, shape or position as a second cue."),
             ("What client-side validation is for",
              "The user's convenience, never security",
              "Anything not using the interface bypasses it, so the server "
              "must repeat every check."),
             ("The exception to helpful error messages",
              "Authentication failures",
              "Never say which of username and password was wrong; it "
              "discloses which usernames exist."),
             ("Why asking users their opinion is weak evidence",
              "People predict their own behaviour poorly",
              "Observing someone attempt the task is what reveals where it "
              "actually fails.")]),
    ]),
]

_id_quiz = [
    mcq("AVERAGE",
        "Every field is checked only when Submit is pressed, and all "
        "errors then appear in a banner at the top of the page.\n\n"
        "What is the principal improvement?",
        [("Reduce the number of fields on the form", False),
         ("Validate each field as it is completed and show messages beside "
          "it", True),
         ("Replace the banner with a modal dialogue listing the errors",
          False),
         ("Submit the form automatically as soon as every field contains "
          "some value", False)],
        "Validating at the point of entry lets the user correct a field while "
        "they are still thinking about it, and placing the message beside the "
        "field removes the work of mapping a list back onto the inputs. A "
        "modal presents the same list with an added interruption. Reducing "
        "fields may help separately, but it does not address when and where "
        "errors are reported."),

    mcq("EASY",
        "Status is indicated on a dashboard using red and green colouring "
        "alone.\n\nWhat is the accessibility problem?",
        [("Red and green are difficult to render accurately on "
          "low-resolution displays", False),
         ("Colour-blind users and monochrome output cannot distinguish the "
          "states", True),
         ("Coloured elements cannot be read by keyboard navigation", False),
         ("Colour increases the page's download size unnecessarily", False)],
        "Red-green colour blindness is the most common form, and colour is "
        "also lost entirely in monochrome printing and in bright sunlight. "
        "The remedy is a second cue carrying the same information -- a label, "
        "an icon shape or a position -- so that colour reinforces the meaning "
        "rather than carrying it alone. This is one of the most frequently "
        "examined accessibility points."),

    mcq("HARD",
        "Server-side validation is argued to be unnecessary because the "
        "form already validates every field in the browser.\n\n"
        "Why is this wrong?",
        [("Browser validation runs too slowly for large forms", False),
         ("Anything not using the browser form bypasses the validation "
          "entirely", True),
         ("Browser validation cannot check numeric ranges", False),
         ("Server validation is required before the form is permitted to "
          "submit at all", False)],
        "Client-side validation is a convenience for the user and provides no "
        "protection, because a request can be constructed directly -- by a "
        "script, a tool or a modified page -- without the form being involved "
        "at all. Every check must therefore be repeated where it cannot be "
        "bypassed. This is one of the most consistently examined points at "
        "the boundary between interface design and security."),

    mcq("AVERAGE",
        "Which error message best meets the criteria for a helpful one?",
        [("Error 0x80070005 has occurred", False),
         ("Account numbers are 8 digits; this one has 7. Check the invoice.",
          True),
         ("Invalid input. Please correct and resubmit.", False),
         ("The operation could not be completed at this time. Please try "
          "again later.", False)],
        "A helpful message says what went wrong, why in the user's terms, and "
        "what to do next -- and only the second option does all three. A code "
        "conveys nothing to the user, 'invalid input' identifies neither the "
        "field nor the rule, and the last states a failure without any "
        "indication of cause or remedy. Each of those transfers the work to "
        "the user or to a support desk."),

    mcq("HARD",
        "Entering an unknown username makes a login page report that no "
        "such username exists.\n\nWhat is the concern?",
        [("The message is unhelpful and should name the correct username",
          False),
         ("It confirms which usernames exist, assisting an attacker", True),
         ("It violates the requirement that messages avoid blaming the "
          "user", False),
         ("Login messages should always be displayed beside the field", False)],
        "Distinguishing an unknown username from a wrong password lets an "
        "attacker enumerate valid accounts before attempting any passwords, "
        "which is why authentication is the documented exception to otherwise "
        "helpful messaging: both failures must produce the same response. "
        "Helpfulness is the default everywhere else, and this is the case "
        "where it must be deliberately withheld."),

    mcq("AVERAGE",
        "Users report that they cannot find a function which is in fact "
        "present on the screen.\n\n"
        "Which aspect of layout is most likely at fault?",
        [("Visual hierarchy, since the element is no more prominent than "
          "its surroundings", True),
         ("Colour contrast, since the element is difficult to read", False),
         ("Reading order, since the element appears before the task begins",
          False),
         ("White space, since the screen contains too few elements", False)],
        "If an element is present and not found, the usual cause is that "
        "nothing marks it as important: it carries the same size, weight and "
        "position as everything around it, so the eye has no reason to stop "
        "there. Grouping and hierarchy are what direct attention. Contrast "
        "would make it hard to READ once found, which is a different "
        "complaint."),

    mcq("AVERAGE",
        "Data is transcribed on screen from a paper form.\n\n"
        "Which design choice most reduces transcription errors?",
        [("Reducing the number of fields shown at one time", False),
         ("Ordering the screen fields to match the paper form", True),
         ("Increasing the font size of all field labels", False),
         ("Requiring each field to be confirmed before the next", False)],
        "When the screen order matches the source, the user's eye moves down "
        "both documents together and each value is copied from the position "
        "it was last at. A different order forces a search of the source for "
        "every field, which is slower and produces transposition errors "
        "directly. Confirmation per field would slow a high-volume task "
        "considerably without addressing the cause."),

    mcq("HARD",
        "Reviewing an interface among themselves, a team agrees it is "
        "clear and releases it. Users then struggle with it.\n\n"
        "What was the flaw in the evaluation?",
        [("Too few reviewers took part in the discussion", False),
         ("The reviewers already knew the system and were not the users",
          True),
         ("Heuristic evaluation is fundamentally unsuitable for assessing "
          "an interface", False),
         ("The review was conducted before the interface was complete",
          False)],
        "People who built a system cannot un-know how it works, so their "
        "judgement of clarity says nothing about someone meeting it for the "
        "first time. The evidence that matters is observing representative "
        "users attempting real tasks -- and notably, asking users their "
        "opinion is also weak, since people predict their own behaviour "
        "poorly and answer generously. Heuristic evaluation is a legitimate "
        "technique; it simply answers a different question."),

    mcq("EASY",
        "Which measure makes video content accessible to deaf and hard of "
        "hearing users?",
        [("Increasing the video's resolution", False),
         ("Providing captions and a transcript", True),
         ("Ensuring the player can be operated by keyboard", False),
         ("Adding alternative text to the video thumbnail", False)],
        "Captions present the spoken content and relevant sounds as "
        "synchronised text, and a transcript makes the same content available "
        "separately and searchable. Keyboard operation addresses motor "
        "impairment and alternative text addresses vision -- both worth doing "
        "and neither the answer here. Captions also serve anyone in a noisy "
        "environment, which is the recurring pattern that accessible design "
        "helps more people than it targets."),

    mcq("AVERAGE",
        "What distinguishes usability testing from heuristic evaluation?",
        [("Usability testing observes real users attempting tasks; "
          "heuristic evaluation is expert inspection", True),
         ("Usability testing is always performed before development "
          "begins, and heuristic evaluation only afterwards", False),
         ("Usability testing measures speed; heuristic evaluation measures "
          "satisfaction", False),
         ("Usability testing is automated; heuristic evaluation is manual",
          False)],
        "Usability testing puts representative users in front of real tasks "
        "and observes what actually goes wrong, which finds the specific "
        "confusions people have. Heuristic evaluation has specialists inspect "
        "the design against a list of principles, which is faster and cheaper "
        "and finds violations rather than confusions. Both are useful and "
        "they answer different questions; neither is tied to a phase or "
        "automated."),
]

LESSON_HI_DESIGN = lesson(
    MAJOR, MIDDLE,
    "Interface Design, Screen Design and Accessibility",
    _id_quiz,
    lesson_structure(
        "Interface Design, Screen Design and Accessibility",
        "The previous lesson established what to aim for; this one is about "
        "producing an actual screen. It covers how arrangement carries "
        "meaning whether or not it was designed to, how input is collected so "
        "that errors are prevented rather than reported, what an error "
        "message must say and the one case where helpfulness must be withheld, "
        "accessibility as a functional and often legal requirement rather "
        "than a courtesy, and how a design is actually evaluated -- by "
        "watching people attempt tasks, since asking their opinion answers a "
        "different and weaker question.",
        [
            "Apply grouping, hierarchy, alignment and reading order to "
            "diagnose a layout fault",
            "Design input so that invalid values are prevented at the point "
            "of entry",
            "Write an error message that says what is wrong, why and what to "
            "do",
            "Explain why client-side validation is not a security control",
            "Identify accessibility barriers and the measure that removes "
            "each",
            "Compare usability testing, heuristic evaluation and A/B testing",
        ],
        60,
        _id_sections,
        [
            ("Visual hierarchy",
             "The use of size, weight and position to signal importance. If "
             "everything is emphasised, nothing is."),
            ("Grouping",
             "Placing related elements together and separating unrelated "
             "ones. Proximity is read as relatedness before any label is."),
            ("Point-of-entry validation",
             "Checking a field as it is completed, so the user corrects it "
             "while still thinking about it."),
            ("Error prevention",
             "Choosing controls that permit only valid values, so a class of "
             "error cannot occur rather than being reported."),
            ("Client-side validation",
             "Checking in the interface. A convenience for the user and never "
             "a security control, since anything not using the interface "
             "bypasses it."),
            ("Accessibility",
             "Designing so people with visual, auditory, motor or cognitive "
             "differences can use the system. A requirement, and in many "
             "jurisdictions a legal one."),
            ("Alternative text",
             "A description of what an image conveys, for anyone or anything "
             "that cannot see it."),
            ("Captions",
             "Synchronised text of spoken content and relevant sounds, "
             "serving deaf users and anyone in a noisy environment."),
            ("Usability testing",
             "Observing representative users attempt real tasks. Finds the "
             "specific confusions people actually have."),
            ("Heuristic evaluation",
             "Expert inspection against a list of principles. Cheaper than "
             "testing, and it finds violations rather than confusions."),
            ("A/B testing",
             "Comparing two versions on a measured outcome. Says precisely "
             "which performs better and nothing about why."),
        ],
        "Producing a screen means deciding what belongs on it, where each "
        "element sits, how input is collected, what happens when something is "
        "wrong, and how any of it is verified. Arrangement carries meaning "
        "whether intended or not -- proximity is read as relatedness, and "
        "size and position as importance -- so an element nobody can find is "
        "usually present and unemphasised rather than absent. Input design is "
        "where interface faults become data faults, and the technique "
        "throughout is prevention over reporting: a control that admits only "
        "valid values, validation as each field is completed rather than at "
        "submission, sensible defaults, and a field order matching the source "
        "document. Error messages must still say what is wrong, why in the "
        "user's terms and what to do, without blame and beside the field -- "
        "with authentication the documented exception, where saying which "
        "credential failed hands an attacker a list of valid usernames. "
        "Accessibility is a requirement rather than a courtesy, and the "
        "barriers have specific remedies: never colour alone, sufficient "
        "contrast, alternative text, full keyboard operation, captions, and "
        "text that reflows -- most of which help everyone. And evaluation "
        "means watching representative users attempt real tasks, because the "
        "people who built a system cannot un-know how it works and users "
        "asked for an opinion answer generously. One rule survives all of it: "
        "everything in this lesson serves the user, and none of it protects "
        "the system.",
        exam_notes=[
            desc(
                "Interface design items describe a screen with a complaint "
                "and ask for the fault or the fix, and accessibility appears "
                "every sitting."
            ),
            ul([
                "Identifying the improvement for a form validating only on "
                "submission.",
                "Naming the accessibility barrier in a described design.",
                "Selecting the best-written error message.",
                "Explaining why client-side validation is not a security "
                "control.",
                "Explaining why a login must not say which field was wrong.",
                "Distinguishing usability testing from heuristic evaluation.",
            ]),
            desc(
                "Two answers recur often enough to check for first: 'prevent "
                "it at the point of entry' for anything about invalid input, "
                "and 'a second cue besides colour' for anything about status "
                "indication."
            ),
        ],
    ))

LESSONS = [LESSON_HI_TECH, LESSON_HI_DESIGN]
