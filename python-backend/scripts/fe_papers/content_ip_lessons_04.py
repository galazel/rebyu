"""IT Passport lesson content: Software and Hardware (743-747)."""

import sys

sys.path.insert(0, "/app/scripts/fe_expansion")

from builders import (  # noqa: E402
    accordion, compare_grid, content_tabs, desc, flip_cards, image, image_text,
    lesson_structure, media_text, ol, review_cards, sub, table, tabs, ul,
)

FIG = "/lesson-media/%s.svg"

CERTIFICATION_ID = 4

LESSONS = {}


LESSONS[743] = lesson_structure(
    name="Operating system",
    intro=(
        "An operating system stands between applications and hardware, deciding which "
        "program runs, who gets which memory, and how files and devices are reached. "
        "This lesson covers what it manages, why applications are not allowed to touch "
        "hardware directly, and the kinds of operating system in use."
    ),
    objectives=[
        "List the resources an operating system manages.",
        "Explain why applications go through the OS rather than to hardware.",
        "Describe multitasking and what a scheduler does.",
        "Explain the purpose of user accounts and permissions.",
        "Name common operating systems and where each is used.",
        "Describe what a patch is and why patching matters.",
    ],
    minutes=35,
    sections=[
        ("What an operating system does", [
            desc(
                "An operating system is the software that manages a computer's "
                "resources and provides services every application relies on. Without "
                "it, each program would have to drive the hardware itself and would have "
                "to cooperate with every other program by agreement."
            ),
            image(FIG % "ip-os-roles"),
        ]),
        ("Managing processes", [
            desc(
                "A process is a running program. A modern system has far more processes "
                "than processors, so the operating system switches rapidly between them "
                "-- fast enough that they appear to run at once."
            ),
            desc(
                "The scheduler decides who runs next. Its choice trades fairness against "
                "responsiveness: giving a long calculation a full share makes it finish "
                "sooner and makes everything else feel sluggish while it does."
            ),
            ul([
                "Multitasking -- several processes progressing by rapid switching.",
                "Priority -- important processes are scheduled more often.",
                "Context switch -- saving one process's state and restoring another's.",
            ]),
        ]),
        ("Managing memory", [
            desc(
                "The operating system allocates memory to each process and enforces the "
                "boundaries between them. One program cannot read or overwrite another's "
                "memory, which is what stops a faulty application taking the machine "
                "down with it."
            ),
            desc(
                "When demand exceeds physical memory, virtual memory moves inactive "
                "parts to disk. The protection and the illusion of plenty are both the "
                "operating system's work, and neither is visible to the program."
            ),
        ]),
        ("Files, devices and users", [
            accordion([
                ("File management", "Names, folders, permissions, and free-space tracking, so programs deal in filenames rather than disk sectors."),
                ("Device management", "Drivers and a uniform interface, so an application prints without knowing which printer is attached."),
                ("User management", "Accounts, authentication and rights, so the system knows who is asking and what they may do."),
                ("Networking", "Addresses, connections and protocols, so programs send data without implementing TCP/IP themselves."),
            ]),
        ]),
        ("Accounts and permissions", [
            desc(
                "Every action is taken by some account, and what it may do follows from "
                "that account's rights. This is the foundation of every access control "
                "on the machine."
            ),
            desc(
                "Working day to day in an administrator account removes that protection: "
                "anything that runs, including anything malicious, inherits full rights. "
                "Using a standard account and elevating only when required limits what a "
                "mistake or an infection can reach."
            ),
        ]),
        ("Kinds of operating system", [
            table(
                ["System", "Typically found on", "Note"],
                [["Windows", "Business desktops and laptops", "The widest application support"],
                 ["macOS", "Apple computers", "Unix-based underneath"],
                 ["Linux", "Servers, appliances, development", "Open source; many distributions"],
                 ["Android", "Phones and tablets", "Linux-based, open source"],
                 ["iOS", "iPhone and iPad", "Tightly controlled application distribution"],
                 ["Real-time OS", "Vehicles, machinery, medical devices", "Guarantees a response within a time bound"]],
            ),
            desc(
                "A real-time operating system is not simply a fast one. It guarantees a "
                "deadline, and in a hard real-time system a late answer is a wrong answer "
                "-- which is why one controls an airbag and a general-purpose system does "
                "not."
            ),
        ]),
        ("Keeping it current", [
            desc(
                "A patch is a vendor's correction to software, often closing a security "
                "weakness. An unpatched system is vulnerable to faults that are public "
                "knowledge and for which tools already exist."
            ),
            ol([
                "Apply security patches promptly; the window between disclosure and exploitation is short.",
                "Test on a representative machine first where the system matters.",
                "Keep a way back -- a snapshot or a restore point -- before a large update.",
                "Replace software that is past end of support; no patches will come.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("Why can't one program read another's memory?", "The OS enforces boundaries",
                 "This is what stops a faulty program taking the machine down."),
                ("What does the scheduler decide?", "Which process runs next",
                 "It trades fairness against responsiveness."),
                ("Why not work as administrator daily?", "Everything you run inherits full rights",
                 "Including anything malicious that starts by accident."),
                ("What makes an OS real-time?", "A guaranteed response deadline",
                 "Not raw speed -- a late answer counts as wrong."),
            ]),
        ]),
    ],
    key_terms=[
        ("Operating system", "Software managing a computer's resources and serving applications."),
        ("Process", "A running program, scheduled by the operating system."),
        ("Multitasking", "Several processes progressing by rapid switching."),
        ("Permission", "What a given account is allowed to do."),
        ("Patch", "A vendor correction, often closing a security weakness."),
        ("Real-time OS", "One that guarantees a response within a required time."),
    ],
    summary=(
        "The operating system manages processes, memory, files, devices, users and "
        "networking, so applications request resources instead of driving hardware. "
        "The scheduler creates the appearance of simultaneity and memory protection "
        "keeps a faulty program contained. Accounts and permissions underpin every "
        "access control, which is why daily work should not happen in an administrator "
        "account, and patching closes weaknesses that are already public."
    ),
    exam_notes=[
        desc(
            "Expect a question listing something and asking whether the OS is "
            "responsible for it. The rule of thumb: if it is a shared resource, the "
            "operating system manages it."
        ),
        ul([
            "Multitasking is rapid switching, not literally simultaneous on one core.",
            "Real-time means a guaranteed deadline, not high speed.",
            "A standard account limits what a mistake can reach.",
        ]),
    ],
)


