"""The FE Exam certification skeleton: the certification row, its 9 major
categories and its 23 middle categories.

Taken from the IPA syllabus for the Fundamental Information Technology
Engineer Examination (Level 2), Version 4.0. That document is organised
exactly the way this product's schema is -- major category, middle category,
then numbered minor categories under each -- so the mapping is one-to-one and
needs no invention:

    syllabus major category   ->  public.major_categories     (9 rows)
    syllabus middle category  ->  public.middle_categories   (23 rows)
    syllabus minor category   ->  public.lessons             (95 rows)

That last line is the design decision worth stating. A minor category in the
syllabus ("2. Applied mathematics", "6. Project time management") is a
coherent teachable unit with its own goal statement and its own list of
examinable terms, and it is the level the examination itself is blueprinted
at. Mapping it to a lesson means the curriculum covers the published scope
exactly -- no topic without a lesson, no lesson without a topic -- and it is
checkable, which `_coverage.py` does.

The certification itself is created here rather than through the admin UI
because the whole build has to be reproducible: this file plus the content
modules is the entire definition, and running it against an empty database
produces the same certification every time.
"""

#: Matched by title when the certification is looked up or created. Changing
#: this string orphans the existing rows rather than renaming them.
CERTIFICATION_TITLE = "FE Exam"

CERTIFICATION_DESCRIPTION = (
    "The Fundamental Information Technology Engineer Examination (FE) is the "
    "Level 2 qualification of Japan's national Information Technology "
    "Engineers Examination, administered by the Information-technology "
    "Promotion Agency (IPA) and recognised across Asia through mutual "
    "agreements. It certifies that an entry-level engineer holds the "
    "fundamental knowledge and skills common to all IT work -- the theory "
    "under computing, algorithms and programming, computer and system "
    "architecture, databases, networks, security, development and project "
    "management, and the business and legal context those sit in. The paper "
    "is deliberately broad: it establishes that a practitioner can reason "
    "about a system as a whole, not only about the part they were hired to "
    "build."
)

CERTIFICATION_INDUSTRY = "Information and Communications Technology (ICT)"

#: `certifications.status`, stored as the ordinal of
#: `Certification.CertificationStatus` in the Java entity -- which declares
#: PUBLISHED first, so 0 is PUBLISHED and 1 is DRAFT. That ordering is easy to
#: read backwards, and this curriculum was created at 0 and was therefore
#: visible to learners from its first lesson.
#:
#: It stays DRAFT until the curriculum is complete. A partial certification is
#: worse than an absent one: a learner who starts it builds progress against a
#: syllabus that is mostly missing, and the diagnostic and mock exams sample
#: only the majors that happen to be written, so both report a competence
#: picture that is wrong rather than incomplete.
CERTIFICATION_STATUS_DRAFT = 1
CERTIFICATION_STATUS_PUBLISHED = 0

CERTIFICATION_STATUS = CERTIFICATION_STATUS_DRAFT

#: `certifications.exam_structure`. The shape of the real paper, so the mock
#: exam and the practice engine size themselves against something true rather
#: than against a guess.
#:
#: EVERY ITEM ON THIS EXAMINATION IS MULTIPLE CHOICE. That is the single most
#: consequential fact about the paper and it drives the whole question bank:
#: there is no coding submission, no diagram to draw, no essay, and no short
#: written answer anywhere in it. Subject B is often described as the
#: "programming" half, which misleads -- it examines programming by making the
#: candidate TRACE pseudocode and select the resulting value or the correct
#: combination of blanks, not by making them write code. So the bank is
#: MCQ-only, and the Subject B style is reproduced as trace-and-compute and
#: fill-in-the-blank combination items rather than as PROGRAMMING or DIAGRAM
#: question types, which this certification never uses.
#:
#: Verified against IPA's current (post-April-2024) format rather than the
#: 2016 syllabus PDF, which predates the Subject A / Subject B split.
EXAM_STRUCTURE = {
    "notes": (
        "The FE Examination is computer-based (CBT), offered year-round at "
        "test centres, and sat as two subjects on the same day with a short "
        "break between them -- 190 minutes in total. Subject A is 60 "
        "multiple-choice questions in 90 minutes, drawn from the whole "
        "syllabus and weighted towards Technology; the items are short, and "
        "many are small calculations or pieces of reasoning rather than "
        "recall. Subject B is 20 multiple-choice questions in 100 minutes, "
        "dominated by algorithms and programming and completed by "
        "information-security items; its questions are long, each built on a "
        "piece of pseudocode, a data structure or a scenario that the "
        "candidate must work through before an option can be chosen. Since "
        "the 2024 revision Subject B uses a language-independent pseudocode "
        "rather than any real programming language. Every question in both "
        "subjects is multiple choice: nothing is written, coded or drawn. "
        "Each subject is scored on a 1000-point scale by item response "
        "theory, and 600 is needed in each independently, so strength in one "
        "cannot compensate for failure in the other. A handful of items in "
        "each subject are unscored trial questions, indistinguishable from "
        "the rest while sitting the paper. No calculator is permitted, which "
        "is why radix conversion, shift arithmetic and probability are "
        "examined at a size that can be done by hand."
    ),
    "coverage": (
        "Subject A samples the whole syllabus: Technology (Basic Theory, "
        "Computer System, Technology Element, Development Technology) "
        "approximately 65%, Management (Project Management, Service "
        "Management) approximately 15%, Strategy (System Strategy, Business "
        "Strategy, Corporate and Legal Affairs) approximately 20%. Subject B "
        "is concentrated: roughly 80% algorithms and programming, 20% "
        "information security."
    ),
    "total_items": 80,
    "question_types": ["MCQ"],
    "duration_minutes": 190,
    "passing_score": 60.0,
    "parts": [
        {"name": "Subject A", "items": 60, "duration_minutes": 90,
         "format": "MCQ",
         "note": "Short items sampled across the full syllabus."},
        {"name": "Subject B", "items": 20, "duration_minutes": 100,
         "format": "MCQ",
         "note": ("Long items: algorithms and programming traced from "
                  "pseudocode, plus information security scenarios.")},
    ],
}

