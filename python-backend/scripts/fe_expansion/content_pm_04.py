"""Project Management, lessons 8 and 9.

Risk management and quality management.

The risk lesson treats a risk register as a live document with owners and
triggers rather than as an opening exercise, because the examination's items
describe risks that were identified and then not managed.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Project Management"
MIDDLE = "Project Management"

# ==========================================================================
# Lesson 8: Risk management
# ==========================================================================

_risk_sections = [
    ("Uncertainty With Consequences", [
        desc(
            "A risk is an uncertain event that would affect the project's "
            "objectives if it occurred -- and the definition includes "
            "opportunities as well as threats."
        ),
        image(fig("risk-process-pm")),
        table(
            ["", "Risk", "Issue", "Assumption"],
            [["Status", "Might happen", "Has happened",
              "Believed, and unverified"],
             ["Response", "A plan and a trigger", "Resolution now",
              "Verification, or a risk if it fails"],
             ["Recorded in", "The risk register", "The issue log",
              "The assumption log"]],
            caption="Three related things that are frequently confused.",
            footer="A risk that OCCURS becomes an issue; an assumption that "
                   "FAILS becomes a risk or an issue. Keeping the three "
                   "separate is what makes it clear which need watching and "
                   "which need doing something about now."),
        desc(
            "Opportunities are managed by the same process with the "
            "responses inverted: exploit rather than avoid, enhance rather "
            "than mitigate, share rather than transfer, accept in both "
            "cases. Projects that treat risk as purely negative "
            "systematically fail to act on favourable uncertainty."
        ),
    ]),

    ("Identifying Risks", [
        desc(
            "A risk nobody has identified cannot be managed, so "
            "identification is deliberate, structured and repeated."
        ),
        ul([
            "Draw on the plan itself: every assumption, every dependency and "
            "every estimate with a wide range is a candidate.",
            "Draw on experience: what went wrong on comparable projects, "
            "which is what lessons learned exist for.",
            "Use structured prompts -- categories, checklists, the "
            "organisation's own risk breakdown -- since unprompted "
            "brainstorming misses whole areas.",
            "Involve the team and the stakeholders, since the people doing "
            "the work see risks the manager does not.",
            "Repeat it, because new risks appear with each phase and old ones "
            "change.",
        ]),
        desc(
            "A risk should be stated as CAUSE, EVENT and EFFECT rather than "
            "as a single word. 'Staff' is not a risk; 'because two "
            "specialists are shared with another project, they may be "
            "unavailable in March, delaying integration by three weeks' is "
            "one that can be assessed and responded to."
        ),
    ]),

    ("Analysing Risks", [
        desc(
            "More risks are identified than can be actively managed, so they "
            "are ranked."
        ),
        image(fig("risk-matrix")),
        desc(
            "QUALITATIVE analysis rates each risk's probability and impact on "
            "a scale and combines them into a priority. It is quick, works "
            "with imperfect information, and is what most projects use."
        ),
        desc(
            "QUANTITATIVE analysis assigns numeric probabilities and values, "
            "producing an expected monetary effect and supporting techniques "
            "such as simulation. It is more precise and depends on data most "
            "projects do not have -- so a quantitative figure derived from "
            "invented probabilities carries authority its inputs do not "
            "deserve."
        ),
        table(
            ["Probability", "Impact", "Response"],
            [["High", "High", "Act now -- mitigate or avoid"],
             ["Low", "High", "Prepare -- contingency plan and a trigger"],
             ["High", "Low", "Absorb -- expect it and plan around it"],
             ["Low", "Low", "Accept, and review periodically"]],
            caption="Four combinations and what each argues for.",
            footer="LOW PROBABILITY, HIGH IMPACT is where projects are "
                   "actually damaged. It is dismissed because it is unlikely, "
                   "and unlikely is not never -- which is precisely what "
                   "contingency planning exists for."),
    ]),

    ("Responding to Risks", [
        desc(
            "Four responses to a threat, and the examination expects all four "
            "with the circumstances each suits."
        ),
        table(
            ["Response", "Means", "Suits"],
            [["Avoid", "Change the plan so the risk cannot occur",
              "A severe risk where an alternative approach exists"],
             ["Mitigate", "Reduce its probability or its impact",
              "The default, where the reduction costs less than the risk"],
             ["Transfer", "Make it somebody else's financial exposure",
              "Where insurance or a contract can carry it"],
             ["Accept", "Decide knowingly to live with it",
              "Where the response would cost more than the risk"]],
            caption="Four threat responses.",
            footer="ACCEPTANCE is a decision requiring authority and a "
                   "record, exactly as in the Security category. Accepting a "
                   "risk and ignoring one look identical afterwards and "
                   "differ entirely in whether anybody chose."),
        desc(
            "Acceptance divides into ACTIVE -- setting aside contingency "
            "against it -- and PASSIVE, which is doing nothing beyond "
            "recording the decision. The first is appropriate where the "
            "impact would be material, and it is what contingency reserve "
            "exists to fund."
        ),
    ]),

    ("Owners and Triggers", [
        desc(
            "A response written down and nobody watching for the moment to "
            "apply it is a response that will not happen."
        ),
        ol([
            "Assign every risk an OWNER -- one named person who watches it, "
            "not a team.",
            "Define the TRIGGER: the observable condition meaning the risk is "
            "materialising.",
            "State the response, specifically enough to be executed rather "
            "than interpreted.",
            "Review the register regularly, since probabilities and impacts "
            "change.",
            "Close risks that have passed, so the register describes the "
            "present rather than accumulating history.",
        ]),
        desc(
            "The TRIGGER is the element most often missing and the one that "
            "makes the plan operational. 'If the supplier is late' is not "
            "observable; 'if the design is not delivered by the fifteenth' "
            "is, and it tells the owner exactly when to act rather than "
            "leaving them to judge."
        ),
    ]),

    ("Monitoring", [
        desc(
            "A risk register written once describes the project as it was "
            "imagined at the start."
        ),
        ul([
            "Review at defined points -- phase boundaries, and regularly "
            "within a phase.",
            "Add new risks, since each phase brings work whose risks were not "
            "visible before.",
            "Reassess existing ones, because a risk becomes more or less "
            "likely as circumstances change.",
            "Check whether responses were actually implemented, since an "
            "unimplemented mitigation leaves the original risk.",
            "Move materialised risks to the issue log, and record what "
            "happened for the next project.",
        ]),
        desc(
            "SECONDARY risks are the ones this catches. A response to one "
            "risk frequently creates another -- outsourcing to avoid a skills "
            "risk creates a supplier dependency risk -- and a register "
            "reviewed only at the start records the first and misses the "
            "second entirely."
        ),
    ]),

    ("Risk Categories", [
        desc(
            "Unprompted identification misses whole areas, so risks are "
            "sought within categories."
        ),
        table(
            ["Category", "Typical risks"],
            [["Technical", "Unproven technology, complexity, performance "
                           "uncertainty"],
             ["Organisational", "Funding, priorities, resource availability, "
                                "restructuring"],
             ["External", "Suppliers, regulation, market conditions, "
                          "weather"],
             ["Project management", "Estimating, planning, communication, "
                                    "control"]],
            caption="Four categories, each prompting a different line of "
                    "questioning.",
            footer="PROJECT MANAGEMENT risks are the category teams forget "
                   "because they concern the project's own conduct. A plan "
                   "built on optimistic estimates is a risk in the same sense "
                   "as an unproven technology, and it is far more common."),
        desc(
            "Working through categories systematically is what turns "
            "identification from a conversation into a method -- and the "
            "organisation's own history of what went wrong is the most "
            "productive prompt of all."
        ),
    ]),

    ("Risk Appetite and Thresholds", [
        desc(
            "How much risk is acceptable is an organisational decision rather "
            "than a project one, and it has to be stated to be usable."
        ),
        ul([
            "APPETITE is how much uncertainty the organisation is willing to "
            "take in pursuit of an objective.",
            "TOLERANCE is the range of variation it will accept before "
            "something must be escalated.",
            "THRESHOLD is the specific point at which a response becomes "
            "mandatory rather than discretionary.",
            "These must be expressed in terms the project can measure, or "
            "they cannot guide any actual decision.",
        ]),
        desc(
            "Stated thresholds are what let a project manager act without "
            "escalating everything. A defined tolerance says which decisions "
            "belong to the project and which belong above it, which is what "
            "makes delegated authority workable in practice."
        ),
    ]),

    ("Communicating About Risk", [
        desc(
            "Risk information is only useful if it reaches the people who can "
            "act on it, in a form they can act on."
        ),
        compare_grid(
            "REPORTING RISK BADLY AND WELL",
            "The same register, communicated two ways.",
            [("Badly",
              ["A long list, unchanged since the last report",
               "Every risk at the same level of prominence",
               "Statuses without what changed",
               "No indication of what anybody should do"]),
             ("Well",
              ["The few risks that matter now, and why",
               "What has changed since the last report",
               "Which are approaching their triggers",
               "What decision, if any, is being asked for"])]),
        desc(
            "The right-hand column reflects what a reader actually needs. A "
            "sponsor cannot act on forty risks and can act on the two "
            "approaching a trigger -- and a report that does not distinguish "
            "them has communicated everything and conveyed nothing."
        ),
    ]),

    ("Contingency and Fallback", [
        desc(
            "Two kinds of prepared response, distinguished by when they are "
            "used."
        ),
        table(
            ["", "Contingency plan", "Fallback plan"],
            [["Used when", "The risk occurs",
              "The contingency plan proves insufficient"],
             ["Prepared for", "The anticipated risk",
              "The anticipated response failing"],
             ["Example", "Engage a second supplier if the first is late",
              "Descope the affected feature entirely"]],
            caption="Two layers of prepared response.",
            footer="A FALLBACK matters where the contingency itself might not "
                   "work. Preparing only one response assumes it will "
                   "succeed, which is an assumption about a plan for "
                   "something that has already gone wrong once."),
        desc(
            "Both are prepared in advance and both need triggers, which is "
            "the point. A response invented at the moment a risk "
            "materialises is made under pressure with incomplete information "
            "-- which is precisely the condition planning exists to avoid."
        ),
    ]),

    ("Risk and the Other Knowledge Areas", [
        desc(
            "Risk is not a separate activity performed alongside the project; "
            "it is a property of every decision the project makes."
        ),
        table(
            ["Decision", "Risk it creates or removes"],
            [["A tight estimate accepted as a commitment",
              "Creates schedule risk that nobody recorded"],
             ["Fast tracking to compress the schedule",
              "Creates rework risk, deliberately"],
             ["A fixed-price contract for uncertain work",
              "Transfers risk, at a price the supplier sets"],
             ["Reducing review effort",
              "Creates defect risk, in exchange for time"],
             ["A single person owning critical knowledge",
              "Creates an availability risk nobody wrote down"]],
            caption="Five ordinary decisions, each with a risk consequence.",
            footer="The last row is the pattern worth noticing. Several of "
                   "these risks are created by decisions taken for good "
                   "reasons in other knowledge areas -- and they belong in "
                   "the register regardless of where they originated."),
        desc(
            "Reading decisions this way is what makes risk identification "
            "continuous rather than periodic. Every schedule compression, "
            "every contract and every resourcing choice changes the risk "
            "profile, and the register should reflect that rather than the "
            "state of things at kickoff."
        ),
    ]),

    ("Learning From Materialised Risks", [
        desc(
            "A risk that occurs is an opportunity to improve, provided "
            "somebody records what actually happened."
        ),
        ol([
            "Record whether it had been identified, since that distinguishes "
            "a management failure from a genuine surprise.",
            "Record whether the response was executed, and whether the "
            "trigger worked.",
            "Record whether the impact matched the assessment, since "
            "systematic underestimation is itself a finding.",
            "Record what would have prevented or reduced it, in terms the "
            "next project can apply.",
            "Feed all of it into the organisation's risk breakdown, so the "
            "next project's identification starts better informed.",
        ]),
        desc(
            "The first step is the one that changes behaviour. A risk that "
            "occurred and was never identified points at the identification "
            "process; one that was identified and unmanaged points somewhere "
            "entirely different -- and treating both as bad luck improves "
            "neither."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where risk items are lost."),
        ul([
            "Treating the register as an opening exercise rather than a live "
            "document.",
            "Stating a risk as a single word, so it cannot be assessed or "
            "responded to.",
            "Dismissing low probability, high impact risks, where projects "
            "are actually damaged.",
            "Assigning a risk to a team rather than to one named person.",
            "Omitting the trigger, so nobody knows when to act.",
            "Confusing acceptance with ignoring. Acceptance requires "
            "authority and a record.",
            "Overlooking secondary risks created by the responses "
            "themselves.",
            "Treating risk as purely negative, so opportunities go "
            "unmanaged.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A risk was identified at the start, rated high impact and low "
            "probability, and recorded. It occurred, and the project had no "
            "response ready. What went wrong?\""
        ),
        ol([
            "Identification succeeded -- the risk was found and recorded, "
            "which is the step that usually fails.",
            "Analysis also succeeded, since it was rated correctly.",
            "What is missing is a RESPONSE: a low probability, high impact "
            "risk needs a contingency plan and a trigger.",
            "It was almost certainly deprioritised because it was unlikely, "
            "which is exactly the reasoning error the quadrant exists to "
            "prevent.",
            "Unlikely is not never, and the whole purpose of contingency "
            "planning is having a prepared response for the rare severe "
            "event.",
        ]),
        desc(
            "The item is constructed to reward knowing that identification is "
            "not management. A register full of well-described risks with no "
            "owners, triggers or responses documents a project's dangers "
            "without reducing any of them."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Risk management touches nearly every other area."),
        ul([
            "The process mirrors the Security category's risk cycle exactly, "
            "with the same four treatments.",
            "Contingency reserve is sized from this analysis, in the cost "
            "lesson.",
            "Schedule risk concentrates in activities with wide estimate "
            "ranges, from the time lesson.",
            "Fast tracking creates a rework risk that belongs here.",
            "Supplier dependency risks connect to procurement.",
            "Lessons learned from materialised risks feed the next project, "
            "through integration.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Risk against issue",
              "Might happen, against has happened",
              "A risk that occurs becomes an issue and moves between the "
              "logs."),
             ("How a risk should be stated",
              "Cause, event and effect",
              "'Staff' cannot be assessed; a specific cause with a specific "
              "consequence can."),
             ("The four threat responses",
              "Avoid, mitigate, transfer, accept",
              "Acceptance requires authority and a record, which is what "
              "separates it from ignoring."),
             ("The quadrant projects mishandle",
              "Low probability, high impact",
              "Dismissed as unlikely, and unlikely is not never -- which is "
              "what contingency planning is for."),
             ("The element most often missing",
              "The trigger",
              "An observable condition telling the owner exactly when to "
              "act."),
             ("What a secondary risk is",
              "One created by a response to another risk",
              "Outsourcing to avoid a skills risk creates a supplier "
              "dependency.")]),
    ]),
]

_risk_quiz = [
    mcq("HARD",
        "A risk was identified, rated high impact and low probability, and "
        "recorded. It occurred, and no response was ready.\n\n"
        "What went wrong?",
        [("No contingency plan or trigger was prepared, because the risk was "
          "unlikely", True),
         ("The risk was rated incorrectly and should have been high "
          "probability", False),
         ("The register was not reviewed frequently enough during the "
          "project", False),
         ("The risk should have been transferred rather than "
          "accepted", False)],
        "Identification and analysis both succeeded; what is missing is a "
        "RESPONSE. Low probability with high impact calls for a contingency "
        "plan and a trigger, and it is the quadrant projects deprioritise "
        "precisely because the event is unlikely -- which is the reasoning "
        "error, since unlikely is not never. A register with no responses "
        "documents dangers without reducing them."),

    mcq("AVERAGE",
        "How should a risk be stated so that it can be assessed and "
        "responded to?",
        [("As a cause, an event and an effect", True),
         ("As a category, with a probability and impact rating", False),
         ("As the worst outcome it could produce", False),
         ("As the response that would be required if it occurred", False)],
        "'Staff' is not a risk and cannot be assessed. 'Because two "
        "specialists are shared with another project, they may be unavailable "
        "in March, delaying integration by three weeks' names what could "
        "cause it, what would happen, and what it would do -- each of which "
        "the response depends on. Ratings are applied to a risk once it is "
        "stated properly."),

    mcq("AVERAGE",
        "Which risk quadrant do projects most consistently mishandle?",
        [("Low probability, high impact", True),
         ("High probability, high impact", False),
         ("High probability, low impact", False),
         ("Low probability, low impact", False)],
        "High probability risks announce themselves and low impact ones do "
        "little harm. A rare severe event is dismissed because it is "
        "unlikely -- and unlikely is not never, which is exactly what "
        "contingency planning exists for. It is where projects are actually "
        "damaged, because nothing was prepared for the one that happened."),

    mcq("HARD",
        "A project outsources work to avoid a risk that it lacks the "
        "necessary skills.\n\nWhat should be recorded as a result?",
        [("A secondary risk arising from the new supplier "
          "dependency", True),
         ("An issue, since the skills gap has now been "
          "resolved", False),
         ("A reduction in the contingency reserve, since the risk is "
          "avoided", False),
         ("An assumption that the supplier will perform as "
          "contracted", False)],
        "A response frequently creates a new risk, and this one replaces a "
        "skills risk the project controls with a dependency it does not. "
        "Recording secondary risks is what a register reviewed regularly "
        "catches and one written at the start entirely misses -- and it is "
        "why the review asks what the responses themselves introduced."),

    mcq("AVERAGE",
        "What distinguishes accepting a risk from ignoring it?",
        [("Acceptance is a recorded decision made by somebody with "
          "authority", True),
         ("Acceptance applies only to risks of low impact", False),
         ("Acceptance requires contingency reserve to be set "
          "aside", False),
         ("Acceptance means the risk has been assessed as unlikely to "
          "occur", False)],
        "Afterwards the two look identical: the risk occurred and nothing had "
        "been done. What differs is whether anybody chose -- knowingly, with "
        "the authority to make that choice, and with the reasoning recorded "
        "so it can be revisited. Active acceptance additionally sets aside "
        "contingency; passive acceptance does not, and both are legitimate."),

    mcq("HARD",
        "Why does a risk response need a defined trigger?",
        [("So the owner knows the observable condition at which to act", True),
         ("So the risk can be escalated to the appropriate authority", False),
         ("So the probability rating can be updated as the project "
          "proceeds", False),
         ("So contingency reserve can be released when it is "
          "needed", False)],
        "'If the supplier is late' requires somebody to judge when lateness "
        "has become significant, and the judgement is deferred until it is "
        "obvious -- by which time the response is a reaction. 'If the design "
        "is not delivered by the fifteenth' is observable and tells the owner "
        "exactly when to act, which is what makes a plan operational."),

    mcq("AVERAGE",
        "How are opportunities handled within risk management?",
        [("By the same process, with the responses inverted to exploit and "
          "enhance", True),
         ("Separately, since they affect benefits rather than "
          "objectives", False),
         ("They are recorded but not actively managed", False),
         ("By the sponsor rather than by the project manager", False)],
        "A risk is uncertainty with consequences, and favourable uncertainty "
        "qualifies -- so it is identified, analysed and responded to "
        "identically, with exploit replacing avoid, enhance replacing "
        "mitigate and share replacing transfer. Projects treating risk as "
        "purely negative systematically fail to act on opportunities they "
        "have already noticed."),

    mcq("HARD",
        "Why should a risk be owned by one named person rather than by a "
        "team?",
        [("Shared ownership means each may reasonably assume another is "
          "watching", True),
         ("A team cannot be given the authority to execute a "
          "response", False),
         ("Individual owners produce more accurate probability "
          "assessments", False),
         ("Team ownership prevents the risk from being escalated "
          "promptly", False),
         ],
        "A risk assigned to a team is a risk everybody assumes somebody else "
        "is monitoring, which is how a materialising risk goes unnoticed "
        "despite having been recorded and understood. It is the same "
        "reasoning as having exactly one accountable person for a work "
        "package: two owners produce none."),

    mcq("AVERAGE",
        "Why is a quantitative risk analysis sometimes misleading?",
        [("A figure computed from estimated probabilities carries unearned "
          "authority", True),
         ("It requires more time than most projects can allocate", False),
         ("It cannot be compared against the cost of the "
          "responses", False),
         ("It produces rankings rather than absolute values", False)],
        "Expressing a risk as an expected monetary effect makes it directly "
        "comparable with the cost of responding, which is genuinely valuable "
        "-- and it is only as sound as the probabilities behind it. A guess "
        "wearing a currency figure is harder to challenge than the honest "
        "'high' it replaced, which is the trap rather than the technique."),

    mcq("AVERAGE",
        "When should the risk register be reviewed?",
        [("Regularly throughout, and at every phase boundary", True),
         ("At the start, and again if a risk materialises", False),
         ("Whenever a change request is submitted for approval", False),
         ("At the end, to capture lessons for future projects", False)],
        "A register written once describes the project as it was imagined. "
        "New phases bring risks that were not visible, existing risks become "
        "more or less likely, responses may not have been implemented, and "
        "the responses themselves create secondary risks -- none of which a "
        "single opening exercise can capture."),
]

LESSON_PM_RISK = lesson(
    MAJOR, MIDDLE,
    "Project Risk Management",
    _risk_quiz,
    lesson_structure(
        "Project Risk Management",
        "A risk is uncertainty with consequences, and the definition includes "
        "opportunities -- which projects treating risk as purely negative "
        "systematically fail to act on. This lesson covers identification "
        "stated as CAUSE, EVENT and EFFECT so that a risk can actually be "
        "assessed, qualitative and quantitative analysis and why a numeric "
        "figure from invented probabilities is worse than an honest band, the "
        "four responses with acceptance requiring authority and a record, and "
        "above all the owners and TRIGGERS without which a documented "
        "response never gets executed -- since the examination's items are "
        "consistently about risks that were identified and then not managed.",
        [
            "Distinguish a risk from an issue and an assumption",
            "Explain how opportunities are managed within the same process",
            "State a risk as cause, event and effect",
            "Perform qualitative analysis and interpret the impact grid",
            "Explain the limits of quantitative analysis",
            "Apply the four threat responses appropriately",
            "Assign owners and define triggers",
            "Monitor a register and identify secondary risks",
        ],
        80,
        _risk_sections,
        [
            ("Risk",
             "An uncertain event that would affect objectives -- favourably "
             "or unfavourably -- if it occurred."),
            ("Issue",
             "Something that has already happened, needing resolution rather "
             "than a watch."),
            ("Cause, event, effect",
             "How a risk is stated so that it can be assessed and responded "
             "to."),
            ("Qualitative analysis",
             "Rating probability and impact on scales. Quick, and workable "
             "with imperfect information."),
            ("Quantitative analysis",
             "Numeric probabilities and values. Precise, and only as sound as "
             "its inputs."),
            ("Avoid, mitigate, transfer, accept",
             "The four threat responses; exploit, enhance, share and accept "
             "for opportunities."),
            ("Active acceptance",
             "Setting contingency aside against an accepted risk, as against "
             "passive acceptance's record alone."),
            ("Risk owner",
             "One named person watching it -- since a team owner means "
             "everybody assumes somebody else."),
            ("Trigger",
             "The observable condition telling the owner to act. The element "
             "most often missing."),
            ("Secondary risk",
             "One created by a response to another risk, and caught only by "
             "reviewing the register."),
        ],
        "A risk is uncertainty with consequences, including favourable ones "
        "-- managed by the same process with exploit, enhance and share "
        "replacing avoid, mitigate and transfer. It is distinct from an "
        "ISSUE, which has already happened, and from an assumption, which is "
        "merely unverified; a risk that occurs becomes an issue and moves "
        "between the logs. Identification draws on the plan's own "
        "assumptions, dependencies and wide estimates, on experience, and on "
        "structured prompts, and each risk is stated as CAUSE, EVENT and "
        "EFFECT, because a single word cannot be assessed. Analysis is "
        "usually qualitative, since quantitative figures derived from invented "
        "probabilities carry authority their inputs do not deserve -- and the "
        "quadrant projects mishandle is LOW PROBABILITY, HIGH IMPACT, "
        "dismissed as unlikely when unlikely is not never. Four responses "
        "follow, with acceptance requiring authority and a record, since "
        "accepting and ignoring look identical afterwards. What makes any of "
        "it operational is an OWNER -- one named person, because a team owner "
        "means everybody assumes somebody else -- and a TRIGGER, an "
        "observable condition telling that owner exactly when to act. And the "
        "register is reviewed throughout, which is what catches the SECONDARY "
        "risks the responses themselves created.",
        exam_notes=[
            desc(
                "Items describe a risk that materialised badly and ask which "
                "step of the process was missing."
            ),
            ul([
                "Identifying a missing response for an unlikely severe risk.",
                "Stating a risk properly as cause, event and effect.",
                "Distinguishing acceptance from ignoring.",
                "Explaining why a trigger is necessary.",
                "Recognising a secondary risk.",
                "Explaining the limits of quantitative analysis.",
                "Explaining why one named owner is required.",
            ]),
            desc(
                "When a risk was identified and still caused damage, the "
                "missing element is nearly always a response, an owner or a "
                "trigger. Identification is the step projects do well and the "
                "step that reduces nothing on its own."
            ),
        ],
    ))

# ==========================================================================
# Lesson 9: Quality management
# ==========================================================================

_qual_sections = [
    ("What Quality Means Here", [
        desc(
            "Quality in project management is conformance to requirements and "
            "fitness for purpose -- not luxury, and not the highest "
            "achievable standard."
        ),
        table(
            ["", "Quality", "Grade"],
            [["Means", "Meeting the stated requirements",
              "The level of features or capability"],
             ["Low is", "Always a problem", "Sometimes entirely "
                                            "appropriate"],
             ["Example", "A tool that breaks in use",
              "A basic tool that works reliably"]],
            caption="Two things routinely confused.",
            footer="LOW GRADE is a legitimate choice -- a simple product "
                   "meeting simple needs. LOW QUALITY is never one, since it "
                   "means the thing does not do what was specified. Confusing "
                   "them produces arguments where neither party is wrong."),
        desc(
            "The syllabus adds PRECISION and ACCURACY as a related pair: "
            "precision is consistency between measurements, accuracy is "
            "closeness to the true value. A consistently wrong measurement is "
            "precise and inaccurate, which is a specific and recognisable "
            "failure."
        ),
    ]),

    ("Planning Quality", [
        desc(
            "Quality is planned rather than inspected in, which is the "
            "principle the rest of the lesson develops."
        ),
        ol([
            "Establish the quality REQUIREMENTS -- the standards and criteria "
            "the deliverables must meet.",
            "Decide how each will be measured, since an unmeasurable "
            "criterion cannot be met or failed.",
            "Decide what activities will produce that quality -- reviews, "
            "standards, training, tooling.",
            "Decide what activities will verify it, and when.",
            "Record all of it, so quality is a plan rather than an "
            "aspiration.",
        ]),
        desc(
            "Step three and step four are different things, and conflating "
            "them is the common error. Testing verifies quality; it does not "
            "produce it -- a defective product tested more thoroughly is a "
            "defective product that is better understood."
        ),
    ]),

    ("The Cost of Quality", [
        desc(
            "Quality has a cost, and so does its absence -- and the "
            "comparison is what justifies the effort."
        ),
        image(fig("quality-cost")),
        table(
            ["Category", "Spent on", "When"],
            [["Prevention", "Training, standards, good process, reviews",
              "Before defects occur"],
             ["Appraisal", "Testing, inspection, audit",
              "To find defects that occurred"],
             ["Internal failure", "Rework before delivery",
              "After a defect is found, inside"],
             ["External failure", "Rework, support, and the harm done",
              "After delivery, when it is most expensive"]],
            caption="Four categories, and every project pays into some of "
                    "them.",
            footer="EXTERNAL FAILURE is the largest box by a wide margin, "
                   "because it includes the damage caused before anybody "
                   "noticed and the credibility lost. Prevention is cheap by "
                   "comparison and is what gets cut when a schedule "
                   "tightens."),
        desc(
            "The first two categories are the COST OF CONFORMANCE -- money "
            "spent deliberately -- and the second two the cost of "
            "NON-CONFORMANCE, spent because something went wrong. The choice "
            "is not whether to spend but which of the two, and only one is "
            "predictable."
        ),
    ]),

    ("Quality Assurance and Quality Control", [
        desc(
            "Two activities with similar names doing entirely different "
            "things, and the distinction is examined directly."
        ),
        compare_grid(
            "ASSURANCE AGAINST CONTROL",
            "The process against the product.",
            [("Quality assurance",
              ["Examines the PROCESS",
               "Asks whether the right activities are being performed",
               "Prevention-oriented, and improves how work is done",
               "Audits, process reviews, standards compliance"]),
             ("Quality control",
              ["Examines the PRODUCT",
               "Asks whether this deliverable meets its criteria",
               "Detection-oriented, and finds defects",
               "Testing, inspection, measurement"])]),
        desc(
            "The practical distinction is what each finds. Control finds a "
            "defect in one deliverable; assurance finds the process weakness "
            "producing defects in every deliverable -- so fixing what control "
            "finds corrects an instance, and fixing what assurance finds "
            "corrects a cause."
        ),
    ]),

    ("Quality Tools", [
        desc(
            "The syllabus names a set of techniques, and each answers a "
            "specific question about defects."
        ),
        content_accordion(
            "SIX QUALITY TOOLS",
            "What each is for.",
            [("Cause and effect diagram",
              "Organises the possible causes of a problem into categories, so "
              "investigation is systematic rather than following the first "
              "idea."),
             ("Pareto chart",
              "Orders defect causes by frequency, showing that most defects "
              "come from few causes -- which is where effort should go."),
             ("Control chart",
              "Plots a measurement over time against limits, distinguishing "
              "normal variation from a process genuinely out of control."),
             ("Histogram",
              "Shows the distribution of a measurement, revealing whether "
              "results cluster where they should."),
             ("Scatter diagram",
              "Shows whether two variables are related, which is where a "
              "hypothesis about a cause comes from."),
             ("Checksheet",
              "Records occurrences systematically, so the data the other "
              "tools need actually exists.")]),
        desc(
            "The PARETO principle is the one with the strongest practical "
            "consequence: a small number of causes produce most of the "
            "defects, so identifying and fixing those few is dramatically "
            "more effective than addressing defects as they arrive."
        ),
    ]),

    ("Continuous Improvement", [
        desc(
            "Quality management assumes the process itself improves, and the "
            "syllabus expects the cycle."
        ),
        ol([
            "PLAN a change intended to improve something specific.",
            "DO it, on a small scale where possible.",
            "CHECK the result against what was expected.",
            "ACT: adopt it, adapt it, or abandon it.",
            "Repeat, since the next constraint appears once this one is "
            "removed.",
        ]),
        desc(
            "The CHECK step is what distinguishes improvement from change. A "
            "modification adopted without measuring its effect may have made "
            "things worse, and the organisation now has an unexamined "
            "practice it believes in -- which is harder to remove than the "
            "original problem."
        ),
    ]),

    ("Standards and Benchmarks", [
        desc(
            "Quality criteria come from somewhere, and the syllabus expects "
            "the sources."
        ),
        ul([
            "REGULATORY standards are mandatory and set the floor rather than "
            "the target.",
            "INDUSTRY standards represent accumulated practice and are "
            "frequently what customers assume.",
            "ORGANISATIONAL standards apply the previous two consistently "
            "across projects.",
            "BENCHMARKS compare against what others achieve, which is where "
            "a target figure can come from.",
            "Customer expectations may exceed all of these, and are what "
            "satisfaction is actually measured against.",
        ]),
        desc(
            "The last point connects to the stakeholder lesson. A deliverable "
            "meeting every applicable standard can still disappoint, because "
            "satisfaction is measured against expectation -- so the "
            "expectation is managed alongside the standard being met."
        ),
    ]),

    ("Quality in the Deliverable and in the Project", [
        desc(
            "Quality management applies to the thing being built and to the "
            "way it is being built, and the two are distinct."
        ),
        compare_grid(
            "PRODUCT QUALITY AGAINST PROJECT QUALITY",
            "Two things a quality plan covers.",
            [("Product quality",
              ["The deliverable meets its requirements",
               "Measured by testing and inspection",
               "The customer experiences it directly",
               "Failure appears as defects"]),
             ("Project quality",
              ["The work is performed as it should be",
               "Measured by audit and process review",
               "The customer experiences it as predictability",
               "Failure appears as rework and surprises"])]),
        desc(
            "A project can deliver a good product through a poor process, and "
            "it will be more expensive and less predictable than it needed to "
            "be. The customer sees the product; the organisation pays for the "
            "process -- which is why both are managed."
        ),
    ]),

    ("Inspection and Sampling", [
        desc(
            "Not everything can be inspected, so what is checked and how much "
            "is a deliberate decision."
        ),
        ol([
            "Decide what evidence would demonstrate the criterion is met.",
            "Decide whether every item is inspected or a sample, based on the "
            "consequence of a defect escaping.",
            "Define the sample so it represents the whole rather than what is "
            "convenient to reach.",
            "Define what happens when the sample fails -- typically wider "
            "inspection rather than a repeat of the sample.",
            "Record the result, since inspection evidence is what audit and "
            "acceptance both draw on.",
        ]),
        desc(
            "The second decision follows the consequence rather than the "
            "cost. Where a single escaped defect is catastrophic, complete "
            "inspection is justified whatever it costs; where the consequence "
            "is minor, sampling gives most of the assurance for a fraction of "
            "the effort."
        ),
    ]),

    ("Quality Records", [
        desc(
            "Quality activities produce evidence, and the evidence is used "
            "well after the activity."
        ),
        table(
            ["Record", "Used for"],
            [["Test results", "Acceptance, and diagnosis of later "
                              "failures"],
             ["Review findings and their resolution",
              "Confirming the finding was actually addressed"],
             ["Audit reports", "Evidence of process compliance"],
             ["Defect data", "Pareto analysis and process improvement"],
             ["Measurements against criteria",
              "Demonstrating a requirement was met"]],
            caption="Five quality records and what each supports.",
            footer="DEFECT DATA is the record projects keep worst and would "
                   "benefit from most. Without it, the question 'what causes "
                   "most of our defects' cannot be answered, so improvement "
                   "effort goes wherever somebody's impression points."),
        desc(
            "The second row is worth noting separately. A review finding "
            "recorded and not tracked to resolution is a defect somebody "
            "noticed and nobody fixed -- which is worse than not having "
            "reviewed, because the effort was spent and the outcome not "
            "obtained."
        ),
    ]),

    ("Who Is Responsible for Quality", [
        desc(
            "Quality is frequently treated as somebody's department, which is "
            "the arrangement that produces the least of it."
        ),
        table(
            ["Party", "Responsible for"],
            [["Everybody doing the work",
              "The quality of what they produce, which nobody else can "
              "supply"],
             ["The project manager",
              "The plan, and the resources and time to execute it"],
             ["A quality function, where one exists",
              "Standards, assurance, and independent verification"],
             ["Management",
              "Whether the organisation's conditions permit quality at all"]],
            caption="Four parties, each with a distinct responsibility.",
            footer="The last row is the one that determines the rest. A "
                   "schedule that permits no review time is a management "
                   "decision about quality, whatever the quality plan says -- "
                   "and no amount of individual care compensates for it."),
        desc(
            "The first row is the practical foundation. Quality cannot be "
            "inspected into work by somebody else afterwards, so the person "
            "producing something is the only one positioned to build it in "
            "-- which is why quality is everybody's responsibility rather "
            "than a rhetorical statement."
        ),
    ]),

    ("Quality Under Schedule Pressure", [
        desc(
            "Every project eventually faces the choice, and how it is framed "
            "determines whether it is made deliberately."
        ),
        compare_grid(
            "HOW THE DECISION IS USUALLY MADE, AND HOW IT SHOULD BE",
            "The same pressure, handled two ways.",
            [("Usually",
              ["Quality activities are quietly reduced",
               "Nobody records a decision, because none was made",
               "The saving is visible and immediate",
               "The cost arrives later, attributed to something else"]),
             ("Deliberately",
              ["The trade is stated: what is given up for what",
               "Somebody with authority chooses",
               "The expected consequence is recorded as a risk",
               "The cost, when it arrives, is traceable to a decision"])]),
        desc(
            "The right-hand column does not make the decision better in "
            "itself -- it may be the same decision. What changes is that it "
            "becomes visible, reversible and attributable, which is what "
            "distinguishes managing a constraint from being managed by it."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where quality items are lost."),
        ul([
            "Confusing quality with grade. Low grade can be appropriate; low "
            "quality never is.",
            "Confusing quality assurance with quality control. Process "
            "against product.",
            "Believing testing produces quality. It verifies it.",
            "Cutting prevention when the schedule tightens, which raises the "
            "far larger failure costs.",
            "Treating precision as accuracy. Consistently wrong is precise.",
            "Addressing defects individually rather than finding the few "
            "causes producing most of them.",
            "Adopting a process change without measuring whether it "
            "helped.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A project under schedule pressure reduces its code review and "
            "testing effort to save two weeks. What is the likely effect on "
            "total cost?\""
        ),
        ol([
            "Identify what was cut: prevention and appraisal -- the cost of "
            "CONFORMANCE.",
            "Cutting them does not remove the defects; it removes the "
            "activities that would have found them.",
            "The defects therefore reach later stages, where correction is "
            "more expensive, and some reach delivery.",
            "Defects found after delivery incur EXTERNAL failure cost, which "
            "includes the damage done before anybody noticed.",
            "So the total cost rises, and the two weeks saved are recovered "
            "several times over -- with the difference that the later cost "
            "was not planned for.",
        ]),
        desc(
            "The reasoning generalises: quality effort is not an addition to "
            "the cost of a project but a transfer between two kinds of cost, "
            "one predictable and much smaller than the other."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Quality management runs through the certification."),
        ul([
            "The cost curve for defects is the Development Technology "
            "argument for early review.",
            "Quality control precedes scope validation, from the scope "
            "lesson.",
            "Quality criteria come from the non-functional requirements of "
            "the development category.",
            "Quality is the silent casualty when constraints are "
            "over-fixed, from the foundations lesson.",
            "Process improvement is the maturity idea of Development "
            "Technology.",
            "Supplier quality obligations belong to procurement.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("Quality against grade",
              "Meeting requirements, against level of features",
              "Low grade is a legitimate choice; low quality never is."),
             ("Assurance against control",
              "Process against product",
              "Control finds a defect; assurance finds the cause producing "
              "defects in everything."),
             ("Whether testing produces quality",
              "No -- it verifies it",
              "A defective product tested harder is better understood and "
              "equally defective."),
             ("The four cost of quality categories",
              "Prevention, appraisal, internal failure, external failure",
              "The first two are chosen; the last two are consequences, and "
              "external is by far the largest."),
             ("Precision against accuracy",
              "Consistent, against correct",
              "A consistently wrong measurement is precise and inaccurate."),
             ("What Pareto tells you",
              "Most defects come from few causes",
              "So fixing those few beats addressing defects as they "
              "arrive.")]),
    ]),
]

_qual_quiz = [
    mcq("HARD",
        "A project under schedule pressure reduces review and testing effort "
        "to save two weeks.\n\nWhat is the likely effect on total cost?",
        [("It rises, since defects reach later stages where correction costs "
          "far more", True),
         ("It falls by roughly the cost of the review and testing effort "
          "that was removed", False),
         ("It is unchanged, since the same defects exist either "
          "way", False),
         ("It falls initially and rises only if defects reach "
          "customers", False)],
        "Cutting prevention and appraisal removes the activities that find "
        "defects, not the defects themselves -- so they reach later stages "
        "where correction is more expensive, and some reach delivery, "
        "incurring external failure cost including the harm done before "
        "anybody noticed. Quality effort is a transfer between two kinds of "
        "cost, one predictable and far smaller."),

    mcq("AVERAGE",
        "What distinguishes quality from grade?",
        [("Quality is conformance to requirements; grade is the level of "
          "features", True),
         ("Quality applies to the delivered product while grade applies "
          "to the process producing it", False),
         ("Quality is measured objectively and grade "
          "subjectively", False),
         ("Quality is set by the customer and grade by the "
          "project", False)],
        "A basic product that works reliably is low grade and high quality, "
        "which is frequently exactly right. A luxurious product that fails is "
        "high grade and low quality, which never is. Confusing the two "
        "produces arguments in which neither party is wrong, because they are "
        "discussing different properties."),

    mcq("AVERAGE",
        "Quality assurance examines one thing specifically.\n\n"
        "Which?",
        [("The process, asking whether the right activities are being "
          "performed", True),
         ("The delivered product, asking whether it meets the criteria "
          "agreed for it", False),
         ("The requirements, asking whether they were captured "
          "correctly", False),
         ("The schedule, asking whether quality activities were "
          "performed", False)],
        "Assurance is prevention-oriented and looks at how work is done -- "
        "audits, process reviews, standards compliance. Quality CONTROL "
        "examines deliverables and finds defects. The practical difference is "
        "that control corrects an instance while assurance corrects the cause "
        "producing defects across everything."),

    mcq("HARD",
        "Why can testing not produce quality?",
        [("It verifies quality; the activities producing it happen "
          "earlier", True),
         ("Testing cannot exercise every possible combination of inputs "
          "and conditions", False),
         ("Testing occurs too late in the schedule to affect "
          "outcomes", False),
         ("Testing is an appraisal cost rather than a prevention "
          "cost", False),
         ],
        "Testing a defective product more thoroughly produces a "
        "better-understood defective product. Quality is produced by the "
        "activities that prevent defects -- standards, training, reviews, "
        "good design -- and verified by the ones that find them. Conflating "
        "producing with verifying is why 'we will test it properly' is not a "
        "quality plan."),

    mcq("AVERAGE",
        "Which cost of quality category is typically the largest?",
        [("External failure", True),
         ("Prevention, since it applies throughout the project", False),
         ("Appraisal, since testing is labour-intensive", False),
         ("Internal failure, since most defects are found before "
          "delivery", False)],
        "External failure includes the rework, the support effort, the "
        "damage caused before anybody noticed, and the credibility lost -- "
        "which together dwarf the others. Prevention is cheap by comparison "
        "and is precisely what gets cut when a schedule tightens, which is "
        "the decision that increases the largest category."),

    mcq("HARD",
        "A measuring process produces consistent results that are all wrong "
        "by the same amount.\n\nHow is it described?",
        [("Precise but not accurate", True),
         ("Accurate but not precise", False),
         ("Neither precise nor accurate", False),
         ("Both, since the error is systematic and correctable", False)],
        "Precision is consistency between measurements and accuracy is "
        "closeness to the true value, so a consistently wrong result is "
        "precise and inaccurate. It is a recognisable and dangerous failure, "
        "because the consistency inspires confidence -- the results look "
        "reliable and are uniformly wrong."),

    mcq("AVERAGE",
        "What does a Pareto chart show?",
        [("That most defects arise from a small number of causes", True),
         ("Whether a process is varying within acceptable "
          "limits", False),
         ("The possible causes of a problem, organised by "
          "category", False),
         ("Whether two measured variables are related", False)],
        "Ordering defect causes by frequency reveals that a few account for "
        "most occurrences, which is where effort should be directed. A "
        "control chart distinguishes normal variation from a process out of "
        "control, a cause and effect diagram organises candidate causes, and "
        "a scatter diagram tests whether variables relate."),

    mcq("HARD",
        "A team adopts a process change believing it will help, without "
        "measuring the result.\n\nWhat is the risk?",
        [("The change may have made things worse, and is now an unexamined "
          "practice", True),
         ("The change cannot be reversed once the team has adopted it as "
          "standard practice", False),
         ("The team will not receive credit for the improvement", False),
         ("Process changes require formal approval before "
          "adoption", False)],
        "Checking the result against what was expected is what distinguishes "
        "improvement from change. Without it, a modification that made things "
        "worse becomes an established practice the organisation believes in "
        "-- which is harder to remove afterwards than the original problem "
        "was, because it now has advocates."),

    mcq("AVERAGE",
        "What does a control chart distinguish?",
        [("Normal process variation from a process genuinely out of "
          "control", True),
         ("Defects that were caused by people from those caused by tools "
          "or environment", False),
         ("The distribution of a measurement across its range", False),
         ("Conformance costs from non-conformance costs", False)],
        "Every process varies, and reacting to normal variation as though it "
        "signalled a problem produces interference that makes things worse. A "
        "control chart plots measurements against limits so that ordinary "
        "fluctuation is distinguished from a genuine change requiring action, "
        "which is what makes the response proportionate."),

    mcq("HARD",
        "Why does quality assurance address a different problem from quality "
        "control?",
        [("Control corrects an instance; assurance corrects the cause "
          "affecting everything", True),
         ("Control is performed by the project team while assurance is "
          "performed by an independent external auditor", False),
         ("Control applies to deliverables and assurance to "
          "documentation", False),
         ("Control occurs during execution and assurance during "
          "planning", False)],
        "Finding and fixing a defect improves one deliverable and leaves the "
        "process that produced it unchanged, so the next deliverable has the "
        "same defect. Assurance examines that process and corrects what is "
        "generating defects generally -- which is why a project doing only "
        "control keeps finding the same kinds of problem."),
]

LESSON_PM_QUAL = lesson(
    MAJOR, MIDDLE,
    "Project Quality Management",
    _qual_quiz,
    lesson_structure(
        "Project Quality Management",
        "Quality here means conformance to requirements and fitness for "
        "purpose rather than luxury -- which is why low GRADE can be entirely "
        "appropriate and low QUALITY never is. This lesson covers planning "
        "quality rather than inspecting it in, the cost of quality across "
        "prevention, appraisal and the two failure categories with external "
        "failure by far the largest, the assurance-against-control "
        "distinction between examining the PROCESS and examining the PRODUCT, "
        "the tools and what each question they answer, and the improvement "
        "cycle whose CHECK step is what separates improvement from change.",
        [
            "Distinguish quality from grade, and precision from accuracy",
            "Plan quality, separating what produces it from what verifies it",
            "Describe the four cost of quality categories",
            "Explain why cutting prevention raises total cost",
            "Distinguish quality assurance from quality control",
            "Select a quality tool for a stated question",
            "Apply the Pareto principle to defect causes",
            "Apply the improvement cycle and explain the check step",
        ],
        80,
        _qual_sections,
        [
            ("Quality",
             "Conformance to requirements and fitness for purpose. Low "
             "quality is never appropriate."),
            ("Grade",
             "The level of features or capability. Low grade is frequently "
             "exactly right."),
            ("Precision and accuracy",
             "Consistency between measurements, against closeness to the true "
             "value."),
            ("Cost of conformance",
             "Prevention and appraisal -- money spent deliberately to avoid "
             "and find defects."),
            ("Cost of non-conformance",
             "Internal and external failure -- money spent because defects "
             "occurred."),
            ("External failure",
             "The largest category, including the harm done before anybody "
             "noticed."),
            ("Quality assurance",
             "Examines the PROCESS. Prevention-oriented, and corrects causes "
             "affecting everything."),
            ("Quality control",
             "Examines the PRODUCT. Detection-oriented, and corrects "
             "instances."),
            ("Pareto principle",
             "Most defects arise from few causes, so effort belongs on "
             "those."),
            ("Improvement cycle",
             "Plan, do, check, act -- with CHECK being what separates "
             "improvement from mere change."),
        ],
        "Quality is conformance to requirements and fitness for purpose, "
        "which makes low GRADE a legitimate choice and low quality never one "
        "-- and precision is consistency while accuracy is correctness, so a "
        "consistently wrong measurement is precise and inaccurate. Quality is "
        "PLANNED rather than inspected in, and the activities that produce it "
        "are distinct from those that verify it: testing a defective product "
        "harder produces a better-understood defective product. Its cost "
        "divides into conformance -- prevention and appraisal, spent "
        "deliberately -- and non-conformance, internal and external failure, "
        "spent because something went wrong, with EXTERNAL failure by far the "
        "largest because it includes the damage done before anybody noticed. "
        "So cutting prevention under schedule pressure does not remove "
        "defects but removes what would have found them, and the saving is "
        "recovered several times over unplanned. Assurance examines the "
        "PROCESS and control examines the PRODUCT, which means control "
        "corrects an instance while assurance corrects the cause producing "
        "defects across everything. The tools each answer a specific "
        "question, with Pareto's finding -- most defects from few causes -- "
        "carrying the strongest practical consequence. And improvement is "
        "plan, do, CHECK, act, where omitting the check turns a change that "
        "may have made things worse into an established practice with "
        "advocates.",
        exam_notes=[
            desc(
                "Items describe a quality decision and ask its consequence, "
                "or ask which activity or tool applies."
            ),
            ul([
                "Predicting the cost effect of cutting quality effort.",
                "Distinguishing quality from grade.",
                "Distinguishing assurance from control.",
                "Explaining why testing does not produce quality.",
                "Identifying the largest cost of quality category.",
                "Selecting a quality tool for a question.",
                "Distinguishing precision from accuracy.",
            ]),
            desc(
                "For any item about reducing quality effort, trace where the "
                "defects go rather than where the saving is. They do not "
                "disappear -- they move to a stage where correcting them "
                "costs more, and the largest of those stages is after "
                "delivery."
            ),
        ],
    ))

LESSONS = [LESSON_PM_RISK, LESSON_PM_QUAL]