LESSONS[744] = lesson_structure(
    name="File system",
    intro=(
        "A file system decides how data on a disk is named, organised and found again. "
        "This lesson covers files, folders and paths, the access rights that control "
        "who may do what, and the backup and archive practices that decide whether data "
        "survives a mistake."
    ),
    objectives=[
        "Describe how files and folders are organised hierarchically.",
        "Distinguish absolute from relative paths.",
        "Explain what a file extension indicates and what it does not.",
        "Describe read, write and execute permissions.",
        "Explain the difference between a backup and an archive.",
        "Describe what happens when a file is deleted.",
    ],
    minutes=35,
    sections=[
        ("Files and folders", [
            desc(
                "A file is a named collection of data. Folders (directories) group files "
                "and may contain further folders, producing a tree with one root -- the "
                "same structure covered under data structures, applied to storage."
            ),
            desc(
                "The hierarchy exists for people. The disk itself has no notion of "
                "folders; the file system maintains the illusion so that a name and a "
                "path are enough to find data among millions of blocks."
            ),
        ]),
        ("Paths", [
            compare_grid(
                "Two ways to say where a file is",
                "Both identify a file; they differ in what they assume.",
                [("Absolute path",
                  "From the root: C:\\Users\\sam\\report.docx. Unambiguous anywhere, and "
                  "breaks if the structure above it changes."),
                 ("Relative path",
                  "From the current location: ..\\images\\logo.png. Shorter and portable, "
                  "and meaningless without knowing where you are.")],
            ),
        ]),
        ("File extensions", [
            desc(
                "The characters after the final dot conventionally indicate the file's "
                "type, and the operating system uses them to choose which program opens "
                "it."
            ),
            desc(
                "An extension is a hint, not a fact. Renaming a file does not change its "
                "contents, and a file claiming to be a document may be a program -- which "
                "is exactly how a great deal of malware arrives. Hiding known extensions "
                "by default is what makes 'invoice.pdf.exe' look harmless."
            ),
            table(
                ["Extension", "Contains", "Opened by"],
                [[".txt", "Plain text", "Any text editor"],
                 [".docx / .xlsx", "Word processor / spreadsheet", "Office applications"],
                 [".pdf", "Fixed-layout document", "A PDF reader"],
                 [".jpg / .png", "Image", "An image viewer or browser"],
                 [".zip", "Compressed archive of other files", "An archive tool"],
                 [".exe", "An executable PROGRAM", "Run directly -- treat with suspicion"]],
            ),
        ]),
        ("Access rights", [
            desc(
                "Permissions decide what each account may do with a file, and they are "
                "the mechanism behind most of what a security policy promises."
            ),
            ul([
                "Read -- open and view the contents.",
                "Write -- change or delete the contents.",
                "Execute -- run it, where it is a program.",
            ]),
            desc(
                "Rights are granted to users and to groups. Granting to a group and "
                "managing membership is what keeps permissions maintainable: a person "
                "changing role is one membership change rather than a hunt through every "
                "folder."
            ),
        ]),
        ("Deleting is not erasing", [
            desc(
                "Deleting a file usually removes its directory entry and marks its "
                "blocks reusable. The data remains on the disk until something else "
                "overwrites it, which is why deleted files can often be recovered."
            ),
            desc(
                "That is convenient after a mistake and a serious exposure when hardware "
                "is disposed of. Equipment leaving the organisation needs secure erasure "
                "or physical destruction, not a delete and a format."
            ),
        ]),
        ("Backup and archive", [
            compare_grid(
                "They are not the same thing",
                "Confusing them loses either data or money.",
                [("Backup",
                  "A copy of live data, kept so it can be restored after loss. Recent, "
                  "frequently refreshed, and overwritten in rotation."),
                 ("Archive",
                  "Data moved out of live storage because it is no longer in daily use "
                  "but must be kept -- often for a legal retention period.")],
            ),
            desc(
                "The practical rule remembered as 3-2-1: three copies, on two kinds of "
                "media, with one off site. Ransomware is why the off-site or offline "
                "copy matters -- it encrypts whatever the infected machine can write to."
            ),
        ]),
        ("Organising files so they can be found", [
            ol([
                "Agree a naming convention and use it consistently.",
                "Put the date in a sortable form -- 2026-09-23, not 23/09/26.",
                "Use folders for categories, names for specifics.",
                "Record a version, or use a system that tracks versions for you.",
                "Decide what is authoritative when several copies exist.",
            ]),
            desc(
                "Shared storage without a convention becomes unusable at a predictable "
                "speed. The cost is not lost files so much as people working from the "
                "wrong version of one they did find."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Does deleting a file erase the data?", "No",
                 "It frees the blocks; the contents remain until overwritten."),
                ("Absolute or relative: survives being moved?", "Relative",
                 "It is resolved from the current location, so a moved pair still matches."),
                ("What does a file extension guarantee?", "Nothing",
                 "It is a hint. Renaming does not change contents."),
                ("Backup or archive: kept for a retention period?", "Archive",
                 "A backup exists to restore live data after loss."),
            ]),
        ]),
    ],
    key_terms=[
        ("File system", "How data on storage is named, organised and located."),
        ("Absolute path", "A location given from the root, unambiguous anywhere."),
        ("Relative path", "A location given from the current position."),
        ("Permission", "Read, write or execute rights over a file, by user or group."),
        ("Archive", "Data moved out of live use but retained, often for legal reasons."),
        ("Secure erasure", "Overwriting or destroying media so deleted data cannot be recovered."),
    ],
    summary=(
        "Files sit in a hierarchy of folders reached by absolute or relative paths, and "
        "an extension only hints at type -- it can be renamed, which malware relies on. "
        "Permissions granted to groups rather than individuals keep access maintainable. "
        "Deleting frees blocks without erasing contents, so disposal needs secure "
        "erasure. Backups restore live data after loss while archives retain data no "
        "longer in daily use, and an offline copy is what survives ransomware."
    ),
    exam_notes=[
        desc(
            "The backup-versus-archive distinction and the fact that deletion does not "
            "erase are both examined. So is the observation that a file extension can be "
            "changed without changing the file."
        ),
        ul([
            "3-2-1: three copies, two media types, one off site.",
            "Group permissions scale; per-user permissions do not.",
            "A .exe claiming to be a document is the classic attachment attack.",
        ]),
    ],
)