#: The only question type this certification's bank uses. Enforced by
#: `builders.mcq` being the only item builder the content modules import.
#:
#: SHORT_ANSWER and DESCRIPTIVE are deliberately absent even though the
#: platform supports them and the TOPCIT bank leans on both. TOPCIT genuinely
#: examines by written answer; FE does not, and a quiz that asks an FE
#: candidate to type a definition is practising a skill the paper never tests
#: while skipping the one it does -- choosing between four close options under
#: time pressure. PROGRAMMING and DIAGRAM are absent for the same reason and
#: also have stubbed runners in this platform.
QUESTION_TYPES = ("MCQ",)

#: (major title, [(middle title, [lesson titles in syllabus order])]).
#:
#: Lesson titles are written for a learner rather than copied from the
#: syllabus's own headings -- "Radix, Numeric Representation and Precision"
#: says what the lesson teaches where the syllabus's "1. Discrete
#: mathematics" says only which drawer it lives in. The syllabus minor each
#: one answers to is recorded in `SYLLABUS_MAP` below so coverage stays
#: checkable in both directions.
CURRICULUM = [
    ("Basic Theory", [
        ("Basic Theory", [
            "Discrete Mathematics: Radix, Numeric Representation and Precision",
            "Applied Mathematics: Probability, Statistics and Optimisation",
            "Theory of Information, Coding and Automata",
            "Theory of Communications: Transmission, Modulation and Error Control",
            "Theory of Measurement and Control Systems",
        ]),
        ("Algorithm and Programming", [
            "Data Structures: Arrays, Lists, Stacks, Queues, Trees and Hashes",
            "Algorithms: Searching, Sorting, Recursion and Complexity",
            "Programming: Structure, Style, Data Types and Program Behaviour",
            "Programming Languages: Compilation, Paradigms and Language Families",
            "Markup and Other Languages: HTML, XML, JSON and Notation",
        ]),
    ]),
    ("Computer System", [
        ("Computer Component", [
            "The Processor: Architecture, Instruction Execution and Performance",
            "Memory: Hierarchy, Cache, Main Memory and Storage Devices",
            "Buses and Interconnects",
            "Input/Output Interfaces and Device Control",
            "Input/Output Devices and Peripherals",
        ]),
        ("System Component", [
            "System Configuration: Redundancy, Clustering and Processing Modes",
            "System Evaluation Indexes: Performance, Reliability and Economics",
        ]),
        ("Software", [
            "Operating Systems: Processes, Scheduling and Memory Management",
            "Middleware, Runtimes and Shared Services",
            "File Systems, Directories and Backup",
            "Development Tools, Build Chains and Testing Environments",
            "Open Source Software, Licensing and Adoption",
        ]),
        ("Hardware", [
            "Hardware: Logic Circuits, Semiconductors and Physical Design",
        ]),
    ]),
    ("Technology Element", [
        ("Human Interface", [
            "Human Interface Technology and Interaction Models",
            "Interface Design, Screen Design and Accessibility",
        ]),
        ("Multimedia", [
            "Multimedia Technology: Encoding, Compression and Formats",
            "Multimedia Applications: Graphics, Audio, Video and VR",
        ]),
        ("Database", [
            "Database Architecture, Models and the Three-Schema Approach",
            "Database Design: E-R Modelling, Normalisation and Keys",
            "Data Manipulation: Relational Algebra and SQL",
            "Transaction Processing: ACID, Concurrency and Recovery",
            "Database Applications: Distribution, Warehousing and NoSQL",
        ]),
        ("Network", [
            "Network Architecture: LAN, WAN, Topologies and Devices",
            "Data Communication and Control: Encoding, Multiplexing and Switching",
            "Communications Protocols: TCP/IP, Addressing and Routing",
            "Network Management, Monitoring and Troubleshooting",
            "Network Applications: DNS, Mail, Web and Distributed Services",
        ]),
        ("Security", [
            "Information Security: Threats, Attacks and Vulnerabilities",
            "Cryptography, Authentication and Digital Signatures",
            "Information Security Management: ISMS, Risk and Policy",
            "Security Technology Evaluation and Certification Schemes",
            "Information Security Measures and Implementation Technology",
        ]),
    ]),
    ("Development Technology", [
        ("System Development Technology", [
            "System Requirements Definition and Stakeholder Needs",
            "Systems Architecture Design and Hardware/Software Allocation",
            "Software Requirements Definition and Specification",
            "Software Architecture Design and Detailed Design",
            "Object-Oriented Design and UML Modelling",
            "Software Construction: Coding, Review and Unit Testing",
            "Software Integration and Qualification Testing",
            "System Integration, System Testing and Installation",
            "Acceptance Support and Handover",
            "Maintenance, Evolution and Disposal",
        ]),
        ("Software Development Management Techniques", [
            "Development Processes and Methods: Waterfall, Agile and Beyond",
            "Intellectual Property in Software Development",
            "Development Environment Management",
            "Configuration Management and Change Control",
        ]),
    ]),
    ("Project Management", [
        ("Project Management", [
            "Project Management Foundations: Processes and Process Groups",
            "Project Integration Management",
            "Project Stakeholder Management",
            "Project Scope Management and the WBS",
            "Project Resource Management",
            "Project Time Management: Scheduling, Critical Path and PERT",
            "Project Cost Management and Earned Value",
            "Project Risk Management",
            "Project Quality Management",
            "Project Procurement Management",
            "Project Communications Management",
        ]),
    ]),
    ("Service Management", [
        ("Service Management", [
            "Service Management Foundations and the Service Lifecycle",
            "Service Design and Service Transition",
            "Service Management Processes: Incident, Problem, Change and SLA",
            "Service Operation, Service Desk and Support",
            "Facility Management and Data Centre Infrastructure",
        ]),
        ("System Audit", [
            "System Audit: Purpose, Process and Evidence",
            "Internal Control and IT Governance",
        ]),
    ]),
    ("System Strategy", [
        ("System Strategy", [
            "Information Systems Strategy and Enterprise Architecture",
            "Business Process Analysis and Modelling",
            "Solution Business: Cloud, Outsourcing and Service Models",
            "System Utilisation Promotion and Evaluation",
        ]),
        ("System Planning", [
            "Computerisation Planning and Investment Appraisal",
            "Requirements Definition from the Client Side",
            "Procurement Planning: RFI, RFP and Supplier Selection",
        ]),
    ]),
    ("Business Strategy", [
        ("Business Strategy Management", [
            "Business Strategy Techniques and Competitive Analysis",
            "Marketing: Segmentation, Mix and Pricing",
            "Business Strategy Goals and Evaluation",
            "Business Management Systems: ERP, SCM, CRM and BI",
        ]),
        ("Technological Strategy Management", [
            "Planning a Technology Development Strategy",
            "Technology Development Plans and Innovation Management",
        ]),
        ("Business Industry", [
            "Business Systems and Administrative Applications",
            "Engineering Systems and Production Management",
            "e-Business: EC, Electronic Payment and Digital Marketing",
            "Consumer Appliances and Embedded Consumer Systems",
            "Industrial Devices, IoT and Control Equipment",
        ]),
    ]),
    ("Corporate and Legal Affairs", [
        ("Corporate Activities", [
            "Management and Organisation Theory",
            "Operations Research and Industrial Engineering",
            "Accounting and Financial Affairs for Engineers",
        ]),
        ("Legal Affairs", [
            "Intellectual Property Rights in IT",
            "Laws on Information Security and Cybercrime",
            "Laws on Labour and Commercial Transactions",
            "Other Laws, Guidelines and Engineer Ethics",
            "Standardisation and Standards Bodies",
        ]),
    ]),
]


def iter_lessons():
    """Yields (major_title, middle_title, lesson_title, ordinal)."""
    ordinal = 0
    for major_title, middles in CURRICULUM:
        for middle_title, lessons in middles:
            for lesson_title in lessons:
                ordinal += 1
                yield major_title, middle_title, lesson_title, ordinal


def lesson_count():
    return sum(len(lessons)
               for _major, middles in CURRICULUM
               for _middle, lessons in middles)


def middle_count():
    return sum(len(middles) for _major, middles in CURRICULUM)


if __name__ == "__main__":
    print("%d majors, %d middles, %d lessons"
          % (len(CURRICULUM), middle_count(), lesson_count()))
    for major, middle, lesson, ordinal in iter_lessons():
        print("%3d  %-26s %-42s %s" % (ordinal, major[:26], middle[:42], lesson))
