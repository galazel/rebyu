"""IT Passport lesson content: System Strategy and System Planning (721-726)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[721] = lesson_structure(
    name="Information systems strategy",
    intro=(
        "Information systems strategy decides what systems an organisation should have "
        "and in what order, so that IT investment serves the business rather than "
        "accumulating by accident. This lesson covers how that strategy is formed, what "
        "enterprise architecture contributes, and how a portfolio is governed."
    ),
    objectives=[
        "Explain what information systems strategy decides.",
        "Describe the four domains of enterprise architecture.",
        "Explain why current and target states are both documented.",
        "Describe how an investment portfolio is prioritised.",
        "Explain the role of IT governance.",
        "Describe what legacy systems cost an organisation.",
    ],
    minutes=35,
    sections=[
        ("What the strategy decides", [
            desc(
                "Information systems strategy works at the portfolio level: which "
                "capabilities the organisation needs, which systems will provide them, "
                "and in what sequence. Individual system specifications follow from it."
            ),
            desc(
                "Without one, systems accumulate by local decision. Each is defensible "
                "on its own and the result is duplicated data, incompatible interfaces "
                "and no view of what anything costs in total."
            ),
        ]),
        ("Enterprise architecture", [
            desc(
                "Enterprise architecture describes the organisation across four domains, "
                "linked so that a technology decision can be traced back to the business "
                "capability it serves."
            ),
            table(
                ["Domain", "Describes", "Example question it answers"],
                [["Business", "Functions, processes, organisation", "What does the company actually do?"],
                 ["Data", "Information held and its relationships", "Where does customer data live?"],
                 ["Application", "The systems and how they interact", "What talks to what?"],
                 ["Technology", "Platforms, networks, infrastructure", "What does it run on?"]],
            ),
        ]),
        ("Current state, target state, gap", [
            desc(
                "Architecture documents where the organisation is and where it intends "
                "to be. The difference between them is the programme of work."
            ),
            ol([
                "Describe the current state honestly, including what is undocumented.",
                "Define the target state from business need.",
                "Identify the gap -- the capabilities missing or duplicated.",
                "Sequence the work, respecting dependencies.",
                "Re-baseline as delivery proceeds and circumstances change.",
            ]),
            desc(
                "A target with no baseline gives no route, and a baseline with no target "
                "gives no direction. Both are needed for individual projects to be "
                "judged as moving the organisation anywhere."
            ),
        ]),
        ("Prioritising investment", [
            desc(
                "There is always more that could be built than can be funded, so "
                "proposals are compared rather than approved individually."
            ),
            ul([
                "Strategic contribution -- does it serve a stated objective?",
                "Financial return -- payback, NPV, or avoided cost.",
                "Risk -- of the project, and of not doing it.",
                "Dependencies -- what must precede it.",
                "Capacity -- whether the organisation can absorb the change.",
            ]),
            desc(
                "The last is the one most often ignored. An organisation can fund more "
                "change than its people can absorb, and doing so delivers less than "
                "funding fewer things well."
            ),
        ]),
        ("IT governance", [
            compare_grid(
                "Governance and management",
                "Collapsing the distinction is how oversight quietly disappears.",
                [("Governance",
                  "Decides what should be done, who decides, and monitors conformance. "
                  "Sits with the board and executive."),
                 ("Management",
                  "Executes within that direction -- planning, building, running. Sits "
                  "with the IT function.")],
            ),
            desc(
                "Governance answers whether the organisation is investing in the right "
                "things and whether risk is being carried knowingly. Management answers "
                "whether the work is being done well."
            ),
        ]),
        ("Legacy systems", [
            desc(
                "A legacy system is one the organisation depends on and struggles to "
                "change. The problem is rarely age itself: it is lost knowledge, absent "
                "documentation, unsupported technology and accumulated undocumented "
                "behaviour."
            ),
            accordion([
                ("Keep and maintain", "Cheapest today; the cost and risk rise every year and skills become scarcer."),
                ("Re-host", "Move it to modern infrastructure unchanged. Reduces some risk, changes none of the design."),
                ("Refactor", "Improve the internals while preserving behaviour. Lower risk than a rewrite, and slower."),
                ("Replace", "Build or buy a successor. Highest risk, because the old system's real behaviour is usually undocumented."),
            ]),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("What is the gap analysis for?", "It defines the programme of work",
                 "Current state against target state."),
                ("Governance or management: deciding what to invest in?", "Governance",
                 "Management executes within that direction."),
                ("What makes a system 'legacy'?", "Depended upon and hard to change",
                 "Lost knowledge and unsupported technology, not age alone."),
                ("Most-ignored prioritisation factor?", "Capacity to absorb change",
                 "Funding more change than people can adopt delivers less."),
            ]),
        ]),
    ],
    key_terms=[
        ("IS strategy", "Portfolio-level decisions about which systems the business needs."),
        ("Enterprise architecture", "A description across business, data, application and technology domains."),
        ("Gap analysis", "The difference between current and target state, defining the work."),
        ("IT governance", "Deciding direction and decision rights, and monitoring conformance."),
        ("Legacy system", "A depended-upon system that is difficult and risky to change."),
        ("Portfolio", "The set of investments compared against one another for funding."),
    ],
    summary=(
        "Information systems strategy decides which capabilities are needed and in what "
        "order, preventing systems from accumulating by local decision. Enterprise "
        "architecture links business, data, application and technology so decisions can "
        "be traced to purpose, and the gap between documented current and target states "
        "defines the programme. Investments are prioritised on contribution, return, "
        "risk, dependency and the organisation's capacity to absorb change. Governance "
        "sets direction while management executes within it."
    ),
    exam_notes=[
        desc(
            "The governance-versus-management distinction is directly examined. "
            "Governance decides and monitors; management does."
        ),
        ul([
            "Gap = target minus current; it is the work programme.",
            "The four EA domains: business, data, application, technology.",
            "Legacy is about difficulty of change, not age.",
        ]),
    ],
)


LESSONS[722] = lesson_structure(
    name="Business process",
    intro=(
        "A business process is the sequence of activities that turns an input into "
        "something of value. This lesson covers how processes are modelled, analysed and "
        "improved, and the difference between improving a process and replacing it."
    ),
    objectives=[
        "Describe what a business process is and identify one.",
        "Read a simple process model.",
        "Distinguish BPR from continuous improvement.",
        "Explain what workflow automation and RPA contribute.",
        "Describe how a bottleneck is identified.",
        "Explain why process change is mostly organisational change.",
    ],
    minutes=35,
    sections=[
        ("What a process is", [
            desc(
                "A process has a trigger, a sequence of activities, decision points, and "
                "an outcome that somebody values. Order-to-cash, hire-to-retire and "
                "procure-to-pay are the standard examples."
            ),
            desc(
                "Processes cross departments, which is why they are often nobody's "
                "responsibility end to end. Each department optimises its own part, and "
                "the handovers between them are where the delay actually lives."
            ),
        ]),
        ("Modelling a process", [
            desc(
                "A model makes the process visible so it can be discussed. Notation "
                "matters less than consistency and honesty about what actually happens."
            ),
            accordion([
                ("Flowchart", "Activities and decisions connected by arrows. Simple and widely understood."),
                ("Swimlane diagram", "The same, divided by who performs each step. Makes handovers -- and their number -- obvious."),
                ("BPMN", "A standard notation with defined symbols for events, activities and gateways. Precise, and needs learning."),
                ("Data flow diagram", "Where information moves and where it rests, rather than who acts."),
            ]),
            desc(
                "Model the process as it IS before designing how it should be. Modelling "
                "the official version produces an improvement to a process nobody "
                "follows."
            ),
        ]),
        ("Improving or replacing", [
            compare_grid(
                "Two different ambitions",
                "Choosing between them is a decision about risk as much as about gain.",
                [("Continuous improvement (kaizen)",
                  "Many small changes by the people doing the work. Low risk, "
                  "cumulative, and bounded by the existing design."),
                 ("Business process reengineering",
                  "Redesigning the process from its purpose. Step-change gains, "
                  "substantial disruption, and a much higher failure rate.")],
            ),
            desc(
                "Reengineering is justified when the process's shape is the problem -- "
                "when no amount of tuning within the current design reaches the target."
            ),
        ]),
        ("Finding the constraint", [
            ol([
                "Measure how long each step takes, including waiting time.",
                "Find where work queues up; that is the bottleneck.",
                "Improve the bottleneck -- improving anything else changes nothing overall.",
                "Re-measure; the bottleneck will have moved.",
            ]),
            desc(
                "Waiting time is usually far larger than working time, and it sits at "
                "handovers. Measuring only the work misses most of the elapsed time and "
                "leads to optimising the wrong thing."
            ),
        ]),
        ("Automation", [
            desc(
                "Automation removes manual effort from a process, and works best when "
                "applied to a process that has already been simplified."
            ),
            table(
                ["Approach", "Suits", "Limitation"],
                [["Workflow system", "Routing and approvals between people", "Still requires the people"],
                 ["RPA", "Repetitive rule-based work across existing screens", "Breaks when the screens change"],
                 ["System integration", "Data moving between applications", "Needs interfaces to exist"],
                 ["AI assistance", "Classification and drafting from examples", "Needs labelled data and review"]],
            ),
            desc(
                "Automating a bad process makes the bad outcome arrive faster. "
                "Simplify first, then automate what remains."
            ),
        ]),
        ("Change is organisational", [
            desc(
                "Process change alters who does what, who decides, and sometimes whose "
                "job exists. Those are the reasons it succeeds or fails -- far more often "
                "than the technology."
            ),
            ul([
                "Involve the people doing the work; they know where it really breaks.",
                "Explain why, not only what -- compliance without understanding decays.",
                "Train before the change, not after complaints begin.",
                "Expect a temporary dip in performance and plan for it.",
                "Measure the outcome afterwards, not just delivery of the change.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Where is elapsed time usually lost?", "Waiting at handovers",
                 "Working time is often a small fraction of the total."),
                ("Improve a non-bottleneck step -- what happens?", "Nothing overall",
                 "Only the constraint limits throughput."),
                ("Model the process as it is, or as documented?", "As it is",
                 "Improving the official version fixes a process nobody follows."),
                ("Automate before or after simplifying?", "After",
                 "Automating a bad process delivers the bad outcome faster."),
            ]),
        ]),
    ],
    key_terms=[
        ("Business process", "A sequence of activities turning an input into something valued."),
        ("Swimlane diagram", "A process model divided by who performs each step."),
        ("Kaizen", "Continuous small improvement by the people doing the work."),
        ("BPR", "Redesigning a process from its purpose for step-change gain."),
        ("Bottleneck", "The step that limits the throughput of the whole process."),
        ("RPA", "Software automating repetitive rule-based work through existing interfaces."),
    ],
    summary=(
        "Processes cross departments, which is why handovers rather than activities hold "
        "most of the elapsed time. Modelling the process as it actually is precedes "
        "designing how it should be. Continuous improvement makes many small low-risk "
        "changes while reengineering redesigns from purpose for step-change gain at "
        "higher risk. Only the bottleneck limits throughput, so improving anything else "
        "achieves nothing, and automation should follow simplification rather than "
        "precede it."
    ),
    exam_notes=[
        desc(
            "The BPR-versus-kaizen distinction is examined by scale of change. Bottleneck "
            "questions reward recognising that non-constraint improvements do not help."
        ),
        ul([
            "Kaizen: small, continuous, low risk. BPR: fundamental redesign.",
            "Only the bottleneck limits throughput.",
            "Simplify, then automate.",
        ]),
    ],
)


LESSONS[723] = lesson_structure(
    name="Solution business",
    intro=(
        "Rather than building everything, organisations buy solutions and services. This "
        "lesson covers the models on offer -- cloud services, outsourcing, packaged "
        "software -- how responsibility divides in each, and how to decide between them."
    ),
    objectives=[
        "Distinguish SaaS, PaaS and IaaS by who manages what.",
        "Describe outsourcing models and what is retained.",
        "Compare building in-house against buying a package.",
        "Explain the shared responsibility model.",
        "Describe vendor lock-in and how to limit it.",
        "Explain what a service level agreement commits to.",
    ],
    minutes=35,
    sections=[
        ("Cloud service models", [
            desc(
                "The three models differ in how far up the stack the provider's "
                "responsibility reaches. Misreading that boundary is the most expensive "
                "error in cloud adoption."
            ),
            table(
                ["Model", "Provider manages", "You manage"],
                [["SaaS", "Everything technical", "Your data, users and configuration"],
                 ["PaaS", "Platform, runtime, OS, hardware", "Your application and data"],
                 ["IaaS", "Hardware and virtualisation only", "Guest OS upward -- including patching"]],
                caption="Under IaaS, patching the guest operating system is YOUR responsibility.",
            ),
            desc(
                "In every model the customer remains responsible for their own data, "
                "for who has access to it, and for meeting their own legal obligations. "
                "That does not move to the provider under any of them."
            ),
        ]),
        ("Deployment models", [
            accordion([
                ("Public cloud", "Shared infrastructure operated by a provider. Elastic and economical; isolation is the provider's responsibility."),
                ("Private cloud", "Dedicated to one organisation. More control and cost; elasticity limited by what was bought."),
                ("Hybrid", "Both, with workloads placed according to sensitivity or economics. Integration is the difficulty."),
                ("Multi-cloud", "Several providers, to avoid dependence on one. Reduces lock-in and multiplies operational complexity."),
            ]),
        ]),
        ("Outsourcing", [
            desc(
                "Outsourcing contracts an activity to a provider. It works when the "
                "activity is necessary but not a source of competitive advantage."
            ),
            ul([
                "Full outsourcing -- an entire function transfers.",
                "Selective -- specific services, retaining the rest.",
                "Offshoring -- performed in another country; a location choice, not an ownership one.",
                "Managed service -- the provider operates and is measured against agreed levels.",
            ]),
            desc(
                "What must be retained in every case is the capability to specify what "
                "is wanted, to measure whether it was delivered, and to govern the "
                "relationship. An organisation that loses that is at the mercy of "
                "whatever it is given."
            ),
        ]),
        ("Build or buy", [
            compare_grid(
                "Two routes to a system",
                "The question is whether the process differentiates you.",
                [("Build in-house",
                  "Fits exactly, and you own it. Justified where the process is a "
                  "genuine source of advantage. Costs continue after delivery."),
                 ("Buy a package",
                  "Faster and cheaper to acquire, with the vendor maintaining it. "
                  "Requires adapting to how the package works, and heavy customisation "
                  "makes every upgrade expensive.")],
            ),
            desc(
                "The underestimated cost of buying is never the licence. It is "
                "integration, data migration, configuration and change management, which "
                "routinely exceed it."
            ),
        ]),
        ("Lock-in", [
            desc(
                "Lock-in is the cost of leaving. It accumulates through proprietary "
                "features, accumulated data and staff skills, and it becomes visible at "
                "renewal -- when the alternative to accepting terms is an expensive "
                "migration."
            ),
            ol([
                "Prefer open standards and portable formats where the trade is reasonable.",
                "Keep your data exportable, and test the export before you need it.",
                "Agree exit assistance in the contract at the start, when you have leverage.",
                "Understand what leaving would actually cost before signing.",
            ]),
        ]),
        ("Service level agreements", [
            desc(
                "An SLA states the service targets, how they are measured, and what "
                "happens when they are missed. Without measurable targets it is a "
                "statement of intent."
            ),
            ul([
                "Availability, stated as a percentage over a defined period.",
                "Response and resolution times, usually by severity.",
                "How performance is measured and reported, and by whom.",
                "Remedies -- usually service credits, which rarely cover actual loss.",
                "Exclusions, which deserve more reading than the targets.",
            ]),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Who patches the guest OS on IaaS?", "The customer",
                 "The provider manages hardware and virtualisation only."),
                ("What must be retained when outsourcing?", "The ability to specify and govern",
                 "Otherwise you cannot judge what you are receiving."),
                ("Biggest underestimated cost of a package?", "Integration and migration",
                 "The licence fee is rarely the largest component."),
                ("When is lock-in felt?", "At renewal",
                 "When the alternative to accepting terms is an expensive migration."),
            ]),
        ]),
    ],
    key_terms=[
        ("SaaS", "Finished software consumed as a service."),
        ("IaaS", "Rented infrastructure; the customer manages the OS upward."),
        ("Shared responsibility", "The division of duties between provider and customer."),
        ("Outsourcing", "Contracting an activity to an external provider."),
        ("Vendor lock-in", "The accumulated cost of moving away from a supplier."),
        ("SLA", "Measurable service commitments with defined remedies."),
    ],
    summary=(
        "Cloud models divide responsibility differently, and under IaaS the customer "
        "patches the guest operating system; in every model the customer keeps "
        "responsibility for its own data and obligations. Outsourcing suits necessary "
        "non-differentiating activities and requires retaining the ability to specify "
        "and govern. Building suits processes that genuinely differentiate, while "
        "buying trades fit for speed, with integration rather than licensing dominating "
        "cost. Lock-in is the cost of leaving and is best limited before signing."
    ),
    exam_notes=[
        desc(
            "Shared responsibility is examined directly, most often as who patches what. "
            "Learn the three models as a ladder: SaaS least customer responsibility, "
            "IaaS most."
        ),
        ul([
            "IaaS: you patch the guest OS. SaaS: you manage data and users.",
            "Responsibility for your data never transfers to the provider.",
            "Negotiate exit terms while you still have leverage.",
        ]),
    ],
)


LESSONS[724] = lesson_structure(
    name="Computerization planning",
    intro=(
        "Before a system is built or bought, someone must establish that it is worth "
        "doing. This lesson covers the planning that precedes a project: defining the "
        "need, assessing feasibility, justifying the investment and deciding how to "
        "proceed."
    ),
    objectives=[
        "Describe what a computerisation plan contains.",
        "Explain the dimensions of a feasibility study.",
        "Build a business case around costs and benefits.",
        "Distinguish tangible from intangible benefits.",
        "Describe how risk is assessed at planning stage.",
        "Explain why benefits should be measured after delivery.",
    ],
    minutes=35,
    sections=[
        ("What planning decides", [
            desc(
                "Planning answers whether to proceed at all, and on what basis. It is "
                "the cheapest point at which to stop a bad idea, which is precisely its "
                "purpose."
            ),
            ul([
                "The business need and the objectives to be met.",
                "The scope -- what is included, and explicitly what is not.",
                "Options considered, including doing nothing.",
                "Costs, benefits and the basis for both.",
                "Risks and how they would be handled.",
                "How success will be judged, and when.",
            ]),
        ]),
        ("Feasibility", [
            desc(
                "Feasibility is assessed on several dimensions, and a proposal must pass "
                "all of them."
            ),
            accordion([
                ("Technical", "Can it be built with available technology and skills, at acceptable risk?"),
                ("Economic", "Do the benefits justify the cost, over a sensible horizon?"),
                ("Operational", "Will it fit how the organisation works, and will people actually use it?"),
                ("Schedule", "Can it be delivered in time to be useful?"),
                ("Legal", "Is it permissible -- data protection, licensing, sector regulation?"),
            ]),
            desc(
                "Operational feasibility is the one most often waved through, and it is "
                "where systems most often fail: technically sound, economically "
                "justified, and quietly unused."
            ),
        ]),
        ("The business case", [
            ol([
                "State the problem or opportunity in business terms.",
                "Identify options, including doing nothing as a genuine comparison.",
                "Estimate full costs over the life -- not the purchase price.",
                "Estimate benefits, separating the measurable from the claimed.",
                "Assess risk for each option.",
                "Recommend, with the reasoning visible.",
            ]),
            desc(
                "Including 'do nothing' matters: it is the baseline every other option "
                "is measured against, and sometimes it wins."
            ),
        ]),
        ("Benefits", [
            compare_grid(
                "Two kinds of benefit",
                "Both are real; only one can be put in a spreadsheet honestly.",
                [("Tangible",
                  "Measurable in money -- reduced cost, increased revenue, avoided "
                  "penalty. Verifiable after delivery."),
                 ("Intangible",
                  "Real and hard to quantify -- better decisions, improved morale, "
                  "reputation. Legitimate, and not to be given invented numbers.")],
            ),
            desc(
                "Attaching a fabricated figure to an intangible benefit makes the case "
                "look rigorous and makes it dishonest. State it as what it is."
            ),
        ]),
        ("Risk at planning stage", [
            table(
                ["Risk", "Typical cause", "Response"],
                [["Scope grows", "Unclear objectives", "Define scope and exclusions; change control"],
                 ["Benefits not realised", "Nobody owns them", "Assign a benefit owner and a review date"],
                 ["Estimate wrong", "Optimism; unknowns", "Ranges rather than points; contingency"],
                 ["Not adopted", "Users not involved", "Involve them from the start"],
                 ["Dependency slips", "External parties", "Identify early; agree dates in writing"]],
            ),
        ]),
        ("Measuring afterwards", [
            desc(
                "A benefit claimed in a business case and never measured afterwards is "
                "an assumption that funded a decision. Post-implementation review closes "
                "that loop."
            ),
            ol([
                "Record the baseline BEFORE the change; afterwards it cannot be reconstructed.",
                "Set a review date at approval, not after go-live.",
                "Measure the benefits that were claimed, not more convenient ones.",
                "Record what was learned, including where estimates were wrong.",
            ]),
            desc(
                "Organisations that do this estimate better over time. Those that do not "
                "repeat the same optimism indefinitely, because nothing ever contradicts "
                "it."
            ),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Which feasibility dimension is most often skipped?", "Operational",
                 "Systems fail by being unused far more than by being unbuildable."),
                ("Why include 'do nothing'?", "It is the baseline",
                 "Every option is measured against it, and sometimes it wins."),
                ("When must the baseline be recorded?", "Before the change",
                 "Afterwards it cannot be reconstructed honestly."),
                ("Intangible benefit -- put a number on it?", "No",
                 "State it as what it is rather than inventing a figure."),
            ]),
        ]),
    ],
    key_terms=[
        ("Feasibility study", "Assessment of whether a proposal is technically, economically, operationally, schedule and legally workable."),
        ("Business case", "The justification for an investment, comparing options including doing nothing."),
        ("Tangible benefit", "A benefit measurable in money."),
        ("Intangible benefit", "A real benefit that cannot honestly be quantified."),
        ("Baseline", "The measured position before a change, against which benefit is judged."),
        ("Post-implementation review", "Measuring after delivery whether claimed benefits appeared."),
    ],
    summary=(
        "Planning is the cheapest point at which to stop a bad idea. Feasibility is "
        "assessed technically, economically, operationally, on schedule and legally, "
        "and the operational dimension is where systems most often quietly fail. A "
        "business case compares options including doing nothing, over full life costs, "
        "separating tangible benefits from intangible ones without inventing figures. "
        "Baselines must be recorded before the change, and a post-implementation review "
        "is what turns claimed benefits into measured ones."
    ),
    exam_notes=[
        desc(
            "Feasibility questions give a concern and ask which dimension it belongs to. "
            "'People will not use it' is operational, not technical."
        ),
        ul([
            "Always compare against doing nothing.",
            "Record the baseline before, not after.",
            "Do not put invented numbers on intangible benefits.",
        ]),
    ],
)


LESSONS[725] = lesson_structure(
    name="Requirements definition",
    intro=(
        "Requirements definition establishes what a system must do, from the client's "
        "side, before anyone designs it. This lesson covers how requirements are "
        "gathered, written so they can be verified, prioritised and kept under control "
        "once agreed."
    ),
    objectives=[
        "Distinguish functional from non-functional requirements.",
        "Describe techniques for eliciting requirements.",
        "Write a requirement that can be tested.",
        "Prioritise requirements sensibly.",
        "Explain why requirements are baselined and change-controlled.",
        "Explain the cost of a requirements error found late.",
    ],
    minutes=40,
    sections=[
        ("Two kinds of requirement", [
            compare_grid(
                "What against how well",
                "Both bind, and the second is more often the reason a system is rejected.",
                [("Functional",
                  "What the system must do -- record an order, calculate tax, send a "
                  "confirmation."),
                 ("Non-functional",
                  "How well it must do it -- response time, availability, security, "
                  "capacity, usability, accessibility.")],
            ),
            desc(
                "A system that does everything asked, too slowly to use, has met its "
                "functional requirements and failed. Non-functional requirements are not "
                "secondary."
            ),
        ]),
        ("Eliciting requirements", [
            accordion([
                ("Interviews", "Depth and individual perspective. Slow, and people describe the official process rather than the real one."),
                ("Workshops", "Surface conflicts between groups early, where they can be resolved rather than discovered later."),
                ("Observation", "Shows what people actually do, including the workarounds they no longer notice."),
                ("Document analysis", "Existing forms and reports are evidence of real practice."),
                ("Prototyping", "Gives people something concrete to react to; abstract descriptions get agreed and then disputed."),
                ("Questionnaires", "Reach many people cheaply; poor for anything unanticipated."),
            ]),
            desc(
                "Use more than one. Each technique is blind in a different direction, "
                "and observation in particular catches what interviews cannot."
            ),
        ]),
        ("Writing a requirement", [
            desc(
                "A requirement is usable only if it is unambiguous and can be verified. "
                "The test: could two reasonable people disagree about whether it was "
                "met?"
            ),
            content_tabs(
                "Weak and strong statements",
                "The difference is measurability, not length.",
                [("Weak", "The system shall be fast",
                  "Unverifiable. Fast to whom, doing what, under what load?"),
                 ("Strong", "95% of searches return within 2 seconds at 500 concurrent users",
                  "Names the measure, threshold and conditions, so it can pass or fail."),
                 ("Weak", "The system should normally be available",
                  "Two faults: 'normally' is vague and 'should' leaves the obligation unclear."),
                 ("Strong", "Availability shall be at least 99.5% measured monthly, excluding agreed maintenance",
                  "Measurable, with the exclusion stated rather than assumed.")],
            ),
        ]),
        ("Prioritising", [
            desc(
                "Not everything can be delivered at once, and pretending otherwise means "
                "priorities get decided under pressure by whoever is loudest."
            ),
            table(
                ["Priority", "Meaning", "If not delivered"],
                [["Must have", "Without it the system is not viable", "No release"],
                 ["Should have", "Important, with a workaround available", "Painful but survivable"],
                 ["Could have", "Desirable if time permits", "Barely noticed"],
                 ["Won't have this time", "Explicitly out of scope for now", "Agreed and recorded"]],
                caption="The last category is the one teams refuse to populate, and it is the useful one.",
            ),
        ]),
        ("Baselining and change", [
            desc(
                "Once agreed, requirements are baselined: a fixed reference that changes "
                "only through change control. Without a baseline there is no meaningful "
                "notion of a change."
            ),
            ol([
                "Record the change requested and who asked for it.",
                "Assess the impact -- on design, code, tests, documents and other requirements.",
                "Decide with the authority to commit the cost and schedule it implies.",
                "Update the baseline and tell everybody affected.",
            ]),
            desc(
                "Change control does not forbid change. It ensures a change is accepted "
                "with its consequences understood rather than absorbed silently, which "
                "is how projects run late without anyone deciding to."
            ),
        ]),
        ("Why errors here cost most", [
            desc(
                "A misunderstanding caught during requirements is a conversation. The "
                "same misunderstanding caught at acceptance is a redesign, with all the "
                "work built on it to revise."
            ),
            desc(
                "This is why validation -- checking these are the RIGHT requirements, "
                "with the people who will use the system -- matters more than any later "
                "quality activity. Testing can only check what was specified."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("'Response within 2 seconds' -- which kind?", "Non-functional",
                 "It constrains how well, not what the system does."),
                ("Which technique catches unnoticed workarounds?", "Observation",
                 "People describe the official process in interviews."),
                ("Which MoSCoW category is usually refused?", "Won't have",
                 "Naming what will not be delivered is the useful part."),
                ("Why is a late requirements error expensive?", "Work built on it must be revised",
                 "Design, code, tests and documents all follow from it."),
            ]),
        ]),
    ],
    key_terms=[
        ("Functional requirement", "What the system must do."),
        ("Non-functional requirement", "How well it must do it -- performance, availability, security."),
        ("Elicitation", "Gathering requirements from stakeholders and evidence."),
        ("Baseline", "An agreed fixed version of the requirements, changed only by control."),
        ("Change control", "Assessing and deciding changes with their consequences understood."),
        ("Validation", "Checking these are the right requirements, with those who will use the system."),
    ],
    summary=(
        "Functional requirements say what a system does and non-functional ones say how "
        "well, and the second are as binding as the first. Elicitation should combine "
        "techniques, because interviews capture the official process while observation "
        "captures the real one. A requirement must be unambiguous and verifiable, "
        "prioritisation must be willing to name what will not be delivered, and a "
        "baseline with change control keeps accepted change from being absorbed "
        "silently. Errors here cost most because everything later is built on them."
    ),
    exam_notes=[
        desc(
            "Expect a requirement statement and a question about whether it is "
            "functional or non-functional, or about why it cannot be tested."
        ),
        ul([
            "Performance, availability and security are non-functional.",
            "A requirement must be verifiable, or it can neither pass nor fail.",
            "Change control assesses impact; it does not forbid change.",
        ]),
    ],
)


LESSONS[726] = lesson_structure(
    name="Procurement planning and implementation",
    intro=(
        "Procurement is how an organisation buys systems and services. This lesson "
        "covers the sequence from market enquiry to contract, how suppliers are "
        "evaluated fairly, and what the resulting contract should settle."
    ),
    objectives=[
        "Distinguish RFI, RFP and RFQ and their sequence.",
        "Describe how evaluation criteria are set and used.",
        "Explain why criteria are fixed before proposals are opened.",
        "Describe what should be assessed beyond price.",
        "Explain key contract terms including acceptance.",
        "Describe how a supplier relationship is managed afterwards.",
    ],
    minutes=35,
    sections=[
        ("The sequence", [
            desc(
                "Each document asks a different question, and using them out of order "
                "produces answers that cannot be compared."
            ),
            table(
                ["Document", "Asks", "When"],
                [["RFI -- request for information", "What exists, roughly what it costs", "Early, before requirements are firm"],
                 ["RFP -- request for proposal", "How would you solve this, and for what price", "Once requirements are settled"],
                 ["RFQ -- request for quotation", "What is your price for exactly this", "When the specification is precise"]],
            ),
            desc(
                "Issuing an RFP before requirements are settled produces proposals to "
                "different problems, which cannot be scored against each other. That is "
                "what the RFI is for."
            ),
        ]),
        ("Evaluation criteria", [
            desc(
                "Criteria and their weightings are agreed and documented BEFORE "
                "proposals are opened."
            ),
            desc(
                "Setting them afterwards, even honestly, is indistinguishable from "
                "shaping them around a preferred bidder, and it makes the decision "
                "impossible to defend if challenged."
            ),
            ul([
                "Functional fit against the stated requirements.",
                "Technical suitability and compatibility with what exists.",
                "Total cost of ownership, not purchase price.",
                "Supplier capability -- references, comparable delivery, financial stability.",
                "Support arrangements and committed service levels.",
                "Risk, including dependence on the supplier's continued existence.",
            ]),
        ]),
        ("Evaluating fairly", [
            ol([
                "Score independently first, then discuss as a panel.",
                "Score against the criteria, not against an overall impression.",
                "Seek evidence -- references, demonstrations on your own data.",
                "Record the reasoning, not only the score.",
                "Treat every bidder to the same process and the same information.",
            ]),
            desc(
                "Independent scoring before discussion prevents one confident voice "
                "anchoring the panel, which is the point of having a panel at all."
            ),
        ]),
        ("Beyond price", [
            desc(
                "An unusually low bid is a signal rather than a bargain. It often means "
                "the scope was misunderstood, or that the price assumes change requests "
                "will follow."
            ),
            desc(
                "The cheapest bid from a supplier who will not survive the contract is "
                "the most expensive outcome available, which is why financial stability "
                "is assessed alongside capability."
            ),
        ]),
        ("The contract", [
            accordion([
                ("Scope and deliverables", "What is being supplied, in enough detail that 'delivered' is not a matter of opinion."),
                ("Acceptance criteria", "How it will be judged complete, and who judges. Vague acceptance is where disputes begin."),
                ("Price and payment", "Total, schedule, and what triggers each payment -- ideally milestones with evidence."),
                ("Service levels", "Measurable commitments with remedies, for anything ongoing."),
                ("Intellectual property", "Who owns what is created, and what licence the other party receives."),
                ("Exit and transition", "What happens at the end -- data return, assistance, and in what format."),
                ("Liability", "What each party is responsible for, and to what limit."),
            ]),
        ]),
        ("Afterwards", [
            desc(
                "A contract signed is the beginning of the relationship, not its "
                "conclusion. Most of the value or loss arrives during delivery."
            ),
            ul([
                "Verify progress against milestones and evidence, not reported percentages.",
                "Review service levels regularly against published actuals.",
                "Keep a route for issues that does not depend on goodwill.",
                "Plan renewal or exit well before the deadline, while alternatives still exist.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Which comes first, RFI or RFP?", "RFI",
                 "It gathers market information before requirements are firm."),
                ("When are criteria fixed?", "Before proposals are opened",
                 "Afterwards is indistinguishable from shaping them to a favourite."),
                ("What does an unusually low bid suggest?", "Misunderstood scope",
                 "Or a price assuming change requests will follow."),
                ("Which contract term prevents delivery disputes?", "Acceptance criteria",
                 "Vague acceptance is where disputes begin."),
            ]),
        ]),
    ],
    key_terms=[
        ("RFI", "A request for market information, issued before requirements are firm."),
        ("RFP", "A request for proposed solutions and prices against stated requirements."),
        ("RFQ", "A request for a price against a precise specification."),
        ("Evaluation criteria", "The agreed basis for comparing proposals, fixed in advance."),
        ("Acceptance criteria", "The conditions under which a deliverable is judged complete."),
        ("Exit provisions", "Contract terms covering data return and transition at the end."),
    ],
    summary=(
        "RFI, RFP and RFQ ask progressively more specific questions and must be used in "
        "that order for answers to be comparable. Evaluation criteria and weightings are "
        "fixed before proposals are opened, scored independently before discussion, and "
        "supported by evidence. Price alone is a poor basis, since an unusually low bid "
        "usually signals misunderstood scope or a change-request strategy. The contract "
        "must settle acceptance, service levels, intellectual property and exit, and "
        "the relationship then needs active management."
    ),
    exam_notes=[
        desc(
            "The RFI/RFP/RFQ sequence is examined directly. So is the requirement that "
            "criteria be set before proposals are seen."
        ),
        ul([
            "RFI explores, RFP asks for solutions, RFQ asks for a price.",
            "Fix criteria and weightings before opening anything.",
            "Assess supplier stability, not only the proposal.",
        ]),
    ],
)