LESSONS[745] = lesson_structure(
    name="Development tools",
    intro=(
        "Software is built with tools as much as with languages. This lesson covers the "
        "editors, version control, build and test tools a development team relies on, "
        "and what each one prevents going wrong."
    ),
    objectives=[
        "Describe what an IDE provides beyond a text editor.",
        "Explain what version control does and why it is essential.",
        "Describe what a build tool automates.",
        "Explain what automated testing contributes.",
        "Describe what a bug tracker is for.",
        "Explain why development, test and production are separated.",
    ],
    minutes=35,
    sections=[
        ("The integrated development environment", [
            desc(
                "An IDE gathers the tools a developer uses constantly into one "
                "application: an editor that understands the language, a compiler or "
                "interpreter, a debugger, and navigation through the codebase."
            ),
            ul([
                "Syntax highlighting and completion -- errors caught while typing.",
                "A debugger -- pause execution and inspect values mid-run.",
                "Navigation -- jump to where something is defined or used.",
                "Integration with version control and the build.",
            ]),
        ]),
        ("Version control", [
            desc(
                "A version control system records every change to a codebase, who made "
                "it, when, and why. It is what makes more than one person working on the "
                "same code possible at all."
            ),
            accordion([
                ("History", "Every previous state is recoverable, so a bad change can be reverted rather than reconstructed."),
                ("Branching", "Work proceeds in parallel and is merged; an unfinished feature does not block a release."),
                ("Blame / annotate", "Shows which change introduced a given line, and the message explaining it."),
                ("Review", "Changes are proposed and examined before joining the main line."),
            ]),
            desc(
                "Commit messages are part of the record. A message saying what changed "
                "is nearly useless -- the diff already says that. A message saying WHY is "
                "what a reader needs a year later."
            ),
        ]),
        ("Building and automating", [
            desc(
                "A build turns source code into something runnable: compiling, gathering "
                "dependencies, packaging. Doing it by hand is slow and inconsistent, so "
                "it is scripted."
            ),
            desc(
                "Continuous integration runs that build and the tests automatically on "
                "every change. Its value is the shortened gap between breaking something "
                "and finding out -- minutes rather than weeks."
            ),
        ]),
        ("Testing tools", [
            compare_grid(
                "Manual and automated testing",
                "Each catches what the other misses.",
                [("Manual testing",
                  "A person exercises the system. Finds usability problems and "
                  "unexpected behaviour a script would never think to try."),
                 ("Automated testing",
                  "Scripts run the same checks on every change. Tireless and exact, and "
                  "only ever checks what someone thought to write down.")],
            ),
            desc(
                "Automated tests are what make change affordable. Without them every "
                "modification risks everything already working, so teams become "
                "reluctant to touch code -- and reluctance is how a system ossifies."
            ),
        ]),
        ("Tracking defects and work", [
            desc(
                "A bug tracker records defects with enough detail to reproduce them, "
                "their severity, and their state. An issue tracker does the same for "
                "work in general."
            ),
            ol([
                "What was done, exactly.",
                "What was expected.",
                "What happened instead.",
                "The environment -- version, browser, operating system.",
                "How reliably it repeats.",
            ]),
            desc(
                "A report missing the steps to reproduce usually costs more time than "
                "the fix does, because the first task becomes making the fault happen "
                "again."
            ),
        ]),
        ("Separate environments", [
            desc(
                "Development, test and production are kept apart so that untested change "
                "and real data never meet."
            ),
            table(
                ["Environment", "Purpose", "Data"],
                [["Development", "Where code is written and tried", "Fabricated or masked"],
                 ["Test / staging", "Where it is verified", "Realistic, masked"],
                 ["Production", "Where real users work", "Real, protected"]],
                caption="Copying production data downward without masking extends its exposure.",
            ),
        ]),
        ("Low-code and generated code", [
            desc(
                "Low-code platforms let applications be assembled visually with little "
                "hand-written code, which suits straightforward internal tools and "
                "shortens delivery considerably."
            ),
            ul([
                "Fast for standard forms, workflows and reports.",
                "Constrained by what the platform anticipated.",
                "Creates a dependency on the vendor that is hard to reverse.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("What makes a commit message useful?", "It explains WHY",
                 "The diff already shows what changed."),
                ("What does continuous integration shorten?", "Time to discover a break",
                 "The build and tests run on every change."),
                ("Why separate test from production?", "Untested change and real data must not meet",
                 "It protects production, and protects real data from weaker controls."),
                ("What must a bug report contain?", "Steps to reproduce",
                 "Without them the first job is making the fault happen again."),
            ]),
        ]),
    ],
    key_terms=[
        ("IDE", "An application gathering editor, compiler, debugger and navigation."),
        ("Version control", "A system recording every change, by whom, when and why."),
        ("Branch", "A parallel line of development, merged back when ready."),
        ("Continuous integration", "Automatically building and testing on every change."),
        ("Bug tracker", "A record of defects with the detail needed to reproduce them."),
        ("Staging", "An environment resembling production where changes are verified."),
    ],
    summary=(
        "An IDE concentrates the tools a developer uses constantly, and version control "
        "makes collaboration and recovery possible by recording every change with its "
        "reason. Automated builds and continuous integration shorten the gap between "
        "breaking something and discovering it, while automated tests are what make "
        "change affordable. Defects need reproduction steps to be actionable, and "
        "separating development, test and production keeps untested change away from "
        "real data."
    ),
    exam_notes=[
        desc(
            "Questions here are about purpose: given a problem, name the tool. The "
            "environment-separation question usually turns on protecting production "
            "rather than on convenience."
        ),
        ul([
            "Version control's value is history and parallel work, not backup.",
            "CI shortens feedback; it does not replace testing.",
            "Real data copied into test extends its exposure to weaker controls.",
        ]),
    ],
)


