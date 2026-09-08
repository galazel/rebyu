"""Development Technology -> Software Development Management Techniques,
lessons 3 and 4.

Syllabus minor categories: development environment management, and
configuration management and change control.

Configuration management is the lesson the whole category quietly depends on,
since a baseline is what makes "what changed" answerable -- so it is treated
as the foundation of change control rather than as record-keeping.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Development Technology"
MIDDLE = "Software Development Management Techniques"

# ==========================================================================
# Lesson 3: Development environment management
# ==========================================================================

_env_sections = [
    ("What a Team Needs to Work", [
        desc(
            "Development requires an environment -- tools, machines, "
            "libraries and services -- and managing it deliberately is what "
            "keeps a team productive rather than intermittently blocked."
        ),
        image(fig("dev-environments")),
        table(
            ["Element", "Provides", "Fails as"],
            [["Development tools", "Editing, building, debugging",
              "Time lost to setup and inconsistency"],
             ["Version control", "History, and parallel work",
              "Lost work, and unanswerable questions"],
             ["Build automation", "Repeatable construction",
              "'It builds on my machine'"],
             ["Test environments", "Somewhere to prove changes",
              "Defects reaching production"],
             ["Shared services", "Databases, queues, dependencies",
              "One team's change blocking another"]],
            caption="Five elements of a development environment.",
            footer="Each row's third column is a recognisable daily "
                   "frustration rather than an abstraction, which is why "
                   "environment work is judged by how little anybody notices "
                   "it."),
    ]),

    ("Reproducible Environments", [
        desc(
            "The single most valuable property is that everybody's "
            "environment is the same, and stays the same."
        ),
        desc(
            "'It works on my machine' is a statement that two environments "
            "differ in a way nobody recorded. Every such difference is a "
            "potential defect that testing cannot find, since the tests ran "
            "somewhere else."
        ),
        ul([
            "Specify the environment as a file under version control rather "
            "than as setup instructions somebody follows.",
            "Pin the versions of tools and dependencies, since 'the latest' "
            "means different things on different days.",
            "Build the environment automatically, so recreating it is a "
            "command rather than a day.",
            "Include the environment definition in the same repository as the "
            "code it builds, so the two change together.",
        ]),
        desc(
            "Version PINNING is the item examined most often. An unpinned "
            "dependency means a build that succeeded yesterday can fail today "
            "with no change to the code -- and worse, can succeed while "
            "producing something subtly different."
        ),
    ]),

    ("Build Automation", [
        desc(
            "A build turns source into something runnable, and automating it "
            "removes a whole class of variation."
        ),
        image(fig("build-pipeline")),
        ol([
            "Fetch the source at a known version.",
            "Fetch the pinned dependencies.",
            "Compile or assemble the artefact.",
            "Run the automated tests.",
            "Produce a versioned, identifiable output.",
        ]),
        desc(
            "Step five is what connects the build to everything else. An "
            "artefact that carries its version can be traced to the source "
            "that produced it -- so the question 'what is actually running in "
            "production' has an answer, which it otherwise does not."
        ),
        desc(
            "A build should also be REPEATABLE: building the same source "
            "twice should produce the same result. Where it does not, "
            "something unrecorded is influencing the outcome, and that "
            "something will eventually differ between the tested artefact and "
            "the deployed one."
        ),
    ]),

    ("Continuous Integration", [
        desc(
            "Build automation becomes far more valuable when it runs on every "
            "change rather than on request."
        ),
        image(fig("branching-merge")),
        desc(
            "Each change is merged into the mainline and the whole build and "
            "test suite runs automatically. A failure is therefore detected "
            "within minutes and attributed to one small change -- rather than "
            "at the end of a phase, when several changes together broke "
            "something and nobody can say which."
        ),
        table(
            ["Practice", "Prevents"],
            [["Integrate at least daily",
              "A merge whose conflicts accumulated for weeks"],
             ["Keep the mainline working",
              "A broken build blocking everybody else"],
             ["Fix a broken build first",
              "Failures accumulating until the signal is ignored"],
             ["Run the whole suite, not a subset",
              "A regression in the part that was skipped"]],
            caption="Four practices and what each prevents.",
            footer="The third row is a discipline rather than a tool "
                   "setting. A build left broken teaches everybody that a red "
                   "build is normal, and from that point the automation "
                   "reports nothing anybody acts on."),
    ]),

    ("Deployment Automation", [
        desc(
            "The same reasoning extends past the build: a deployment "
            "performed by hand is a deployment performed differently each "
            "time."
        ),
        ul([
            "Automated deployment is repeatable, so what reached production "
            "is what was tested.",
            "It is faster, which makes releasing more often affordable -- and "
            "smaller releases are less risky, not more.",
            "It is auditable, since what ran is recorded rather than "
            "remembered.",
            "It makes rollback a defined operation rather than an improvised "
            "one.",
        ]),
        desc(
            "The second point contains the counter-intuitive claim worth "
            "understanding. Releasing frequently reduces risk because each "
            "release contains less change, so a failure has fewer possible "
            "causes and less to undo -- whereas a large infrequent release "
            "concentrates risk into one event."
        ),
    ]),

    ("Managing Shared Resources", [
        desc(
            "Databases, test systems and third-party services are shared, and "
            "sharing produces its own class of problem."
        ),
        compare_grid(
            "SHARED AGAINST PRIVATE ENVIRONMENTS",
            "The trade is cost against interference.",
            [("Shared",
              ["Cheaper, and closer to production scale",
               "One team's change affects another's testing",
               "State from one test corrupts the next",
               "Contention for who may use it when"]),
             ("Private per developer or team",
              ["No interference, and no waiting",
               "More expensive, and often smaller",
               "May diverge from the shared configuration",
               "Made practical by automated provisioning"])]),
        desc(
            "Automated environment provisioning is what makes the right-hand "
            "column affordable. When creating an environment is a command "
            "rather than a request to another team, private environments stop "
            "being a luxury -- which is why environment automation and "
            "productivity are so closely linked."
        ),
    ]),

    ("Development Tools", [
        desc(
            "The syllabus expects the categories of tool a team uses and what "
            "each contributes."
        ),
        table(
            ["Tool", "Contributes", "Without it"],
            [["Integrated development environment",
              "Editing, navigation, immediate feedback",
              "Slower work, and more trivial errors"],
             ["Debugger", "Inspecting a running program's state",
              "Diagnosis by inserting print statements"],
             ["Static analyser", "Defects found without executing",
              "Whole classes of defect reach testing"],
             ["Profiler", "Where the time actually goes",
              "Performance work guided by guessing"],
             ["Issue tracker", "What is outstanding, and for whom",
              "Work remembered rather than recorded"]],
            caption="Five tool categories and the cost of omitting each.",
            footer="The PROFILER row is the one worth acting on. "
                   "Optimisation without measurement improves whatever the "
                   "developer assumed was slow, which is reliably not what "
                   "actually was."),
        desc(
            "Tools should be consistent across a team wherever the choice "
            "affects shared output -- formatting, static analysis, build "
            "behaviour -- and may be personal wherever it does not. That "
            "division avoids both inconsistent code and pointless arguments "
            "about editors."
        ),
    ]),

    ("Managing Dependencies", [
        desc(
            "Modern software is assembled from external components, and "
            "managing them is a continuing activity rather than a one-off "
            "choice."
        ),
        ol([
            "Choose deliberately: assess a component's maintenance activity, "
            "its licence and its own dependencies before adopting it.",
            "Pin the version, so the build depends on a specific thing rather "
            "than on whatever is current.",
            "Record what is included, down the whole tree, for both licence "
            "and vulnerability purposes.",
            "Update deliberately and regularly, since an unmaintained "
            "dependency accumulates known vulnerabilities.",
            "Be prepared to replace one, since components are abandoned by "
            "their authors without notice.",
        ]),
        desc(
            "Steps two and four are in tension and both are correct. Pinning "
            "gives repeatable builds and freezes known vulnerabilities in "
            "place; updating fixes those and risks behavioural change -- so "
            "the answer is deliberate scheduled updates rather than either "
            "extreme."
        ),
    ]),

    ("Environments as Code", [
        desc(
            "The practice that makes reproducibility achievable rather than "
            "aspirational."
        ),
        compare_grid(
            "DOCUMENTED SETUP AGAINST DEFINED SETUP",
            "Instructions somebody follows, against a file something "
            "executes.",
            [("Documented",
              ["A person reads and performs the steps",
               "Drifts from reality as things change",
               "Different people produce different results",
               "Errors are discovered later, somewhere else"]),
             ("Defined as code",
              ["A machine performs the steps identically",
               "Under version control, so it changes with the code",
               "Everybody gets the same environment",
               "Errors fail immediately and visibly"])]),
        desc(
            "The second column also makes environments DISPOSABLE, which "
            "changes how they are treated. An environment that can be "
            "recreated in minutes can be thrown away when it misbehaves, "
            "rather than repaired by somebody accumulating changes nobody "
            "records."
        ),
    ]),

    ("Measuring the Environment", [
        desc(
            "Environment problems are diffuse and easy to tolerate, so "
            "measuring them is what turns a persistent annoyance into a case "
            "for doing something."
        ),
        table(
            ["Measure", "Reveals"],
            [["Build duration", "How long feedback takes to arrive"],
             ["Build failure rate for environmental reasons",
              "How much unreliability the team absorbs"],
             ["Time from a change to it reaching production",
              "How much of the pipeline is waiting"],
             ["Time to create a working environment",
              "What a new joiner or a failed machine costs"],
             ["Frequency of deployment",
              "Whether releasing is cheap enough to do often"]],
            caption="Five measures of a development environment's health.",
            footer="BUILD DURATION deserves attention out of proportion to "
                   "its apparent importance. A build slow enough that people "
                   "avoid running it is a build whose feedback arrives after "
                   "the mistake has been built upon."),
        desc(
            "These are measures of a system rather than of people, which is "
            "what makes them safe to collect. A rising build time or a high "
            "environmental failure rate describes the tooling, and treating "
            "either as a productivity problem produces the wrong response "
            "entirely."
        ),
    ]),

    ("Onboarding a New Team Member", [
        desc(
            "How long it takes somebody new to make their first change is a "
            "direct measure of how well the environment is managed."
        ),
        ol([
            "Obtain access to the repositories, the tools and the systems -- "
            "which should be a defined request rather than a scavenger "
            "hunt.",
            "Create a working environment, which should be one automated "
            "command.",
            "Build the software successfully, which proves the environment is "
            "correct.",
            "Run the test suite, which proves it is complete.",
            "Make a small change and see it through the pipeline, which "
            "proves the whole path works.",
        ]),
        desc(
            "A team where this takes a week has a documented environment "
            "somebody follows; a team where it takes an hour has an automated "
            "one. The same difference determines what happens when an "
            "existing member's machine fails -- and one of those situations "
            "arrives without warning."
        ),
    ]),

    ("Secrets and Credentials", [
        desc(
            "Environments need passwords, keys and tokens, and how these are "
            "handled is where environment management meets security."
        ),
        ul([
            "Never place a secret in version control, since the history keeps "
            "it even after it is removed.",
            "Supply secrets to the environment at run time, from a store "
            "designed for the purpose.",
            "Give each environment its own secrets, so a development "
            "credential cannot reach production.",
            "Rotate them, and have a defined route for doing so when "
            "somebody leaves.",
            "Restrict who can read production secrets to those who must, "
            "which is least privilege applied here.",
        ]),
        desc(
            "The first point is the one people learn expensively. Removing a "
            "committed secret from the latest version does not remove it from "
            "the history, so the credential must be treated as compromised "
            "and rotated -- deletion is not remediation."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where environment items are lost."),
        ul([
            "Treating 'it works on my machine' as a personal failing rather "
            "than an unrecorded environment difference.",
            "Leaving dependency versions unpinned, so a build changes without "
            "the code changing.",
            "Documenting setup as instructions instead of automating it.",
            "Leaving a broken shared build, which teaches everybody to ignore "
            "the signal.",
            "Deploying by hand, so what reaches production is not quite what "
            "was tested.",
            "Assuming less frequent releases are safer, when each contains "
            "more change.",
            "Producing artefacts that cannot be traced to the source that "
            "built them.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A build that succeeded last week fails today, with no change "
            "to the source code. What is the most likely cause, and what "
            "prevents it?\""
        ),
        ol([
            "Note what is constant: the source, which is under version "
            "control and unchanged.",
            "So something outside the source has changed between the two "
            "builds.",
            "The usual candidates are a dependency resolving to a newer "
            "version, or a tool being updated on the build machine.",
            "Both are cases of the build depending on something that was "
            "never pinned to a specific version.",
            "The prevention is pinning every dependency and tool version, and "
            "defining the build environment as a versioned artefact rather "
            "than as the current state of a machine.",
        ]),
        desc(
            "The more serious form of this problem is the one that does not "
            "fail. An unpinned dependency can also resolve to a version that "
            "builds successfully and behaves slightly differently -- which "
            "produces a defect with no failing build to point at it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Environment management supports much of this category."),
        ul([
            "Automated tests from the construction lesson are what "
            "continuous integration runs.",
            "Environment differences are what the staging environment of the "
            "installation lesson exists to reduce.",
            "Traceable artefacts support the configuration management of the "
            "next lesson.",
            "Frequent small releases are the change management principle of "
            "Service Management.",
            "Dependency inventories serve the licence and vulnerability "
            "concerns of the previous lesson.",
            "Provisioning automation is the infrastructure-as-code idea in "
            "System Strategy.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What 'it works on my machine' means",
              "Two environments differ in a way nobody recorded",
              "Every such difference is a defect that testing cannot find."),
             ("Why versions are pinned",
              "So a build cannot change without the code changing",
              "And so it cannot silently produce something subtly "
              "different."),
             ("What continuous integration provides",
              "A failure attributed to one small change, within minutes",
              "Rather than several changes together breaking something at the "
              "end of a phase."),
             ("Why a broken build must be fixed first",
              "Otherwise a red build becomes normal and the signal is "
              "ignored",
              "It is a discipline rather than a tool setting."),
             ("Why frequent releases are less risky",
              "Each contains less change, so fewer causes and less to undo",
              "Infrequent releases concentrate risk into one event."),
             ("What makes private environments affordable",
              "Automated provisioning",
              "When creating one is a command rather than a request, they "
              "stop being a luxury.")]),
    ]),
]

_env_quiz = [
    mcq("HARD",
        "A build that succeeded last week fails today with no change to the "
        "source code.\n\nWhat is the most likely cause?",
        [("A dependency or tool resolved to a different version than "
          "before", True),
         ("The version control system returned an incomplete copy of the "
          "source", False),
         ("The build machine has insufficient resources for the "
          "current build", False),
         ("A test that is intermittently unreliable happened to fail "
          "today", False)],
        "The source is unchanged, so something outside it changed -- almost "
        "always a dependency resolving to a newer release, or a tool updated "
        "on the build machine. Pinning every version prevents it. The more "
        "dangerous form of the same problem is the build that still SUCCEEDS "
        "while producing something subtly different, since nothing then "
        "signals the change."),

    mcq("AVERAGE",
        "The phrase 'it works on my machine' points to something "
        "specific.\n\nWhat?",
        [("Two environments differ in a way nobody has recorded", True),
         ("The developer has not tested against the shared "
          "configuration", False),
         ("The test suite does not cover the failing behaviour", False),
         ("The build process depends on manual steps somebody "
          "skipped", False)],
        "The statement identifies a difference between environments rather "
        "than a personal failing, and every such difference is a potential "
        "defect that testing cannot find -- because the tests ran somewhere "
        "else. Defining the environment as a versioned, automatically built "
        "artefact is what removes the class of problem rather than the "
        "instance."),

    mcq("HARD",
        "Why does releasing more frequently reduce risk rather than increase "
        "it?",
        [("Each release contains less change, so a failure has fewer causes "
          "and less to undo", True),
         ("Frequent releases receive more thorough testing per "
          "release", False),
         ("Users become accustomed to changes and report problems "
          "sooner", False),
         ("Automated deployment removes the possibility of a failed "
          "release", False)],
        "A large infrequent release concentrates many changes into one event, "
        "so a failure could originate anywhere within it and rolling back "
        "removes everything. Smaller releases mean each failure has a small "
        "search space and a small rollback. It is the same reasoning as "
        "integrating frequently, applied one stage later."),

    mcq("AVERAGE",
        "Dependency versions are pinned for one principal "
        "reason.\n\nWhich?",
        [("So that a build cannot change unless the source changes", True),
         ("So that the smallest possible dependency set is "
          "downloaded", False),
         ("So that security updates are applied automatically", False),
         ("So that licence obligations remain constant over time", False)],
        "Unpinned dependencies mean 'the latest' resolves differently on "
        "different days, so a build's result depends on when it ran. Pinning "
        "makes the build a function of the source alone, which is what makes "
        "it repeatable. Security updates then require a deliberate version "
        "change -- which is the correct trade, since it is visible."),

    mcq("HARD",
        "In continuous integration, why must a broken mainline build be fixed "
        "before other work continues?",
        [("Otherwise a failing build becomes normal and the signal stops "
          "being acted on", True),
         ("Version control systems prevent further merges while the "
          "build fails", False),
         ("Broken builds consume the build server's capacity "
          "continuously", False),
         ("The failure cannot be diagnosed once further changes are "
          "merged", False)],
        "The value of automated integration is that a red build means "
        "something specific and recent. Leaving one broken teaches everybody "
        "that red is the normal state, and from that point the automation "
        "reports nothing anybody acts on -- so the discipline matters more "
        "than the tooling. Diagnosis does also get harder, which is the "
        "lesser reason."),

    mcq("AVERAGE",
        "Why should a build artefact carry a version identifying its source?",
        [("So that what is running in production can be traced to the code "
          "that produced it", True),
         ("So that older versions can be removed from the artefact "
          "store", False),
         ("So that the build server can detect duplicate builds", False),
         ("So that licence notices can be regenerated for each "
          "release", False)],
        "Without a traceable identifier, 'what is actually running' has no "
        "reliable answer, which makes diagnosing a production problem a "
        "matter of assumption. Traceability from artefact to source is also "
        "what configuration management depends on, since a baseline is "
        "meaningless if nobody can tell which build corresponds to it."),

    mcq("HARD",
        "Two teams share a test environment, and one team's test data "
        "corrupts the other's results.\n\nWhat makes private environments a "
        "practical alternative?",
        [("Automated provisioning, which makes creating one a command rather "
          "than a request", True),
         ("Reduced hardware costs, which make duplication "
          "affordable", False),
         ("Smaller test data sets, which fit within a single "
          "machine", False),
         ("Improved test isolation within the shared environment", False)],
        "Private environments remove interference and have always been "
        "desirable; what made them impractical was the cost and delay of "
        "creating them. When an environment is defined as code and built "
        "automatically, creating one is quick and repeatable -- which is why "
        "environment automation and team productivity are so closely "
        "connected."),

    mcq("AVERAGE",
        "What does a repeatable build mean?",
        [("Building the same source twice produces the same result", True),
         ("The build can be run without manual intervention", False),
         ("The build runs identically on every developer's machine", False),
         ("A failed build can be restarted from where it stopped", False)],
        "If the same source produces different results, something unrecorded "
        "is influencing the outcome -- and that something will eventually "
        "differ between the artefact that was tested and the one that is "
        "deployed. Automation and portability are related properties and "
        "neither is what repeatability specifically means."),

    mcq("HARD",
        "Why should the environment definition live in the same repository as "
        "the code it builds?",
        [("So the two change together and any version of the code has its "
          "matching environment", True),
         ("So that access permissions apply consistently to both", False),
         ("So that the build server only needs to fetch one "
          "repository", False),
         ("So that the environment is covered by the same backup "
          "arrangements", False)],
        "Code and the environment it needs evolve together -- a new "
        "dependency, a new tool version -- so separating them means checking "
        "out an old version of the code without the environment that built "
        "it. Keeping them together makes any point in the history buildable, "
        "which is what a version history is for."),

    mcq("AVERAGE",
        "What does automated deployment provide that a careful manual process "
        "does not?",
        [("Repeatability, so what reaches production is what was "
          "tested", True),
         ("Assurance that the release contains no defects", False),
         ("Elimination of the need for a rollback plan", False),
         ("Confirmation that the target environment is correctly "
          "sized", False)],
        "A manual process is performed slightly differently each time, so the "
        "deployed system can differ from the tested one in ways nobody "
        "intended or recorded. Automation makes deployment a repeatable "
        "operation, and it also makes releasing cheap enough to do often, "
        "auditable, and gives rollback a defined procedure rather than an "
        "improvised one."),
]

LESSON_DEV_ENV = lesson(
    MAJOR, MIDDLE,
    "Development Environment Management",
    _env_quiz,
    lesson_structure(
        "Development Environment Management",
        "A development environment is judged by how little anybody notices "
        "it, and the property that matters most is that everybody's is the "
        "same and stays the same -- because 'it works on my machine' is a "
        "statement that two environments differ in a way nobody recorded, and "
        "every such difference is a defect testing cannot find. This lesson "
        "covers reproducible environments and version pinning, build "
        "automation and what makes a build repeatable and traceable, "
        "continuous integration as a discipline rather than a tool, "
        "deployment automation and why frequent small releases carry less "
        "risk than infrequent large ones, and the shared-resource problem "
        "that automated provisioning solves.",
        [
            "Describe the elements of a development environment and how each "
            "fails",
            "Explain what makes an environment reproducible",
            "Explain the purpose and effect of version pinning",
            "Describe an automated build and what makes it repeatable",
            "Explain what continuous integration provides and requires",
            "Explain why frequent releases reduce rather than increase risk",
            "Compare shared with private environments",
            "Explain why environment definitions belong with the code",
        ],
        75,
        _env_sections,
        [
            ("Reproducible environment",
             "Defined as a versioned file and built automatically, rather "
             "than as instructions somebody follows."),
            ("Version pinning",
             "Fixing dependency and tool versions, so a build changes only "
             "when the source does."),
            ("Repeatable build",
             "The same source produces the same result; otherwise something "
             "unrecorded is influencing it."),
            ("Traceable artefact",
             "Carries a version identifying the source that produced it, so "
             "'what is running' has an answer."),
            ("Continuous integration",
             "Every change merged and fully tested automatically, so failures "
             "are attributed to one small change."),
            ("Broken build discipline",
             "Fixing it before other work, because a normal red build is a "
             "signal nobody acts on."),
            ("Deployment automation",
             "Repeatable, auditable releases with defined rollback, making "
             "frequent small releases affordable."),
            ("Environment provisioning",
             "Creating an environment as a command, which is what makes "
             "private environments practical."),
        ],
        "A development environment is judged by how little it interferes, and "
        "its most valuable property is sameness -- 'it works on my machine' "
        "names an unrecorded difference between two environments, and every "
        "such difference is a defect that testing cannot find because the "
        "tests ran elsewhere. So environments are defined as versioned files "
        "and built automatically, with every dependency and tool PINNED, "
        "because an unpinned build can fail with no code change and, worse, "
        "can succeed while producing something subtly different. An automated "
        "build fetches known versions, produces a traceable artefact, and is "
        "REPEATABLE -- and where it is not, something unrecorded is "
        "influencing the result. Running it on every change is continuous "
        "integration, which attributes a failure to one small change within "
        "minutes, and which depends on the discipline of fixing a broken "
        "mainline immediately, since a normal red build is a signal nobody "
        "acts on. The same reasoning extends to deployment: automation makes "
        "what reaches production what was tested, and makes releasing often "
        "affordable -- which REDUCES risk, since each release contains less "
        "change and therefore fewer possible causes and less to undo. And "
        "automated provisioning is what turns private environments from a "
        "luxury into the default, removing the interference that shared ones "
        "produce.",
        exam_notes=[
            desc(
                "Items describe a build or deployment problem and ask for the "
                "cause or the preventive practice."
            ),
            ul([
                "Diagnosing a build that fails without a code change.",
                "Explaining what version pinning provides.",
                "Explaining why frequent releases are less risky.",
                "Explaining the discipline continuous integration requires.",
                "Explaining what artefact traceability supports.",
                "Comparing shared with private environments.",
                "Defining a repeatable build.",
            ]),
            desc(
                "When something changed without anybody changing it, look for "
                "what was never pinned. A build, an environment or a "
                "deployment that depends on the current state of a machine "
                "will eventually differ from the one that was tested, and "
                "that is the whole class of defect these practices remove."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Configuration management and change control
# ==========================================================================

_cm_sections = [
    ("Knowing What You Have", [
        desc(
            "Configuration management answers a question that sounds trivial "
            "and is not: what exactly makes up this system, in which "
            "versions, and what changed since last time?"
        ),
        image(fig("configuration-management")),
        desc(
            "Without an answer, nothing else in this category works. A defect "
            "cannot be attributed to a change, a release cannot be "
            "reproduced, and a rollback has no defined destination -- which "
            "is why this lesson underpins the rest."
        ),
        table(
            ["Activity", "Answers"],
            [["Identification", "What items are under control"],
             ["Version control", "What each item's history is"],
             ["Baselining", "What an approved, known state consists of"],
             ["Change control", "What may be changed, and by whose "
                                "authority"],
             ["Status accounting", "What version is where, right now"],
             ["Audit", "Whether the record matches reality"]],
            caption="Six activities, each answering a specific question.",
            footer="The last row is the one that gets skipped and the one "
                   "that makes the others trustworthy. A record nobody checks "
                   "against reality drifts, and a drifted record is believed "
                   "until something depends on it."),
    ]),

    ("Configuration Items", [
        desc(
            "Deciding WHAT is under control comes first, and it is broader "
            "than source code."
        ),
        ul([
            "Source code, obviously -- but also build scripts and "
            "environment definitions.",
            "Requirements, designs and test specifications, since a change to "
            "one implies changes elsewhere.",
            "Test cases and test data, or a result cannot be reproduced.",
            "Documentation, including the operational documentation the "
            "receiving teams depend on.",
            "Third-party components and their versions, which is the "
            "inventory the licence lesson also required.",
        ]),
        desc(
            "The principle is that anything needed to REPRODUCE a release "
            "belongs under control. Applying that test settles most arguments "
            "about what should be included, and it catches the items -- build "
            "scripts, environment definitions, test data -- that teams "
            "otherwise leave out."
        ),
    ]),

    ("Baselines", [
        desc(
            "A baseline is an approved configuration, recorded, that "
            "subsequent work proceeds from and changes are measured against."
        ),
        ol([
            "The items are identified and their versions fixed.",
            "The set is reviewed and approved by whoever is accountable.",
            "It becomes the reference: development, testing and planning all "
            "work from it.",
            "Changes are proposed against it, assessed, and approved or "
            "rejected.",
            "An approved change produces a new baseline, and everybody moves "
            "to it.",
        ]),
        desc(
            "Without a baseline, 'it changed' and 'it was always like that' "
            "cannot be distinguished, and neither claim can be settled. That "
            "is the practical value -- not control for its own sake, but "
            "having an answer to what was agreed and when."
        ),
        desc(
            "Baselines are typically taken at stage boundaries -- an approved "
            "requirements specification, an approved design, a released "
            "version -- which is why the stages of the earlier lessons and "
            "the baselines here line up."
        ),
    ]),

    ("Version Control", [
        desc(
            "The mechanism most of this rests on: a recorded history of every "
            "change to every item."
        ),
        table(
            ["Provides", "Which means"],
            [["A history of every change",
              "What changed, when, by whom, and why"],
             ["The ability to retrieve any past version",
              "A release can be reproduced or a change undone"],
             ["Parallel work through branches",
              "People can work without blocking each other"],
             ["Merging", "Parallel work is brought back together"],
             ["Tagging", "A meaningful name for a specific state"]],
            caption="Five capabilities and what each is used for.",
            footer="The 'why' in the first row is the part that depends on "
                   "people. A commit message explaining the reason is the "
                   "only place that reasoning survives, and it is read by "
                   "somebody diagnosing a problem years later."),
        desc(
            "A commit should be one logical change. Bundling several "
            "unrelated changes together means neither can be understood, "
            "reviewed or reverted independently -- which removes most of what "
            "the history was for."
        ),
    ]),

    ("Branching and Merging", [
        desc(
            "Parallel work requires isolation, and isolation has a cost paid "
            "at the merge."
        ),
        image(fig("branching-merge")),
        desc(
            "A branch is a copy that diverges. Every day it lives, more "
            "changes accumulate on both sides, and every one of them is a "
            "potential conflict resolved later by somebody reconstructing "
            "decisions they were not part of."
        ),
        compare_grid(
            "LONG-LIVED AGAINST SHORT-LIVED BRANCHES",
            "The same mechanism, used two ways.",
            [("Long-lived",
              ["Complete isolation while work proceeds",
               "Conflicts accumulate for the whole period",
               "The merge is a project of its own",
               "Integration problems are discovered at the end"]),
             ("Short-lived",
              ["Isolation for hours or days",
               "Few conflicts, each small",
               "Merging is routine",
               "Integration problems surface immediately"])]),
        desc(
            "This is the same argument continuous integration makes, at the "
            "level of the repository. The cost of a merge grows with how long "
            "the branch lived, so the cheapest strategy is integrating "
            "frequently rather than perfecting the merge process."
        ),
    ]),

    ("Change Control", [
        desc(
            "Once a baseline exists, changes to it are proposed rather than "
            "made -- which is what distinguishes control from record-keeping."
        ),
        ol([
            "A change is REQUESTED, and recorded with its reason and its "
            "requester.",
            "Its IMPACT is assessed: what must change, what must be retested, "
            "what it costs.",
            "It is DECIDED by somebody with the authority over priorities and "
            "budget.",
            "It is IMPLEMENTED, reviewed and tested to the normal standard.",
            "It is RELEASED, and the baseline and documentation are updated.",
        ]),
        desc(
            "Step two is the step whose absence defines uncontrolled change. "
            "Approving a change without knowing what it affects is approving "
            "an unknown, and the accumulation of such approvals is exactly "
            "the scope creep the requirements lesson described."
        ),
        desc(
            "A CHANGE CONTROL BOARD is the formal arrangement: a group with "
            "the authority to decide, meeting regularly enough not to become "
            "a bottleneck. The formality should match the stakes -- the same "
            "process for a typographical correction and a database "
            "restructuring serves neither."
        ),
    ]),

    ("Status Accounting and Audit", [
        desc(
            "The two activities that keep the rest honest, and the two most "
            "often neglected."
        ),
        table(
            ["Activity", "Answers", "Neglected because"],
            [["Status accounting", "Which version is where, right now",
              "It seems obvious until somebody needs it"],
             ["Configuration audit",
              "Does the recorded configuration match reality",
              "Nothing appears to be wrong until it is checked"]],
            caption="Two activities that produce no visible output until they "
                    "are needed.",
            footer="An unaudited configuration record drifts steadily from "
                   "reality, and the drift is invisible -- which means the "
                   "record is believed at exactly the moment when being wrong "
                   "matters most."),
        desc(
            "A FUNCTIONAL audit asks whether the system does what the "
            "configuration says it should; a PHYSICAL audit asks whether the "
            "items listed are the items present. The pair together is what "
            "makes 'we know what we have' a statement about reality rather "
            "than about a document."
        ),
    ]),

    ("Release Management", [
        desc(
            "A release is a baseline made available for use, and identifying "
            "them consistently is what lets everybody talk about the same "
            "thing."
        ),
        table(
            ["Element", "Purpose"],
            [["A version identifier", "Naming exactly what this is"],
             ["Release notes", "What changed, for those affected"],
             ["Known issues", "What is not fixed, stated rather than "
                              "discovered"],
             ["Installation and upgrade instructions",
              "How to move from a previous version"],
             ["A rollback route", "How to return if it goes wrong"]],
            caption="Five things a release comprises beyond the software.",
            footer="KNOWN ISSUES stated in advance is what separates an "
                   "informed user from a surprised one. The defects exist "
                   "either way, and only one version of that costs "
                   "credibility."),
        desc(
            "Version numbering should carry meaning. A convention "
            "distinguishing changes that break compatibility from those that "
            "do not lets everybody depending on the software know whether an "
            "upgrade is routine -- which is information the number can convey "
            "for free."
        ),
    ]),

    ("Emergency Changes", [
        desc(
            "Some changes cannot wait for the normal process, and how that is "
            "handled decides whether control survives it."
        ),
        ol([
            "Define in advance what qualifies as an emergency, so the "
            "category is not simply claimed.",
            "Define who may authorise one, and ensure somebody is always "
            "available.",
            "Make the change, with whatever review is possible in the time.",
            "Record it immediately afterwards, with the same detail the "
            "normal process would have captured.",
            "Take it through the normal assessment retrospectively, and fix "
            "anything the haste introduced.",
        ]),
        desc(
            "Step five is what prevents emergency handling becoming the "
            "route around control. Without a retrospective assessment, an "
            "emergency change is simply an unassessed change with a "
            "justification -- and a team that discovers this will find more "
            "emergencies."
        ),
    ]),

    ("Configuration Management in Operation", [
        desc(
            "The discipline continues after delivery, and what it controls "
            "widens."
        ),
        ul([
            "The deployed configuration -- which version of what runs on "
            "which machine -- which is status accounting in production.",
            "Infrastructure settings, which change more often than software "
            "and are recorded far less.",
            "The relationships between items, so the effect of changing one "
            "can be traced.",
            "The whole record must be kept current through operational "
            "changes, not only through development ones.",
        ]),
        desc(
            "Infrastructure is where the record is weakest, because a "
            "configuration change made to resolve an incident at three in the "
            "morning is exactly the change least likely to be recorded -- and "
            "exactly the one that explains why an environment behaves "
            "differently six months later."
        ),
    ]),

    ("Traceability End to End", [
        desc(
            "The threads this category has developed separately join here, "
            "and the join is what makes several questions answerable."
        ),
        compare_grid(
            "WHAT END-TO-END TRACEABILITY ANSWERS",
            "Following the chain in either direction.",
            [("Forwards, from a requirement",
              ["Which design elements implement it",
               "Which code realises those",
               "Which tests cover it",
               "Which release contains it"]),
             ("Backwards, from running code",
              ["Which source version produced this artefact",
               "Which change requests altered it",
               "Which requirement justified it",
               "Who asked for it, and why"])]),
        desc(
            "Neither direction is achievable retrospectively, which is the "
            "recurring point of this lesson. Each link is cheap to record as "
            "it is created and effectively impossible to reconstruct once the "
            "people and the context have moved on."
        ),
    ]),

    ("What Goes Wrong Without It", [
        desc(
            "The value of configuration management is easiest to see through "
            "the specific failures its absence produces."
        ),
        table(
            ["Symptom", "Missing activity"],
            [["Nobody can say what is running in production",
              "Status accounting"],
             ["A release cannot be reproduced",
              "Identification, and baselining"],
             ["A defect cannot be attributed to a change",
              "Version control discipline"],
             ["Two people's changes overwrite each other",
              "Version control, used properly"],
             ["An approved change breaks something unrelated",
              "Impact assessment within change control"],
             ["The documented system differs from the real one",
              "Configuration audit"]],
            caption="Six recognisable symptoms and what each points to.",
            footer="Reading the table backwards is how examination items are "
                   "answered: given the symptom, name the activity that would "
                   "have prevented it."),
        desc(
            "The symptoms are recognisable because they are common, and they "
            "are common because every one of the activities produces no "
            "visible benefit until the moment it is needed -- which is a "
            "difficult thing to fund and an easy thing to defer."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where configuration management items are lost."),
        ul([
            "Placing only source code under control, leaving build scripts, "
            "environment definitions and test data out.",
            "Approving changes without impact assessment, which is scope "
            "creep by another name.",
            "Maintaining long-lived branches and treating the resulting merge "
            "as unavoidable.",
            "Bundling unrelated changes into one commit, so neither can be "
            "reviewed or reverted.",
            "Recording what changed without why, which is the part a future "
            "maintainer needs.",
            "Never auditing the configuration record, so it drifts "
            "invisibly.",
            "Applying identical formality to trivial and major changes.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A production defect must be fixed, and nobody can determine "
            "which version of the source produced the running system. What "
            "configuration management activities were missing?\""
        ),
        ol([
            "The immediate gap is STATUS ACCOUNTING: knowing which version is "
            "deployed where.",
            "That depends on artefacts being traceable to the source that "
            "built them, which is the build discipline of the previous "
            "lesson.",
            "It also depends on releases being made from identified "
            "baselines rather than from whatever was current.",
            "The consequence is severe: the fix cannot be developed against "
            "the right code, and cannot be confirmed to apply to what is "
            "running.",
            "The remedy is tagging each release, deploying only traceable "
            "artefacts, and recording what was deployed where -- none of "
            "which helps retrospectively, which is the point.",
        ]),
        desc(
            "Step five is worth emphasising. Configuration management "
            "produces no visible benefit until the moment it is needed, at "
            "which point it cannot be established retrospectively -- which is "
            "exactly why it is neglected and exactly why that neglect is "
            "expensive."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Configuration management underpins the whole category."),
        ul([
            "Baselines were introduced for requirements and design in the "
            "earlier lessons.",
            "Traceable artefacts come from the build discipline of the "
            "previous lesson.",
            "Impact assessment depends on the traceability of the "
            "requirements lesson.",
            "Change control is the same process the maintenance lesson "
            "applies to change requests.",
            "Release and rollback are Service Management change management.",
            "Configuration audit is the evidence System Audit examines.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What belongs under configuration control",
              "Anything needed to REPRODUCE a release",
              "Which catches build scripts, environment definitions and test "
              "data that teams leave out."),
             ("What a baseline provides",
              "An answer to what was agreed, and when",
              "Without one, 'it changed' and 'it was always that' cannot be "
              "distinguished."),
             ("What defines uncontrolled change",
              "Approval without impact assessment",
              "Approving a change without knowing what it affects is "
              "approving an unknown."),
             ("Why short-lived branches are preferred",
              "Merge cost grows with how long the branch lived",
              "So integrating frequently is cheaper than perfecting the merge "
              "process."),
             ("What status accounting answers",
              "Which version is where, right now",
              "It seems obvious until a production defect needs the source "
              "that produced the running system."),
             ("Why configuration audit matters",
              "An unchecked record drifts invisibly",
              "And is then believed at exactly the moment being wrong matters "
              "most.")]),
    ]),
]

_cm_quiz = [
    mcq("HARD",
        "A production defect must be fixed, and nobody can determine which "
        "source version produced the running system.\n\n"
        "Which activity was missing?",
        [("Status accounting -- recording which version is deployed "
          "where", True),
         ("Configuration identification -- deciding which items are "
          "controlled", False),
         ("Change control -- assessing and approving changes to the "
          "baseline", False),
         ("Configuration audit -- checking the record against "
          "reality", False),
         ],
        "Status accounting answers which version is where, and its absence "
        "means the fix cannot be developed against the right code or "
        "confirmed to apply to what is running. It depends on traceable "
        "artefacts and on releasing from identified baselines -- and none of "
        "it can be established retrospectively, which is precisely why the "
        "neglect is expensive."),

    mcq("AVERAGE",
        "One test settles whether something belongs under configuration "
        "control.\n\nWhich?",
        [("Whether it is needed to reproduce a release", True),
         ("Whether it is modified by more than one person", False),
         ("Whether it is delivered to the customer", False),
         ("Whether it is stored in text rather than binary form", False)],
        "Anything required to rebuild and redeploy a given release belongs "
        "under control, which settles most arguments and catches exactly the "
        "items teams leave out -- build scripts, environment definitions, "
        "test data. Restricting control to what is delivered omits the things "
        "that make the delivery reproducible."),

    mcq("HARD",
        "The cost of merging grows with how long a branch has "
        "existed.\n\nWhat causes that?",
        [("Changes accumulate on both sides, each a potential conflict "
          "resolved out of context", True),
         ("Version control systems store older branches less "
          "efficiently", False),
         ("The original author becomes less available as time "
          "passes", False),
         ("Automated merge tools are less effective on larger "
          "files", False)],
        "Both the branch and the mainline continue changing, so divergence "
        "grows daily and every conflict must be resolved by somebody "
        "reconstructing decisions they were not part of. This is the same "
        "argument continuous integration makes, applied to the repository -- "
        "which is why integrating frequently beats perfecting the merge "
        "process."),

    mcq("AVERAGE",
        "Change control differs from simply recording changes in one "
        "respect.\n\nWhich?",
        [("Changes are proposed and assessed before being made", True),
         ("Changes are recorded with the reason as well as the "
          "content", False),
         ("Changes are grouped into releases rather than applied "
          "individually", False),
         ("Changes are reviewed by somebody other than their "
          "author", False)],
        "Control means a change is requested, its impact assessed, and a "
        "decision taken by somebody with authority BEFORE the change is made. "
        "Recording what happened afterwards is status accounting, which is "
        "valuable and different. Approving without assessing impact is "
        "approving an unknown, and accumulating such approvals is scope creep "
        "by another name."),

    mcq("HARD",
        "Why is a configuration audit necessary when the configuration record "
        "is maintained carefully?",
        [("Records drift from reality invisibly, and are believed until "
          "checked", True),
         ("Auditors require independent confirmation for compliance "
          "purposes", False),
         ("The audit produces the status accounting reports management "
          "needs", False),
         ("Version control systems cannot detect manual changes to "
          "files", False),
         ],
        "Nothing signals that a record has diverged from what is actually "
        "there -- a change applied directly, an item removed, a version "
        "differing -- so the drift accumulates and the record continues to be "
        "trusted. The audit is what makes 'we know what we have' a statement "
        "about reality rather than about a document."),

    mcq("AVERAGE",
        "One commit should contain one logical change.\n\nOn what "
        "grounds?",
        [("So it can be understood, reviewed and reverted "
          "independently", True),
         ("So the version control repository remains smaller", False),
         ("So the build system can process changes more quickly", False),
         ("So each change can be assigned to a single author", False)],
        "Bundling unrelated changes means none of them can be reviewed on its "
        "own merits, and reverting one requires disentangling it from the "
        "others -- which removes most of what the history was for. The "
        "history's value is that each entry is a comprehensible unit with a "
        "reason attached."),

    mcq("AVERAGE",
        "What does a baseline provide that makes it worth the formality?",
        [("An answer to what was agreed and when", True),
         ("A guarantee that no further changes will be requested", False),
         ("A point at which the project may be considered "
          "complete", False),
         ("A record of who performed each item of work", False)],
        "Without a recorded approved state, 'it changed' and 'it was always "
        "like that' cannot be distinguished and neither claim can be settled. "
        "The value is having a reference rather than exercising control for "
        "its own sake -- and every subsequent change is assessed against that "
        "reference, which is what makes assessment possible at all."),

    mcq("HARD",
        "A team applies the same formal change control process to a "
        "typographical correction and a database restructuring.\n\n"
        "What is the problem?",
        [("Formality disproportionate to the stakes serves neither "
          "change", True),
         ("The change control board lacks the authority to approve "
          "either", False),
         ("Typographical corrections should not be recorded as "
          "changes", False),
         ("Database changes require a separate approval process by "
          "regulation", False)],
        "Heavy process on a trivial change wastes effort and encourages "
        "people to bypass it; the same process may be too light for a "
        "restructuring that affects everything. Matching formality to stakes "
        "is what keeps a change process used rather than circumvented, and "
        "circumvention is how control is actually lost."),

    mcq("AVERAGE",
        "What does a physical configuration audit check?",
        [("That the items listed in the record are the items actually "
          "present", True),
         ("That the system performs the functions its configuration "
          "specifies", False),
         ("That physical access to the configuration store is "
          "controlled", False),
         ("That hardware configurations match their documented "
          "specifications", False)],
        "A physical audit compares the recorded inventory against what exists; "
        "a FUNCTIONAL audit asks whether the system does what the "
        "configuration says it should. Together they confirm that the record "
        "describes reality in both respects, which is what makes the record "
        "usable for anything that depends on it."),

    mcq("HARD",
        "Why is the reason for a change more valuable in the history than the "
        "content of the change?",
        [("The content is visible in the change itself; the reason exists "
          "nowhere else", True),
         ("Reasons are required for regulatory traceability while content "
          "is not", False),
         ("Content can be reconstructed from the affected files if "
          "necessary", False),
         ("Reasons determine which release the change belongs to", False)],
        "What changed can always be read from the change itself. WHY it "
        "changed exists only if somebody wrote it down, and it is exactly "
        "what a maintainer diagnosing a problem years later needs -- and "
        "cannot ask about, since the author has gone. It is the same argument "
        "the construction lesson makes about comments."),
]

LESSON_DEV_CM = lesson(
    MAJOR, MIDDLE,
    "Configuration Management and Change Control",
    _cm_quiz,
    lesson_structure(
        "Configuration Management and Change Control",
        "Configuration management answers a question that sounds trivial and "
        "is not -- what exactly makes up this system, in which versions, and "
        "what changed -- and without an answer nothing else in this category "
        "works, since a defect cannot be attributed, a release cannot be "
        "reproduced and a rollback has no destination. This lesson covers the "
        "six activities and what each answers, what belongs under control "
        "(anything needed to REPRODUCE a release), baselines as the reference "
        "every change is measured against, version control and branching with "
        "the merge cost that grows daily, change control as proposal and "
        "assessment rather than record-keeping, and the audit that keeps the "
        "record honest.",
        [
            "State the six configuration management activities and what each "
            "answers",
            "Apply the test for what belongs under configuration control",
            "Explain what a baseline provides and when baselines are taken",
            "Describe version control's capabilities and good commit practice",
            "Explain why merge cost grows with branch lifetime",
            "Distinguish change control from recording changes",
            "Explain status accounting and its consequences when absent",
            "Distinguish functional from physical configuration audit",
        ],
        80,
        _cm_sections,
        [
            ("Configuration identification",
             "Deciding which items are under control -- anything needed to "
             "reproduce a release."),
            ("Baseline",
             "An approved, recorded configuration that work proceeds from and "
             "changes are measured against."),
            ("Version control",
             "A recorded history of every change: what, when, by whom, and "
             "why."),
            ("Commit practice",
             "One logical change per commit, with the REASON recorded, since "
             "the content is visible and the reason is not."),
            ("Branch lifetime",
             "Merge cost grows with it, since changes accumulate on both "
             "sides -- so integrate frequently."),
            ("Change control",
             "Requesting, assessing impact, deciding by authority, "
             "implementing, and updating the baseline."),
            ("Change control board",
             "The group empowered to decide, with formality matched to the "
             "stakes rather than uniform."),
            ("Status accounting",
             "Which version is where, right now. Its absence makes a "
             "production fix undevelopable."),
            ("Functional audit",
             "Does the system do what the configuration says it should."),
            ("Physical audit",
             "Are the items listed in the record the items actually present."),
        ],
        "Configuration management answers what a system consists of, in which "
        "versions, and what changed -- and without that answer a defect "
        "cannot be attributed to a change, a release cannot be reproduced and "
        "a rollback has no destination. Six activities do the work, and the "
        "test for what belongs under control is anything needed to REPRODUCE "
        "a release, which catches the build scripts, environment definitions "
        "and test data teams leave out. A BASELINE is the approved recorded "
        "state that work proceeds from, and its value is having an answer to "
        "what was agreed rather than control for its own sake. Version "
        "control keeps the history, with one logical change per commit and "
        "the REASON recorded, since the content is always visible and the "
        "reason exists nowhere else. Branching isolates and costs, and the "
        "cost grows with every day a branch lives -- so integrating "
        "frequently beats perfecting the merge. Change CONTROL means "
        "proposing and assessing before acting, and approving without impact "
        "assessment is approving an unknown, which accumulates into scope "
        "creep; formality should match the stakes, or the process is "
        "circumvented. Finally status accounting says which version is where "
        "-- absent, a production fix cannot even be developed against the "
        "right code -- and audit checks the record against reality, because "
        "an unchecked record drifts invisibly and is believed at exactly the "
        "moment being wrong matters most.",
        exam_notes=[
            desc(
                "Items describe a situation where something could not be "
                "determined, and ask which activity was missing."
            ),
            ul([
                "Identifying the missing configuration management activity.",
                "Applying the test for what belongs under control.",
                "Explaining what a baseline provides.",
                "Explaining why merge cost grows with branch lifetime.",
                "Distinguishing change control from recording.",
                "Distinguishing functional from physical audit.",
                "Explaining why the reason for a change matters most.",
            ]),
            desc(
                "When an item says something could not be determined, name "
                "the activity that would have recorded it. 'Which version is "
                "running' is status accounting, 'what was agreed' is "
                "baselining, and 'does the record match reality' is audit -- "
                "and none of the three can be reconstructed after the fact."
            ),
        ],
    ))

LESSONS = [LESSON_DEV_ENV, LESSON_DEV_CM]
