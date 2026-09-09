"""Corporate and Legal Affairs -> Legal Affairs, lesson 5.

Standardisation and standards bodies.

The hundredth and final lesson of the certification. Standards are what
allow everything else in the syllabus to interoperate, and the point worth
carrying is that authority and adoption are different things.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Corporate and Legal Affairs"
MIDDLE = "Legal Affairs"


_std_sections = [
    ("Why Anything Works With Anything", [
        desc(
            "Every piece of technology in this certification depends on "
            "agreements about how things behave. A standard is such an "
            "agreement, written down, and the useful question about any one "
            "of them is who agreed and who is bound."
        ),
        image(fig("standards-bodies")),
        table(
            ["Level", "Published by", "Authority"],
            [["International", "Bodies such as ISO, IEC and ITU",
              "Agreed across national bodies"],
             ["Regional", "Regional standards organisations",
              "Within a region, sometimes mandated"],
             ["National", "Each country's standards body",
              "Within that country"],
             ["Industry", "Consortia and trade associations",
              "Over their members and their customers"],
             ["De facto", "Nobody -- it is simply what everybody uses",
              "None formally, and considerable in practice"]],
            caption="Five levels of standard, by who publishes.",
            footer="Authority decreases down the table and adoption "
                   "frequently does not. A DE FACTO standard nobody mandates "
                   "can bind more tightly than a published one, because "
                   "everything already works with it."),
    ]),

    ("What a Standard Actually Is", [
        desc(
            "The word covers several different things, and items turn on "
            "which is meant."
        ),
        ul([
            "A SPECIFICATION defines how something must behave to be "
            "interoperable.",
            "A method defines how something is measured or tested, so "
            "results can be compared.",
            "A management system standard defines how an organisation runs a "
            "function.",
            "A code of practice describes recommended ways of working.",
            "A vocabulary standard defines terms, so that people arguing "
            "are at least arguing about the same thing.",
        ]),
        desc(
            "The distinction matters when somebody claims compliance. "
            "Conforming to a management system standard says something about "
            "how an organisation is run and nothing about whether a "
            "particular product interoperates with anything."
        ),
    ]),

    ("De Jure and De Facto", [
        desc(
            "The most useful distinction in this lesson separates standards "
            "by how they came to be standards."
        ),
        compare_grid(
            "DE JURE AGAINST DE FACTO",
            "Agreed by a process, or established by use.",
            [("De jure",
              ["Developed through a formal process",
               "Published by a recognised body",
               "Consensus-based, and therefore slow",
               "May be widely ignored"]),
             ("De facto",
              ["Established by widespread adoption",
               "Frequently owned by one organisation",
               "Fast, and answerable to nobody",
               "May be universal without any formal status"])]),
        desc(
            "Neither is stronger in general. A de jure standard nobody "
            "implements constrains nothing; a de facto standard everybody "
            "implements constrains everything, and its owner can change it "
            "without consulting anybody."
        ),
    ]),

    ("How a Formal Standard Is Made", [
        desc(
            "The process is slow for reasons that are deliberate, and "
            "knowing the stages explains the pace."
        ),
        ol([
            "A proposal is made and accepted as work worth doing.",
            "A working group of interested parties prepares a draft.",
            "The draft is circulated for comment, and comments must be "
            "addressed.",
            "Successive drafts are balloted among national or member bodies.",
            "It is published, and reviewed periodically thereafter -- "
            "confirmed, revised or withdrawn.",
        ]),
        desc(
            "Step three is what consumes the time and produces the value. "
            "Every substantive objection must be considered and answered, "
            "which is why formal standards lag practice and why what emerges "
            "has genuinely been agreed rather than merely published."
        ),
    ]),

    ("Who Publishes What", [
        desc(
            "The syllabus expects the main bodies to be recognisable by "
            "their domain."
        ),
        content_accordion(
            "STANDARDS BODIES AN ENGINEER MEETS",
            "Each has a characteristic area.",
            [("ISO",
              "The international organisation covering the widest range, "
              "including quality, environmental and information security "
              "management systems, and much else."),
             ("IEC",
              "International electrotechnical standards, working with ISO "
              "on joint committees that produce much of the information "
              "technology material."),
             ("ITU",
              "Telecommunications, allocated through a United Nations "
              "agency, covering interconnection between national networks."),
             ("IEEE",
              "Professional body publishing widely used standards, "
              "particularly in local area networking and in software "
              "engineering practice."),
             ("IETF",
              "Internet standards, developed openly and published as RFCs, "
              "with rough consensus and running code as its working "
              "principle."),
             ("W3C",
              "Web standards, developed by member organisations and "
              "published as recommendations.")]),
    ]),

    ("Standards in the Rest of the Syllabus", [
        desc(
            "Nearly every technical topic in this certification rests on "
            "standards published by these bodies."
        ),
        table(
            ["Area", "Depends on standards for"],
            [["Networking",
              "Frame and packet formats, addressing, and physical media"],
             ["Security",
              "Cryptographic algorithms, certificate formats, and management "
              "systems"],
             ["Databases",
              "The query language, and interfaces to it"],
             ["Character handling",
              "Encoding, so text written anywhere can be read anywhere"],
             ["Software engineering",
              "Life cycle processes, quality models, and measurement"]],
            caption="Five areas and what they depend on.",
            footer="Character encoding is the one whose absence would be "
                   "most immediately visible. Without an agreed encoding, "
                   "text is only readable by the same software that wrote "
                   "it -- which was the actual situation for decades."),
    ]),

    ("Conformance and Certification", [
        desc(
            "Claiming to meet a standard and being certified as meeting it "
            "are different acts."
        ),
        ul([
            "SELF-DECLARATION is the supplier stating that it conforms.",
            "Second-party assessment is the customer checking, which is "
            "common in procurement.",
            "THIRD-PARTY certification is an accredited independent body "
            "assessing and issuing a certificate.",
            "Accreditation is the layer above: who certifies the "
            "certifiers.",
            "The value of a certificate depends entirely on the "
            "accreditation behind it.",
        ]),
        desc(
            "The last point is what an engineer should check. A certificate "
            "issued by a body nobody accredited demonstrates that somebody "
            "was paid, and distinguishing that from an accredited "
            "certificate requires looking rather than assuming."
        ),
    ]),

    ("Management System Standards", [
        desc(
            "A family of standards defines how an organisation runs a "
            "function rather than what a product does."
        ),
        ul([
            "They require a policy, objectives, defined responsibilities and "
            "documented processes.",
            "They require measurement, internal audit and management "
            "review.",
            "They require continual improvement, structured as a repeating "
            "cycle.",
            "They are auditable, which is what makes certification "
            "possible.",
            "They say how the function is run, and not that any particular "
            "outcome was achieved.",
        ]),
        desc(
            "The last point is the limitation to carry. An organisation with "
            "a certified information security management system has "
            "demonstrated a systematic approach, which is evidence of "
            "diligence rather than proof that it will not be breached."
        ),
    ]),

    ("Standards and the Law", [
        desc(
            "Standards are voluntary, and several mechanisms convert them "
            "into obligations."
        ),
        ol([
            "Legislation may reference a standard directly, making "
            "conformance the legal route.",
            "Regulator guidance may treat a standard as the expected "
            "practice.",
            "Contracts may require certification, which binds whoever "
            "signed.",
            "Sector rules may make it a condition of operating at all.",
            "Absent all of these, a standard is evidence of what reasonable "
            "practice looks like, which matters after something goes wrong.",
        ]),
        desc(
            "Step five is the quiet mechanism. Where negligence is assessed, "
            "the published standard describes what a competent organisation "
            "would have done -- so departing from it is defensible and must "
            "be defended."
        ),
    ]),

    ("Open Standards", [
        desc(
            "Whether a standard is open affects who can implement it, which "
            "is what determines competition."
        ),
        ul([
            "The specification is published and available to anybody.",
            "It can be implemented without a licence, or on terms that are "
            "reasonable and non-discriminatory.",
            "It was developed through a process open to participation.",
            "No single organisation controls its future direction.",
            "Implementations from different suppliers actually "
            "interoperate.",
        ]),
        desc(
            "The second point is where standards containing patented "
            "techniques become difficult. A specification anybody may read "
            "and nobody may implement without paying is open in one sense "
            "and closed in the sense that matters commercially."
        ),
    ]),

    ("Patents in Standards", [
        desc(
            "Standards frequently incorporate patented technology, and the "
            "arrangements around that are worth knowing."
        ),
        ul([
            "Participants are generally required to disclose patents they "
            "know to be essential.",
            "They are generally required to license those on fair, "
            "reasonable and non-discriminatory terms.",
            "What those terms actually are is disputed regularly and at "
            "length.",
            "An undisclosed essential patent asserted after adoption is "
            "treated as a serious abuse.",
            "Implementers must therefore consider licensing as well as "
            "technical conformance.",
        ]),
        desc(
            "The fourth point describes the behaviour these rules exist to "
            "prevent. A patent holder who stays silent while a standard is "
            "adopted and asserts afterwards has captured everybody who "
            "implemented it, which is why disclosure obligations attach to "
            "participation."
        ),
    ]),

    ("Interoperability in Practice", [
        desc(
            "Two products conforming to the same standard do not "
            "automatically work together, which surprises people."
        ),
        ol([
            "Standards contain optional features, and two implementations "
            "may choose differently.",
            "They contain ambiguities, which are resolved differently by "
            "different readers.",
            "PROFILES narrow a standard to a defined subset for a particular "
            "use, which is how this is addressed.",
            "Interoperability testing between implementations finds what "
            "conformance testing does not.",
            "Widely used implementations become the effective reference, "
            "whatever the document says.",
        ]),
        desc(
            "The last step is how ambiguity is really resolved. Where a "
            "specification is unclear, the behaviour of the most widely "
            "deployed implementation becomes the standard in practice, "
            "because everything else was tested against it."
        ),
    ]),

    ("Versions and Backward Compatibility", [
        desc(
            "Standards change, and how they change determines what happens "
            "to everything already built."
        ),
        compare_grid(
            "BACKWARD COMPATIBLE AGAINST BREAKING CHANGES",
            "What happens to what already exists.",
            [("Backward compatible",
              ["Existing implementations keep working",
               "New features are optional additions",
               "Adoption can be gradual",
               "Accumulated compromises make it complicated"]),
             ("Breaking",
              ["Existing implementations stop conforming",
               "A cleaner result, technically",
               "Adoption requires coordination nobody controls",
               "Frequently produces a long period of both in use"])]),
        desc(
            "The last entry on the right is the practical outcome of most "
            "breaking changes. Neither version disappears for years, so "
            "implementations must handle both -- which costs more than the "
            "compromise the break was meant to remove."
        ),
    ]),

    ("Quality and Process Standards", [
        desc(
            "Several standards define how software work itself should be "
            "organised, and the syllabus names them by purpose."
        ),
        table(
            ["Purpose", "What such a standard defines"],
            [["Quality management",
              "How an organisation manages quality across its work"],
             ["Life cycle processes",
              "The processes a software project should contain, without "
              "prescribing a method"],
             ["Product quality models",
              "The characteristics by which software quality is described "
              "and measured"],
             ["Process assessment",
              "How an organisation's process capability is evaluated"],
             ["Service management",
              "How IT services are delivered and improved"]],
            caption="Five purposes served by process standards.",
            footer="Life cycle standards define WHAT processes should exist "
                   "rather than HOW to perform them, which is why they are "
                   "compatible with sequential and iterative methods alike -- "
                   "a point items test directly."),
    ]),

    ("Why Organisations Seek Certification", [
        desc(
            "The reasons are commercial as often as they are about quality, "
            "and both are legitimate."
        ),
        ul([
            "Customers require it, which makes it a condition of bidding.",
            "It provides evidence for regulatory accountability "
            "obligations.",
            "It imposes discipline the organisation wanted and could not "
            "sustain alone.",
            "It reduces the number of individual customer audits, which are "
            "expensive.",
            "It is visible to a market that cannot inspect the underlying "
            "practice.",
        ]),
        desc(
            "The last point is worth stating honestly. Certification "
            "transmits information to people who cannot verify the substance "
            "themselves, which is genuinely valuable and is also why "
            "certificates are sometimes sought instead of the practice they "
            "represent."
        ),
    ]),

    ("The Limits of Standards", [
        desc(
            "A closing caution, and one the certification's final lesson can "
            "reasonably make."
        ),
        ul([
            "A standard describes agreed practice, not best practice, since "
            "agreement requires compromise.",
            "It lags what leading organisations are doing, necessarily.",
            "Conforming is not the same as being good at something.",
            "A standard applied without judgement produces documentation "
            "rather than improvement.",
            "It is a floor to build on rather than a ceiling to reach.",
        ]),
        desc(
            "The third point is the one to leave the certification with. "
            "Conformance demonstrates that a defined thing was done in a "
            "defined way, and whether it was the right thing remains an "
            "engineering judgement that no standard makes for anybody."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "This lesson closes the certification, and standards run through "
            "everything preceding it."
        ),
        content_tabs(
            "WHERE STANDARDS UNDERPIN EVERYTHING ELSE",
            "Each tab is a category resting on this one.",
            [("Network", "Interoperation between everything",
              "Frame formats, addressing and routing are all standardised, "
              "which is why equipment from different suppliers can be "
              "connected at all."),
             ("Security", "Algorithms and management systems",
              "Cryptographic standards make interoperable protection "
              "possible, and management system standards supply the evidence "
              "accountability obligations demand."),
             ("Development technology", "Life cycle and quality models",
              "Process standards define what a project should contain "
              "without prescribing how, which is why they suit iterative "
              "and sequential methods equally."),
             ("Service management", "Service standards",
              "Service delivery frameworks are standards in this sense, "
              "certifiable and increasingly required by customers rather "
              "than by law."),
             ("Business industry", "De facto standards",
              "Platform and industrial ecosystems are frequently held "
              "together by de facto standards, which bind implementers "
              "without any formal authority at all.")]),
    ]),

    ("Common Mistakes", [
        desc("Where standardisation items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Assuming a formal standard binds more than a de facto one",
              "Authority and adoption are different. A de facto standard "
              "everybody implements constrains more than a published one "
              "nobody does.",
              "Ask who actually implements it."),
             ("Treating certification as proof of an outcome",
              "A management system standard evidences a systematic "
              "approach, not that a breach or defect will not occur.",
              "It is evidence of diligence."),
             ("Assuming conformance guarantees interoperability",
              "Optional features and ambiguity mean two conforming products "
              "may not work together; profiles and testing address this.",
              "Interoperability is tested, not inferred."),
             ("Thinking a published specification is necessarily open",
              "Readable and implementable are different if essential "
              "patents are not licensed on reasonable terms.",
              "Check the licensing, not the availability."),
             ("Believing life cycle standards prescribe a method",
              "They define what processes should exist, not how to run "
              "them, which is why they suit iterative and sequential work "
              "alike.",
              "Items test this distinction directly.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("What distinguishes de jure from de facto?",
              "One is agreed through a formal process; the other is "
              "established by adoption alone.",
              "Adoption, not authority, decides what binds."),
             ("Why are formal standards slow?",
              "Every substantive objection must be addressed through "
              "consensus, which is also where the value comes from.",
              "They lag practice by design."),
             ("What determines a certificate's worth?",
              "The accreditation behind the certifying body.",
              "An unaccredited certificate shows somebody was paid."),
             ("How do voluntary standards acquire force?",
              "Legislation, guidance, contract, sector rules -- and as "
              "evidence of reasonable practice after something goes wrong.",
              "The last one operates quietly."),
             ("Why might two conforming products not interoperate?",
              "Optional features and ambiguity, which profiles and "
              "interoperability testing address.",
              "The dominant implementation becomes the reference."),
             ("What does conformance not demonstrate?",
              "That the thing done was the right thing to do.",
              "That remains an engineering judgement.")]),
    ]),
]


_std_quiz = [
    mcq("HARD",
        "A widely implemented format has no formal status, while a published "
        "international standard for the same purpose is barely "
        "used.\n\nWhich constrains implementers more?",
        [("The widely implemented one", True),
         ("The published international standard, because it carries formal "
          "authority conferred by a recognised body", False),
         ("Neither, since a format without formal status imposes no "
          "obligation on anybody implementing it", False),
         ("Both equally, because implementers must support whatever their "
          "customers are already using", False)],
        "Authority and adoption are separate properties. A de facto standard "
        "binds because everything already works with it and anything that "
        "does not is unusable, which is a stronger practical constraint than "
        "a formal status nobody has acted on -- and its owner can change it "
        "without consulting anybody."),

    mcq("AVERAGE",
        "Formal standards development is markedly slower than proprietary "
        "specification.\n\nWhat produces the delay?",
        [("Every substantive objection must be addressed", True),
         ("The balloting arrangements require national bodies to convene "
          "physically before voting on drafts", False),
         ("Draft standards must be tested by independent implementers "
          "before they may be published", False),
         ("Publication is deferred until essential patents held by "
          "participants have all been licensed", False)],
        "Consensus development requires that comments be considered and "
        "answered rather than outvoted, which consumes the time and produces "
        "the value: what emerges has genuinely been agreed. It is also why "
        "formal standards necessarily lag what leading practitioners are "
        "already doing."),

    mcq("AVERAGE",
        "Two products both conform to the same standard and do not work "
        "together.\n\nWhat is the usual explanation?",
        [("Optional features and ambiguities in the specification", True),
         ("One of the products does not in fact conform, despite the claim "
          "its supplier makes about it", False),
         ("The products implement different versions of the standard, which "
          "conformance claims do not distinguish", False),
         ("Conformance testing verifies behaviour that differs from what "
          "interoperation between products requires", False)],
        "Standards contain optional features that implementations may choose "
        "differently, and ambiguities different readers resolve differently. "
        "Profiles narrowing a standard to a defined subset, together with "
        "interoperability testing between actual implementations, are how "
        "this is addressed -- conformance alone does not establish it."),

    mcq("HARD",
        "The body that issued a supplier's certificate has been accredited "
        "by nobody.\n\nWhat does it demonstrate?",
        [("Very little beyond that somebody was paid", True),
         ("That the supplier conforms to the standard, since the assessment "
          "was performed by an independent party", False),
         ("That the supplier has self-declared conformance and had that "
          "declaration reviewed externally", False),
         ("That the standard was applied, though possibly with less rigour "
          "than an accredited body would use", False)],
        "Accreditation is the layer that governs who may certify, and a "
        "certificate's value rests entirely on it. Without it there is no "
        "external assurance that the assessment met any defined requirement, "
        "which is why checking the accreditation rather than the certificate "
        "is the useful action."),

    mcq("AVERAGE",
        "Certification is held for an information security management "
        "system.\n\nWhat has it demonstrated?",
        [("A systematic approach, not an assured outcome", True),
         ("That its security controls are appropriate to the risks its "
          "systems are actually exposed to", False),
         ("That a breach of its systems would not be attributable to any "
          "failure on its own part", False),
         ("That every control listed in the standard has been implemented "
          "throughout the organisation", False)],
        "Management system standards define how a function is run -- policy, "
        "responsibilities, measurement, audit, improvement -- and are "
        "auditable for that reason. They evidence diligence and support "
        "accountability obligations; they do not establish that a particular "
        "outcome will be achieved."),

    mcq("HARD",
        "Having participated in developing a standard and stayed silent, a "
        "patent holder asserts an essential patent after adoption.\n\nWhy is this treated as a serious abuse?",
        [("Everybody who implemented the standard has been "
          "captured", True),
         ("Patents covering standardised technology cannot be enforced once "
          "the standard has been published", False),
         ("Participation in a standards body transfers ownership of "
          "essential patents to that body", False),
         ("The patent becomes invalid because the technology was disclosed "
          "publicly during development", False)],
        "Adoption commits implementers, who then cannot change course "
        "without abandoning conformance, so an assertion afterwards extracts "
        "terms nobody could have negotiated beforehand. This is precisely "
        "why participants carry obligations to disclose essential patents "
        "and to license them on fair and non-discriminatory terms."),

    mcq("AVERAGE",
        "Implementing a freely published specification requires licensing "
        "patents on terms the holder sets at will.\n\nIs it an "
        "open standard?",
        [("No, because implementation is not actually open", True),
         ("Yes, because the specification itself is available to anybody "
          "who wishes to read it", False),
         ("Yes, provided the licensing terms are applied consistently to "
          "every implementer who requests them", False),
         ("Only where the patent holder participated in developing the "
          "specification concerned", False)],
        "Openness concerns who can implement rather than who can read. A "
        "specification anybody may study and nobody may implement without "
        "accepting whatever terms are offered is closed in the sense that "
        "determines competition, which is why open standards require "
        "licensing on reasonable and non-discriminatory terms."),

    mcq("AVERAGE",
        "Iterative methods are in use, and a software life cycle process "
        "standard is adopted.\n\nIs there a conflict?",
        [("No -- such standards define what processes exist, not "
          "how", True),
         ("Yes, because life cycle standards assume that phases are "
          "completed sequentially before the next begins", False),
         ("Yes, because iterative methods repeat processes that the "
          "standard expects to occur only once", False),
         ("Only where the organisation also seeks certification against the "
          "standard rather than merely using it", False)],
        "Life cycle standards specify which processes a project should "
        "contain -- requirements, design, verification, and the rest -- "
        "without prescribing how or in what order they are performed. They "
        "are therefore compatible with sequential and iterative methods "
        "alike, which is a distinction items test directly."),

    mcq("HARD",
        "No law or contract requires a particular standard, and an "
        "organisation departs from it.\n\nWhat is the residual "
        "significance?",
        [("It describes what a competent organisation would have "
          "done", True),
         ("None, since a standard without legal or contractual force "
          "imposes no obligation of any kind", False),
         ("The organisation must notify the publishing body of its reasons "
          "for departing from the standard", False),
         ("The departure invalidates any related certification the "
          "organisation holds against other standards", False)],
        "Where negligence or reasonableness is assessed after something goes "
        "wrong, published standards supply the reference for what competent "
        "practice looks like. Departing is permitted and shifts the burden "
        "of justification, which operates quietly and matters considerably "
        "at exactly the wrong moment."),

    mcq("AVERAGE",
        "Existing implementations are broken by a revision to a standard.\n\nWhat usually follows?",
        [("A long period during which both versions are in use", True),
         ("Rapid migration, because implementations that no longer conform "
          "cannot be described as standard", False),
         ("Withdrawal of the revision, since standards bodies do not "
          "publish changes that break conformance", False),
         ("Adoption of the revision only by new implementations, with "
          "existing ones remaining on the previous version", False)],
        "Nobody controls the coordination that rapid migration would "
        "require, so both versions persist for years and implementations "
        "must handle each. This frequently costs more than the accumulated "
        "compromise the breaking change was intended to remove, which is why "
        "backward compatibility is preserved where it can be."),
]


LESSON_STD = lesson(
    MAJOR, MIDDLE,
    "Standardisation and Standards Bodies",
    _std_quiz,
    lesson_structure(
        "Standardisation and Standards Bodies",
        "Everything in this certification interoperates because of "
        "agreements written down as standards, and the distinction that "
        "matters is between DE JURE standards agreed through a formal "
        "consensus process and DE FACTO ones established by adoption alone "
        "-- because adoption rather than authority decides what actually "
        "binds. This closing lesson covers how formal standards are made and "
        "why they are slow, the main bodies by domain, conformance against "
        "accredited CERTIFICATION, why two conforming products may not "
        "interoperate, patents in standards, and the mechanisms by which "
        "voluntary standards acquire force.",
        [
            "Distinguish standards by publishing level",
            "Distinguish de jure from de facto",
            "Explain why formal standards development is slow",
            "Identify the main standards bodies by domain",
            "Distinguish self-declaration from accredited certification",
            "Explain why conformance does not guarantee interoperability",
            "Explain the patent obligations in standards development",
            "State how voluntary standards acquire force",
        ],
        75,
        _std_sections,
        [
            ("De jure against de facto",
             "Formal consensus against adoption alone -- and adoption "
             "constrains implementers more."),
            ("Why formal standards are slow",
             "Every substantive objection must be addressed, which is also "
             "where the value is."),
            ("Accreditation",
             "A certificate is worth what the accreditation behind the "
             "certifier is worth."),
            ("Management system standards",
             "Evidence a systematic approach, not an assured outcome."),
            ("Conformance against interoperability",
             "Optional features and ambiguity mean profiles and testing are "
             "still required."),
            ("Essential patents",
             "Disclosed during development and licensed on fair terms; "
             "silence then assertion captures implementers."),
            ("Open standards",
             "Openness is about who may IMPLEMENT, not who may read."),
            ("Life cycle standards",
             "Define what processes exist, not how -- so they suit iterative "
             "and sequential work alike."),
        ],
        "Standards are the agreements that let everything in this "
        "certification work with everything else. They are published at "
        "international, regional, national and industry level, and the "
        "distinction that decides most items is between DE JURE standards "
        "produced by a formal consensus process and DE FACTO ones "
        "established by adoption alone -- because a widely implemented "
        "format binds more tightly than a published one nobody uses. Formal "
        "development is slow because every substantive objection must be "
        "answered, which is where its value comes from. Conformance may be "
        "self-declared, assessed by a customer, or certified by an "
        "ACCREDITED third party, and a certificate is worth exactly what its "
        "accreditation is. Management system standards evidence a systematic "
        "approach rather than an outcome. Two conforming products may still "
        "fail to interoperate, because standards contain optional features "
        "and ambiguities that PROFILES and interoperability testing address. "
        "Essential patents must be disclosed and licensed on fair terms, "
        "since silence followed by assertion captures every implementer. And "
        "voluntary standards acquire force through legislation, guidance, "
        "contract, sector rules -- and quietly, as the description of what a "
        "competent organisation would have done.",
        exam_notes=[
            desc(
                "Items describe a standards situation and ask what follows "
                "from it."
            ),
            ul([
                "Comparing what a de facto and a de jure standard bind.",
                "Explaining the pace of consensus development.",
                "Diagnosing non-interoperation between conforming "
                "products.",
                "Assessing an unaccredited certificate.",
                "Stating what a certified management system demonstrates.",
                "Explaining why late patent assertion is an abuse.",
                "Judging openness by implementability.",
                "Applying a life cycle standard to iterative work.",
            ]),
            desc(
                "For any item here, ask who actually implements the standard "
                "and who stands behind the claim of conformance. Adoption "
                "and accreditation settle most answers, and neither follows "
                "from a document's formal status."
            ),
        ],
    ))


LESSONS = [LESSON_STD]