LESSONS[746] = lesson_structure(
    name="Open source software",
    intro=(
        "Open source software is distributed with its source code and with permission to "
        "use, study, modify and share it. This lesson covers what that permission "
        "actually grants, the obligations attached to it, and how an organisation adopts "
        "such software responsibly."
    ),
    objectives=[
        "State what makes software open source.",
        "Explain why open source is not the same as free of charge.",
        "Distinguish permissive licences from copyleft.",
        "Describe the risks of adopting an open source component.",
        "Name widely used open source software.",
        "Explain what a licence obligation on distribution means.",
    ],
    minutes=30,
    sections=[
        ("What open source means", [
            desc(
                "Open source software comes with its source code and a licence granting "
                "the right to use it for any purpose, study how it works, modify it, and "
                "redistribute it -- original or changed."
            ),
            desc(
                "The word free in this context refers to those freedoms rather than to "
                "price. Open source software may be sold, and commercial support for it "
                "is a substantial industry. Assuming open source means zero cost is the "
                "commonest misunderstanding."
            ),
        ]),
        ("Licence families", [
            compare_grid(
                "Two kinds of obligation",
                "Both are open source; they differ in what they require of you.",
                [("Permissive -- MIT, Apache, BSD",
                  "Use it in anything, including closed commercial products. Usually only "
                  "requires that the copyright notice is preserved."),
                 ("Copyleft -- GPL",
                  "If you DISTRIBUTE a modified version, its source must be offered under "
                  "the same licence. Keeps derived work open.")],
            ),
            desc(
                "Copyleft obligations attach to distribution, not to use. Running "
                "modified GPL software inside your own organisation triggers nothing; "
                "shipping it to customers does."
            ),
        ]),
        ("Where it is used", [
            table(
                ["Software", "What it is", "Licence family"],
                [["Linux", "Operating system kernel", "Copyleft (GPL)"],
                 ["Apache / nginx", "Web servers", "Permissive"],
                 ["MySQL / PostgreSQL", "Databases", "Mixed / permissive"],
                 ["Firefox", "Web browser", "Copyleft-ish (MPL)"],
                 ["LibreOffice", "Office suite", "Copyleft"],
                 ["Python", "Programming language", "Permissive"]],
            ),
            desc(
                "Most commercial software today contains open source components. The "
                "question for an organisation is almost never whether to use it, but "
                "whether it knows what it is using."
            ),
        ]),
        ("Adopting responsibly", [
            desc(
                "Open source shifts some costs and creates others. A component is a "
                "dependency, and dependencies need managing."
            ),
            ol([
                "Check the licence is compatible with how you will distribute your product.",
                "Check the project is actively maintained -- recent commits, recent releases.",
                "Check how security issues are handled and how quickly.",
                "Record what you use and which version, so an advisory can be acted on.",
                "Plan who updates it; an abandoned dependency becomes a liability.",
            ]),
        ]),
        ("Advantages and risks", [
            tabs([
                ("Advantages", "Why organisations choose it",
                 "No licence fee; the code can be inspected and audited; no dependence on "
                 "a single vendor's roadmap or survival; widely used components are "
                 "examined by many eyes; it can be modified to fit."),
                ("Risks", "What must be managed",
                 "Support may be community-based rather than contractual; licence "
                 "obligations can be breached inadvertently; an abandoned project leaves "
                 "you maintaining it; quality varies enormously between projects."),
                ("Misconceptions", "What it does not mean",
                 "Not automatically free of cost, not automatically more or less secure, "
                 "and not exempt from copyright -- it IS copyrighted, and the licence is "
                 "how permission is granted."),
            ]),
        ]),
        ("Contributing back", [
            desc(
                "An organisation that fixes a fault in a component can keep the change "
                "privately or contribute it upstream. Contributing means the fix is "
                "maintained by the project rather than reapplied to every future version "
                "by you."
            ),
            desc(
                "That is usually the cheaper path, and it is why companies that depend "
                "heavily on a project often pay staff to work on it."
            ),
        ]),
        ("Recall practice", [
            desc("Cover each answer first."),
            flip_cards([
                ("Does open source mean free of charge?", "No",
                 "It refers to freedoms to use, study, modify and share."),
                ("When do GPL obligations bite?", "On distribution",
                 "Internal use of a modified version triggers nothing."),
                ("Biggest risk of an abandoned dependency?", "You now maintain it",
                 "No upstream fixes, including security ones."),
                ("Is open source software copyrighted?", "Yes",
                 "The licence is how permission is granted; copyright is not waived."),
            ]),
        ]),
    ],
    key_terms=[
        ("Open source", "Software distributed with source code and rights to use, study, modify and share."),
        ("Permissive licence", "Allows use in closed products, typically requiring only attribution."),
        ("Copyleft", "Requires derived work that is distributed to carry the same licence."),
        ("Dependency", "An external component your software relies on and must keep updated."),
        ("Upstream", "The originating project, to which fixes may be contributed."),
        ("End of maintenance", "When a project stops issuing fixes, including security ones."),
    ],
    summary=(
        "Open source grants the rights to use, study, modify and share source code, "
        "which is about freedom rather than price. Permissive licences ask little "
        "beyond attribution while copyleft requires distributed derivatives to stay "
        "open, and those obligations attach to distribution rather than to use. "
        "Adoption needs licence compatibility checked, maintenance activity assessed, "
        "and an inventory kept, because an unmaintained dependency becomes the "
        "adopter's own burden."
    ),
    exam_notes=[
        desc(
            "The examination tests the two commonest misconceptions directly: that open "
            "source means free of charge, and that it is not copyrighted. Both are "
            "false."
        ),
        ul([
            "Copyleft obligations trigger on DISTRIBUTION, not on internal use.",
            "Open source is copyrighted; the licence grants permission.",
            "Licence compatibility must be checked before adoption, not after.",
        ]),
    ],
)


LESSONS[747] = lesson_structure(
    name="Hardware (computer and I/O device)",
    intro=(
        "This lesson covers the physical parts of a computer and how they fit together: "
        "the components inside the case, the circuits underneath, how power and heat are "
        "handled, and what to consider when equipment is bought, maintained and "
        "eventually disposed of."
    ),
    objectives=[
        "Name the main components inside a computer and what each does.",
        "Explain what the motherboard and bus connect.",
        "Describe why power supply and cooling matter.",
        "Explain what a logic circuit is at an elementary level.",
        "Describe the considerations when disposing of equipment.",
        "Identify categories of computer by size and purpose.",
    ],
    minutes=30,
    sections=[
        ("Inside the case", [
            accordion([
                ("Motherboard", "The main board everything connects to; carries the buses linking components."),
                ("Processor (CPU)", "Executes instructions; usually the component generating the most heat."),
                ("Memory (RAM)", "Holds running programs and their data; volatile."),
                ("Storage", "SSD or hard disk; keeps data without power."),
                ("Power supply", "Converts mains electricity to the low voltages components need."),
                ("Cooling", "Fans or heatsinks removing heat so components stay within tolerance."),
                ("Expansion cards", "Graphics, network or other functions added through slots."),
            ]),
        ]),
        ("Buses", [
            desc(
                "A bus is the shared set of connections carrying data between components. "
                "Its width -- how many bits travel at once -- and its clock rate together "
                "decide how much can move per second."
            ),
            desc(
                "A bus is a shared resource, so only one transfer can use it at a time. "
                "That is why a fast processor paired with a slow bus waits, and why bus "
                "bandwidth appears in specifications at all."
            ),
        ]),
        ("Logic circuits", [
            desc(
                "Underneath everything, a computer is logic gates: circuits implementing "
                "AND, OR, NOT and XOR on electrical signals. Combining them builds "
                "adders, comparators and memory cells."
            ),
            image(FIG % "ip-logic-operations"),
            desc(
                "The IT Passport examination asks for recognition rather than design: "
                "what each gate outputs for given inputs, and the fact that complex "
                "behaviour is assembled from these few operations."
            ),
        ]),
        ("Power and the environment", [
            desc(
                "Electrical supply and heat are practical constraints, and both cause "
                "outages that look like software faults."
            ),
            ul([
                "UPS -- battery power bridging the seconds before a generator starts, and smoothing supply.",
                "Generator -- sustains a long outage once running.",
                "Cooling -- components throttle or fail when too hot.",
                "Surge protection -- guards against spikes that damage equipment.",
            ]),
            desc(
                "A UPS and a generator are complementary rather than alternatives: the "
                "UPS covers the gap while the generator starts and stabilises."
            ),
        ]),
        ("Categories of computer", [
            table(
                ["Category", "Typical use", "Note"],
                [["Supercomputer", "Scientific simulation", "Extreme parallel computation"],
                 ["Server", "Shared services for many users", "Built for continuous operation"],
                 ["Desktop / laptop", "Individual work", "General purpose"],
                 ["Tablet / smartphone", "Mobile use", "Touch input, battery constrained"],
                 ["Embedded", "Inside an appliance or vehicle", "One job, done reliably"],
                 ["Wearable", "Worn on the body", "Sensors, small display, tight power budget"]],
            ),
        ]),
        ("Buying and maintaining", [
            ol([
                "Specify from the workload, not from the largest available numbers.",
                "Include support and warranty terms in the comparison, not just price.",
                "Plan the refresh cycle; equipment has a useful life.",
                "Keep an asset register -- what is owned, where it is, who has it.",
                "Apply firmware updates; they fix faults and security weaknesses too.",
            ]),
        ]),
        ("Disposal", [
            desc(
                "Equipment leaving the organisation carries two obligations that are "
                "easy to overlook."
            ),
            desc(
                "First, data. Deleting and formatting does not erase contents, so drives "
                "need secure erasure or physical destruction. Second, environment. "
                "Electronic equipment contains hazardous materials and is regulated; it "
                "cannot go in general waste."
            ),
            ul([
                "Erase securely or destroy the media, and record that it was done.",
                "Use a licensed recycler and keep the certificate.",
                "Remove asset tags and any identifying configuration before transfer.",
            ]),
        ]),
        ("Recall practice", [
            desc("Answer before turning each card."),
            flip_cards([
                ("What does a UPS provide that a generator does not?", "Instant, gap-free power",
                 "It bridges the seconds before the generator starts and stabilises."),
                ("What decides bus throughput?", "Width and clock rate",
                 "Bits carried at once, times transfers per second."),
                ("Is formatting a drive enough before disposal?", "No",
                 "Secure erasure or physical destruction is required."),
                ("What is an embedded computer for?", "One job, reliably",
                 "Built into an appliance, vehicle or machine."),
            ]),
        ]),
    ],
    key_terms=[
        ("Motherboard", "The main board connecting components and carrying the buses."),
        ("Bus", "Shared connections carrying data between components."),
        ("Logic gate", "A circuit implementing AND, OR, NOT or XOR on signals."),
        ("UPS", "Battery supply bridging a short outage and smoothing power."),
        ("Embedded computer", "A processor built into a device to perform one function."),
        ("Secure erasure", "Overwriting or destroying media so data cannot be recovered."),
    ],
    summary=(
        "A computer is a motherboard carrying processor, memory, storage and expansion "
        "cards, linked by buses whose width and rate bound throughput. Logic gates "
        "underlie all of it. Power and cooling are practical constraints, with a UPS "
        "bridging the gap a generator cannot cover. Categories run from embedded "
        "devices to supercomputers, chosen by workload, and disposal carries both a "
        "data-erasure and an environmental obligation."
    ),
    exam_notes=[
        desc(
            "Expect a component-identification question and one on UPS versus generator. "
            "Disposal questions usually test that formatting is not erasure."
        ),
        ul([
            "A UPS covers the gap; a generator sustains the outage.",
            "Bus throughput = width x clock rate.",
            "Disposal needs secure erasure AND regulated recycling.",
        ]),
    ],
)
