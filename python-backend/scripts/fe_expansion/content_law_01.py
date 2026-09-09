"""Corporate and Legal Affairs -> Legal Affairs, lessons 1 and 2.

Intellectual property rights in IT, and laws on information security and
cybercrime.

These lessons are written to the shape of the obligations rather than to any
one country's statute book, because that is what the certification tests and
what an engineer can actually carry between jurisdictions.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Corporate and Legal Affairs"
MIDDLE = "Legal Affairs"


# ==========================================================================
# Lesson 1: Intellectual property rights in IT
# ==========================================================================

_ip_sections = [
    ("What the Law Protects", [
        desc(
            "Intellectual property is a set of separate protections, each "
            "covering something different and each arising differently. "
            "Exam items almost always turn on which protection applies "
            "rather than on the details of any one of them."
        ),
        image(fig("ip-rights")),
        table(
            ["Right", "Protects", "Arises", "Lasts"],
            [["Copyright", "The expression of a work",
              "Automatically, on creation",
              "Decades beyond the author's life"],
             ["Patent", "An invention that is new and useful",
              "By registration and examination", "About twenty years"],
             ["Trade mark", "A sign identifying a trader",
              "By registration, and by use in some places",
              "Renewable indefinitely"],
             ["Trade secret", "Anything of value kept secret",
              "By keeping it secret", "Until it is disclosed"],
             ["Design right", "The appearance of a product",
              "By registration in most jurisdictions",
              "A fixed term of years"]],
            caption="Five protections, distinguished by what they cover.",
            footer="COPYRIGHT arising automatically is the fact most often "
                   "misunderstood. Nothing has to be registered, marked or "
                   "declared: writing the code creates the copyright, and "
                   "the absence of a notice means nothing at all."),
    ]),

    ("Copyright in Software", [
        desc(
            "Software is protected as a literary work in most legal systems, "
            "which has a specific consequence."
        ),
        ul([
            "The source code and the compiled program are both protected as "
            "expression.",
            "The protection arises when the code is written, with no "
            "registration required.",
            "It covers the code AS WRITTEN, not the idea the code "
            "implements.",
            "Somebody writing their own program to do the same thing has "
            "infringed nothing.",
            "Copying, adapting or distributing without permission is "
            "infringement whether or not money changed hands.",
        ]),
        desc(
            "The third and fourth points together are the whole of the "
            "idea-expression distinction. Copyright would otherwise give one "
            "author a monopoly on a function, which is what patents do "
            "deliberately and copyright is specifically constructed to avoid."
        ),
    ]),

    ("Who Owns Work Made at Work", [
        desc(
            "The default ownership of software written by an employee differs "
            "from that of software written by a contractor, and the "
            "difference surprises people."
        ),
        compare_grid(
            "EMPLOYEE AGAINST CONTRACTOR",
            "The same work, two different default owners.",
            [("Employee",
              ["Written in the course of employment",
               "The employer generally owns it by default",
               "No assignment document is usually needed",
               "The employee keeps moral rights where those exist"]),
             ("Contractor",
              ["Written under a contract for services",
               "The AUTHOR generally owns it by default",
               "The client gets only what the contract assigns",
               "Paying for it does not transfer copyright by itself"])]),
        desc(
            "The right-hand column is where organisations discover a problem "
            "years later. A client who commissioned software and did not "
            "obtain an assignment holds a licence at best, and may find they "
            "cannot modify or resell what they believe they own."
        ),
    ]),

    ("Patents and Software", [
        desc(
            "Whether software can be patented is one of the areas where "
            "jurisdictions genuinely differ, and the syllabus expects that "
            "to be acknowledged."
        ),
        ol([
            "A patent requires an invention that is new, involves an "
            "inventive step, and is capable of industrial application.",
            "It is granted only after application, examination and "
            "publication.",
            "Publication is the bargain: the invention is disclosed in "
            "exchange for a period of exclusivity.",
            "Some jurisdictions exclude computer programs as such, allowing "
            "them only where a technical effect is produced.",
            "Others grant software patents far more readily, which is why "
            "the same product's position varies by country.",
        ]),
        desc(
            "Step three is the point that distinguishes a patent from a "
            "trade secret. A patent is published and therefore teachable to "
            "everybody, and its protection is a time-limited right to stop "
            "others using it -- which is the opposite trade from secrecy."
        ),
    ]),

    ("Trade Secrets", [
        desc(
            "Some of the most valuable technology is protected by nothing "
            "more than being kept secret."
        ),
        ul([
            "Protection requires that the information has value BECAUSE it "
            "is secret.",
            "It requires that reasonable steps were actually taken to keep "
            "it secret.",
            "It lasts indefinitely, and ends the moment the secret is "
            "genuinely out.",
            "It gives no protection against somebody independently "
            "discovering the same thing.",
            "Reverse engineering is lawful in many jurisdictions, which "
            "makes secrecy a weak protection for anything shipped.",
        ]),
        desc(
            "The second point has a practical consequence for engineers. "
            "Access controls, confidentiality agreements and marking are not "
            "merely good practice -- they are the evidence that the "
            "information was treated as a secret, without which the claim "
            "generally fails."
        ),
    ]),

    ("Trade Marks", [
        desc(
            "Trade marks protect the association between a sign and a trader "
            "rather than any underlying technology."
        ),
        ul([
            "They cover names, logos and other signs that identify the "
            "source of goods or services.",
            "They are registered for particular classes of goods and "
            "services, not universally.",
            "They can be renewed indefinitely, so long as they continue to "
            "be used.",
            "A mark that becomes the general word for the product can be "
            "lost.",
            "Domain names and application names collide with trade marks "
            "routinely, and the mark generally prevails.",
        ]),
        desc(
            "The last point is the one that reaches engineers directly. "
            "Choosing a product name that duplicates somebody's mark in the "
            "same class produces a demand to stop using it, usually after "
            "the name has been built into everything."
        ),
    ]),

    ("Licensing", [
        desc(
            "A licence is permission to do something that would otherwise "
            "infringe, and its terms are the whole of what is permitted."
        ),
        table(
            ["Term", "Means"],
            [["Exclusive",
              "Only the licensee may use it, including not the owner"],
             ["Sole",
              "Only the licensee and the owner"],
             ["Non-exclusive",
              "Others may be licensed too, which is the usual case"],
             ["Scope",
              "The territory, field, duration and permitted uses"],
             ["Sub-licensing",
              "Whether the licensee may pass rights on, which is separate"]],
            caption="Five licensing terms an engineer meets in contracts.",
            footer="SCOPE is what disputes are actually about. A licence for "
                   "internal use does not permit offering the software to "
                   "customers as a service, and that distinction has ended "
                   "more commercial relationships than any other term."),
    ]),

    ("Open Source Licences", [
        desc(
            "Open source is licensed rather than unowned, and the licences "
            "impose conditions that bind whoever accepts them."
        ),
        compare_grid(
            "PERMISSIVE AGAINST COPYLEFT",
            "Two families with different conditions.",
            [("Permissive",
              ["Use, modify and distribute freely",
               "Attribution and notice must be preserved",
               "Derived work may be closed",
               "Suits inclusion in a commercial product"]),
             ("Copyleft",
              ["Use, modify and distribute freely",
               "Derived work must be released under the same terms",
               "Source must be offered to recipients",
               "The obligation is triggered by distribution"])]),
        desc(
            "The last point on the right decides most real cases. Strong "
            "copyleft obligations generally attach when software is "
            "DISTRIBUTED, so internal use is unaffected -- and some licences "
            "extend the trigger to providing the software as a network "
            "service, which is exactly what catches organisations out."
        ),
    ]),

    ("Licence Compatibility", [
        desc(
            "Combining components under different licences is a legal "
            "operation with a definite answer, and it is not always yes."
        ),
        ol([
            "Establish what every component in the product is licensed "
            "under, including transitive dependencies.",
            "Establish what each licence requires when the product is "
            "distributed.",
            "Check that the obligations can all be satisfied "
            "simultaneously.",
            "Where two licences impose contradictory conditions, the "
            "components cannot lawfully be combined and shipped.",
            "Record the result, since demonstrating compliance requires the "
            "record.",
        ]),
        desc(
            "Step one is the practical difficulty. A modern application "
            "pulls in hundreds of packages whose own dependencies were never "
            "reviewed, which is why automated dependency scanning has become "
            "part of the build rather than an occasional audit."
        ),
    ]),

    ("Software Licence Compliance", [
        desc(
            "Commercial licences carry counting obligations that "
            "organisations breach without intending to."
        ),
        ul([
            "Licences may be counted per user, per device, per processor or "
            "per core.",
            "Virtualisation changes the count in ways the licence terms "
            "define and administrators do not always read.",
            "Development, test and disaster recovery copies may or may not "
            "need licensing.",
            "Suppliers have contractual audit rights, and use them.",
            "The remedy for under-licensing is usually paying for the "
            "shortfall plus a penalty, retrospectively.",
        ]),
        desc(
            "The second point is where large unexpected bills come from. "
            "Running a licensed product on a virtualised cluster can require "
            "licensing every processor the software could run on, rather "
            "than the ones it does run on."
        ),
    ]),

    ("Data and Database Rights", [
        desc(
            "The contents of a database and the database itself are "
            "protected differently, and in some jurisdictions separately."
        ),
        ul([
            "Copyright may protect the selection and arrangement, where "
            "these involved judgement.",
            "Facts themselves are generally not protected, however "
            "expensive they were to gather.",
            "Some jurisdictions grant a separate database right for "
            "substantial investment in obtaining and verifying contents.",
            "Contractual terms frequently supply protection where the law "
            "does not.",
            "Personal data carries obligations regardless of who owns the "
            "database.",
        ]),
        desc(
            "The last point is worth separating. Ownership of a database and "
            "the right to use the personal data in it are different "
            "questions, and lawful ownership confers no permission to "
            "process personal data outside what the data protection rules "
            "allow."
        ),
    ]),

    ("Infringement and Its Consequences", [
        desc(
            "What happens when a right is infringed is a matter of remedies "
            "rather than only prohibition."
        ),
        table(
            ["Remedy", "Effect"],
            [["Injunction", "An order to stop, which can be immediate"],
             ["Damages", "Compensation for the loss caused"],
             ["Account of profits",
              "Handing over what was gained from the infringement"],
             ["Delivery up or destruction",
              "Surrendering infringing material"],
             ["Criminal sanction",
              "Where infringement is commercial and deliberate"]],
            caption="Five remedies for infringement.",
            footer="An INJUNCTION is what makes infringement an operational "
                   "risk rather than merely a financial one. An order to "
                   "stop distributing a product can arrive before any "
                   "question of compensation is settled."),
    ]),

    ("Innocent Infringement", [
        desc(
            "Not knowing that something was protected is a weaker defence "
            "than people assume."
        ),
        ul([
            "Infringement generally does not require intent -- copying is "
            "copying.",
            "Absence of a copyright notice does not mean the work is "
            "unprotected.",
            "Material found on the internet is protected exactly as much as "
            "material found anywhere else.",
            "Good faith may reduce damages in some systems and rarely "
            "removes liability.",
            "It does not prevent an injunction, which is frequently the "
            "consequence that matters.",
        ]),
        desc(
            "For engineers the third point is the practical one. Code, "
            "images and text found through a search engine carry their "
            "owner's rights with them, and using them in a product is a "
            "decision requiring a licence rather than a discovery."
        ),
    ]),

    ("Moral Rights", [
        desc(
            "Some jurisdictions grant authors rights that remain with them "
            "even after the economic rights are transferred."
        ),
        ul([
            "The right to be identified as the author of a work.",
            "The right to object to derogatory treatment of it.",
            "These generally cannot be sold, though they can sometimes be "
            "waived.",
            "They persist after the copyright itself has been assigned to "
            "somebody else.",
            "Their application to software varies considerably between "
            "jurisdictions.",
        ]),
        desc(
            "The practical relevance is that acquiring copyright in a work "
            "is not necessarily acquiring everything. Where moral rights "
            "exist and were not waived, the original author retains a "
            "position that the purchaser cannot extinguish."
        ),
    ]),

    ("Employee Obligations", [
        desc(
            "An engineer moving between employers carries obligations that "
            "outlast the employment."
        ),
        ol([
            "Confidential information belonging to a former employer remains "
            "confidential.",
            "The general skill and knowledge acquired belongs to the "
            "engineer and can be used freely.",
            "The boundary between the two is the substance of most "
            "disputes.",
            "Restrictive covenants may limit competing for a period, and "
            "are enforceable only within reason.",
            "Taking documents or code on leaving converts an ambiguous "
            "situation into a clear one, against the engineer.",
        ]),
        desc(
            "Step five is the practical advice contained in this whole "
            "lesson. What somebody remembers is theirs; what they copied is "
            "not, and the existence of the copy removes any argument about "
            "which side of the line their knowledge fell."
        ),
    ]),

    ("Rights in Commissioned Work", [
        desc(
            "Organisations frequently commission software and receive less "
            "than they expected."
        ),
        content_accordion(
            "WHAT A COMMISSIONING CONTRACT SHOULD SETTLE",
            "Each is an assumption that fails if left unstated.",
            [("Who owns the copyright",
              "The author does by default under a contract for services, so "
              "an assignment is required if the client is to own it."),
             ("What the client may do without owning it",
              "A licence may be sufficient, but its scope -- modification, "
              "sub-licensing, resale -- has to be stated."),
             ("Whether the supplier may reuse it",
              "Suppliers frequently reuse components across clients, which "
              "is reasonable and must be agreed rather than assumed."),
             ("What happens to third-party components",
              "The supplier cannot assign what they do not own, so "
              "components they licensed pass on their own terms."),
             ("Access to source code",
              "Owning the copyright is worth little without the source, "
              "which is why escrow arrangements exist.")]),
    ]),

    ("Source Code Escrow", [
        desc(
            "Where a client depends on software they do not hold the source "
            "for, escrow is the standard arrangement."
        ),
        ul([
            "The supplier deposits the source with an independent third "
            "party.",
            "The client receives it only on defined trigger events -- "
            "usually the supplier's failure or a breach of support "
            "obligations.",
            "The deposit must be verified, since an untested deposit may not "
            "build.",
            "It must be kept current, since a deposit made once is "
            "worthless within a year.",
            "It gives the client continuity, not ownership.",
        ]),
        desc(
            "The third and fourth points are what distinguish a working "
            "escrow from a comforting one. An arrangement nobody verifies "
            "or updates delivers, at the moment it is needed, an archive "
            "that cannot be compiled."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "Intellectual property reaches practice in several other "
            "categories."
        ),
        content_tabs(
            "WHERE THIS APPEARS ELSEWHERE",
            "Each tab is a category this lesson touches.",
            [("Development technology", "Dependencies and builds",
              "Licence compatibility is checked in the build, because a "
              "modern application's dependency tree is too large to review "
              "by hand and the obligations attach on distribution."),
             ("Service management", "Supplier agreements",
              "Licence counting, audit rights and escrow are terms in the "
              "agreements service management is responsible for holding "
              "suppliers to."),
             ("Security", "Trade secrets and access control",
              "The reasonable steps that make a trade secret protectable "
              "are the ordinary access controls of the security category, "
              "used as legal evidence."),
             ("Database", "Data rights",
              "Who owns a dataset, whether facts within it are protected, "
              "and what may be done with personal data in it are three "
              "separate questions."),
             ("Business strategy", "What a company actually owns",
              "A technology company's value is largely intellectual "
              "property, so how it arises and who holds it is a strategic "
              "matter rather than an administrative one.")]),
    ]),

    ("Common Mistakes", [
        desc("Where intellectual property items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Thinking copyright must be registered or marked",
              "It arises automatically on creation, and the absence of a "
              "notice means nothing.",
              "Items describe unmarked material to test this."),
             ("Thinking copyright protects the idea",
              "It protects the expression. An independently written program "
              "doing the same thing infringes nothing.",
              "Patents protect function; copyright deliberately does not."),
             ("Assuming paying for commissioned work transfers copyright",
              "Under a contract for services the author owns it by default, "
              "and an assignment is required.",
              "Employment is the case where the employer owns it."),
             ("Thinking copyleft obligations attach on use",
              "They generally attach on DISTRIBUTION, with some licences "
              "extending that to network services.",
              "Internal use is usually unaffected."),
             ("Treating reverse engineering as automatically unlawful",
              "It is permitted in many jurisdictions, which is what makes "
              "trade secrecy weak for shipped products.",
              "Contract terms may restrict it where law does not.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("How does copyright arise?",
              "Automatically, on creation, with no registration, marking or "
              "declaration required.",
              "Its absence proves nothing about protection."),
             ("What does copyright in software cover?",
              "The code as expression, not the idea it implements.",
              "Independent creation of the same function is not "
              "infringement."),
             ("Who owns commissioned software by default?",
              "The author, under a contract for services. Employment "
              "reverses this.",
              "Payment alone assigns nothing."),
             ("What triggers strong copyleft obligations?",
              "Distribution, with some licences extending to network "
              "service provision.",
              "Internal use generally does not."),
             ("What does trade secret protection require?",
              "Value from secrecy, and reasonable steps actually taken to "
              "keep it secret.",
              "The controls are the evidence."),
             ("Why does an injunction matter more than damages?",
              "It can stop distribution immediately, before compensation is "
              "even considered.",
              "It makes infringement an operational risk.")]),
    ]),
]


_ip_quiz = [
    mcq("AVERAGE",
        "Source code is published on a public repository with no copyright "
        "notice and no licence.\n\nWhat may others lawfully do with it?",
        [("Nothing beyond what the law itself permits", True),
         ("Use it freely, since publishing it without restriction "
          "constitutes permission to do so", False),
         ("Use it provided the original author is credited clearly in any "
          "derived work produced", False),
         ("Use it for non-commercial purposes, which is permitted where no "
          "licence has been stated", False)],
        "Copyright arises automatically on creation and the absence of a "
        "notice means nothing at all. Without a licence granting permission, "
        "there is no permission -- which is why an unlicensed public "
        "repository is more restrictive than a licensed one rather than less."),

    mcq("HARD",
        "An engineer writes a program performing the same function as a "
        "competitor's, without seeing its code.\n\nHas copyright been "
        "infringed?",
        [("No -- copyright protects expression, not the idea", True),
         ("Yes, because the resulting program performs substantially the "
          "same function as the original", False),
         ("Yes, if the competitor's program was on the market first and is "
          "protected in that territory", False),
         ("Only where the two programs produce output that users cannot "
          "distinguish between", False)],
        "The idea-expression distinction is fundamental to copyright: it "
        "protects the code as written and not the function it performs. "
        "Protecting a function is what patents do deliberately, and whether "
        "a patent exists is a separate question with a different answer in "
        "different jurisdictions."),

    mcq("AVERAGE",
        "Software is commissioned from an external supplier under a contract "
        "for services and paid for in full.\n\nWho owns the copyright by "
        "default?",
        [("The supplier who wrote it", True),
         ("The client, because commissioning and paying for work transfers "
          "the rights in what was produced", False),
         ("Both parties jointly, since one supplied the specification and "
          "the other supplied the implementation", False),
         ("The client, but only for the portions written specifically for "
          "them rather than reused", False)],
        "Under a contract for services the author retains copyright unless "
        "it is assigned in writing, and payment alone assigns nothing. This "
        "reverses for employees, where the employer generally owns work "
        "created in the course of employment -- and the difference is "
        "discovered by clients years later when they try to modify or resell."),

    mcq("HARD",
        "A component under a strong copyleft licence is used inside a "
        "system operated only internally.\n\nWhat obligation "
        "arises?",
        [("Generally none, since the obligation attaches on "
          "distribution", True),
         ("The source of the whole system must be published, because the "
          "component has been combined with it", False),
         ("The source must be made available to any employee of the "
          "organisation who asks to see it", False),
         ("The licence terms must be accepted formally before the component "
          "may be used in any system", False)],
        "Strong copyleft conditions are triggered by conveying the software "
        "to somebody else, so purely internal use generally triggers "
        "nothing. The exception worth knowing is that some licences extend "
        "the trigger to providing the software to users over a network, "
        "which catches organisations that assumed a service is not "
        "distribution."),

    mcq("AVERAGE",
        "Trade secret protection is claimed over a process, and no access "
        "controls or confidentiality terms were ever applied.\n\nWhat is the "
        "likely outcome?",
        [("The claim fails, because reasonable steps were not taken", True),
         ("The claim succeeds if the information can be shown to have "
          "genuine commercial value to competitors", False),
         ("The claim succeeds provided the information was never actually "
          "disclosed to anybody outside the organisation", False),
         ("The claim is converted into a copyright claim over the "
          "documentation describing the process", False)],
        "Trade secret protection requires both that the information derives "
        "value from being secret and that reasonable steps were actually "
        "taken to keep it so. Access controls, confidentiality agreements "
        "and marking are the evidence of those steps, which is why their "
        "absence generally defeats the claim regardless of the "
        "information's value."),

    mcq("AVERAGE",
        "An organisation must decide between patenting an invention and "
        "keeping it secret.\n\nWhat does patenting require it to accept?",
        [("Publication of the invention", True),
         ("A limit on the price it may charge others for licensing the "
          "invention during the term", False),
         ("An obligation to work the invention commercially within a "
          "specified period after grant", False),
         ("Loss of the ability to bring proceedings against independent "
          "inventors of the same thing", False)],
        "A patent is a bargain: the invention is disclosed publicly, "
        "teaching it to everybody, in exchange for a period during which "
        "others may be stopped from using it. Secrecy takes the opposite "
        "trade -- indefinite protection with no exclusivity against anybody "
        "who discovers the same thing independently."),

    mcq("HARD",
        "A licensed product is run on a virtualised cluster and the supplier "
        "audits, producing a large unexpected bill.\n\nWhat most commonly "
        "causes this?",
        [("The terms count processors the software could run on", True),
         ("Virtual machines are licensed at a higher rate than physical "
          "machines under most agreements", False),
         ("Each virtual machine created during the period counts as a "
          "separate installation of the product", False),
         ("Licences purchased for physical deployment cannot be applied to "
          "virtualised deployment at all", False)],
        "Many commercial licences count the processors or cores across which "
        "the software could be executed rather than those it actually ran "
        "on, so a product deployed on two hosts within a large cluster can "
        "require licensing the cluster. This is defined in the terms and is "
        "routinely not read by the people configuring the cluster."),

    mcq("AVERAGE",
        "Images found through a search engine are used in a commercial "
        "product.\n\nWhat is the position?",
        [("They are protected exactly as any other work", True),
         ("They may be used where no watermark or copyright notice appears "
          "anywhere on the image itself", False),
         ("They may be used provided the source page is credited "
          "alongside them in the product", False),
         ("They may be used where they were indexed by a search engine "
          "without objection from the owner", False)],
        "Being findable is not being licensed. Material on the internet "
        "carries its owner's rights unchanged, so using it requires a "
        "licence just as any other work would. Infringement also generally "
        "requires no intent, so believing the material to be free does not "
        "prevent an injunction."),

    mcq("HARD",
        "An engineer leaves for a competitor, taking no files but "
        "considerable knowledge of the former employer's methods.\n\nWhat is "
        "the position?",
        [("General skill and knowledge is theirs; specific confidential "
          "information is not", True),
         ("Everything learned during the employment remains the property of "
          "the former employer indefinitely", False),
         ("Everything remembered rather than copied may be used freely, "
          "since memory cannot be surrendered", False),
         ("Nothing may be used until any restrictive covenant in the "
          "contract has expired in full", False)],
        "The boundary between general skill acquired through work and "
        "specific confidential information is where these disputes are "
        "fought. What makes it decisive in practice is documents: taking "
        "code or files removes any argument about which side of the line "
        "the knowledge fell on, and does so against the engineer."),

    mcq("AVERAGE",
        "A source code escrow arrangement has been in place for four years "
        "with no verification or updated deposits.\n\nWhat has the client "
        "actually secured?",
        [("Very little, since an unverified stale deposit may not "
          "build", True),
         ("Full continuity, because the deposit constitutes a complete copy "
          "of the software as delivered", False),
         ("Ownership of the software, which transfers automatically once "
          "the trigger events occur", False),
         ("A licence to the current version, which the escrow agent obtains "
          "from the supplier on request", False)],
        "Escrow delivers continuity only if the deposit is current and has "
        "been verified as buildable. An arrangement nobody maintains "
        "produces, at exactly the moment it is needed, an archive several "
        "versions out of date that may not compile -- and escrow confers "
        "continuity rather than ownership in any case."),
]


LESSON_IP = lesson(
    MAJOR, MIDDLE,
    "Intellectual Property Rights in IT",
    _ip_quiz,
    lesson_structure(
        "Intellectual Property Rights in IT",
        "Intellectual property is several separate protections and items "
        "turn on WHICH one applies. COPYRIGHT arises automatically on "
        "creation, needs no notice, and protects the code as expression "
        "rather than the idea -- so independent creation infringes nothing. "
        "PATENTS protect function and are bought with publication; TRADE "
        "SECRETS last indefinitely and require reasonable steps actually "
        "taken. Ownership defaults differ between employees and "
        "contractors, copyleft obligations attach on DISTRIBUTION, and an "
        "injunction is what makes infringement an operational risk rather "
        "than only a financial one.",
        [
            "Distinguish the five protections by what each covers",
            "Explain how copyright arises",
            "Apply the idea-expression distinction to software",
            "State the ownership default for employees and contractors",
            "Distinguish permissive from copyleft licences",
            "State what trade secret protection requires",
            "Explain the bargain a patent represents",
            "State the remedies for infringement",
        ],
        75,
        _ip_sections,
        [
            ("Copyright",
             "Arises automatically on creation; no notice required, and its "
             "absence proves nothing."),
            ("Idea against expression",
             "Copyright protects the code as written, not the function -- "
             "independent creation infringes nothing."),
            ("Ownership defaults",
             "Employers own employees' work; AUTHORS own commissioned work "
             "unless it is assigned."),
            ("Patent",
             "New, inventive, industrially applicable, and PUBLISHED in "
             "exchange for about twenty years."),
            ("Trade secret",
             "Value from secrecy plus reasonable steps actually taken; no "
             "protection against independent discovery."),
            ("Copyleft trigger",
             "Distribution, with some licences extending it to network "
             "services -- not internal use."),
            ("Licence scope",
             "Internal use does not include offering the software to "
             "customers as a service."),
            ("Injunction",
             "An order to stop, which can arrive before any question of "
             "compensation."),
        ],
        "Intellectual property is a set of separate protections and almost "
        "every item turns on which applies. COPYRIGHT arises AUTOMATICALLY "
        "on creation, requires no registration or notice, and protects "
        "software as EXPRESSION rather than as function -- so somebody "
        "writing their own program to do the same thing infringes nothing. "
        "PATENTS protect the invention itself and are bought with "
        "PUBLICATION, which is the opposite trade from a TRADE SECRET, "
        "whose protection lasts indefinitely, requires reasonable steps "
        "actually taken, and stops nobody who discovers the same thing "
        "independently. Ownership defaults differ: an employer generally "
        "owns an employee's work, and the AUTHOR generally owns commissioned "
        "work unless it is assigned, which payment alone does not do. Open "
        "source licences divide into permissive and COPYLEFT, whose "
        "obligations are triggered by DISTRIBUTION rather than use -- with "
        "some extending that to network services. And infringement generally "
        "requires no intent, so the remedy that matters is the INJUNCTION, "
        "which can stop a product before compensation is even discussed.",
        exam_notes=[
            desc(
                "Items describe a situation and ask which protection applies "
                "or who holds what."
            ),
            ul([
                "Recognising that an unlicensed public repository grants "
                "nothing.",
                "Applying the idea-expression distinction.",
                "Stating who owns commissioned software.",
                "Identifying distribution as the copyleft trigger.",
                "Explaining why a trade secret claim fails without "
                "controls.",
                "Stating what patenting requires accepting.",
                "Recognising that internet material is fully protected.",
                "Distinguishing general skill from confidential "
                "information.",
            ]),
            desc(
                "For any item here, ask first which right is in play and "
                "second how that right arises. Those two questions settle "
                "most answers before any detail of the situation is "
                "considered."
            ),
        ],
    ))


# ==========================================================================
# Lesson 2: Laws on information security and cybercrime
# ==========================================================================

_cyber_sections = [
    ("Where Law Meets Security", [
        desc(
            "Security is a technical discipline with a legal frame around "
            "it. Some acts are offences regardless of harm, some data "
            "carries obligations regardless of ownership, and some incidents "
            "must be reported regardless of how the organisation would "
            "prefer to handle them."
        ),
        image(fig("cyber-law-map")),
        table(
            ["Area", "What it regulates"],
            [["Unauthorised access",
              "Entering a system without permission, whether or not anything "
              "is taken"],
             ["Personal data protection",
              "How information about identifiable people may be used"],
             ["Electronic signatures",
              "When an electronic act has legal effect"],
             ["Retention and disclosure",
              "What must be kept, and when it must be handed over"],
             ["Cross-border transfer",
              "Where personal data may be sent, and under what conditions"]],
            caption="Five areas of information law an engineer meets.",
            footer="The first row is the one engineers most often "
                   "misunderstand. Access without authorisation is generally "
                   "an offence in itself, so no damage, no theft and good "
                   "intentions do not prevent it from being one."),
    ]),

    ("Unauthorised Access", [
        desc(
            "The core computer misuse offence in most jurisdictions is "
            "framed around authorisation rather than harm."
        ),
        ul([
            "Accessing a system or data without authorisation is generally "
            "an offence by itself.",
            "Exceeding the authorisation somebody does have is generally "
            "treated the same way.",
            "Modifying or impairing data or a system is a further and more "
            "serious offence.",
            "Making, supplying or obtaining tools for these purposes is "
            "frequently an offence too.",
            "Intent to cause harm is generally not required for the basic "
            "offence.",
        ]),
        desc(
            "The second point catches insiders rather than outsiders. "
            "Somebody with legitimate access to a system who looks at "
            "records they have no business reason to see has generally "
            "exceeded their authorisation, and their credentials do not make "
            "it lawful."
        ),
    ]),

    ("Testing and Research", [
        desc(
            "Security testing is unauthorised access unless it is "
            "authorised, and the distinction is a document."
        ),
        ol([
            "Obtain written authorisation from somebody who can actually "
            "give it.",
            "Define the scope precisely -- which systems, which addresses, "
            "which techniques.",
            "Define the period, since authorisation for one week does not "
            "cover the next.",
            "Agree what happens if something is found, including what must "
            "be reported and to whom.",
            "Stay inside all of it, because outside it the activity is "
            "simply the offence.",
        ]),
        desc(
            "The first step contains a trap. Authorisation must come from "
            "somebody with authority over the systems, which the person "
            "commissioning the test does not always have -- particularly "
            "where systems are hosted by a third party who has not "
            "consented."
        ),
    ]),

    ("Personal Data", [
        desc(
            "Most information security law that reaches engineers day to day "
            "is data protection law, and it starts with a definition."
        ),
        ul([
            "Personal data is information relating to an identifiable "
            "person, directly or indirectly.",
            "Identifiability includes what can be combined with other "
            "available information.",
            "Some categories -- health, biometrics, beliefs, and others -- "
            "carry stricter conditions.",
            "The obligations attach to whoever decides how and why the data "
            "is used.",
            "They apply regardless of who owns the database the data sits "
            "in.",
        ]),
        desc(
            "The second point is what makes anonymisation difficult. Data "
            "stripped of names may still identify people when combined with "
            "something else available, and whether a dataset is genuinely "
            "anonymous is a technical judgement with a legal consequence."
        ),
    ]),

    ("Principles of Data Protection", [
        desc(
            "The obligations are usually expressed as principles, which the "
            "syllabus expects by substance rather than by wording."
        ),
        table(
            ["Principle", "Requires"],
            [["Lawfulness and fairness",
              "A valid basis for using the data, and no deception about it"],
             ["Purpose limitation",
              "Use for the purpose collected, not whatever occurs later"],
             ["Data minimisation",
              "Only what is needed for that purpose"],
             ["Accuracy and storage limitation",
              "Kept correct, and not kept longer than needed"],
             ["Integrity and accountability",
              "Kept secure, and being able to demonstrate all of the "
              "above"]],
            caption="Five principles, condensed.",
            footer="PURPOSE LIMITATION is the one engineers breach most "
                   "readily. Data collected to deliver a service and later "
                   "used to train a model or target advertising has been "
                   "used for a new purpose, which needs its own basis."),
    ]),

    ("Lawful Basis", [
        desc(
            "Processing personal data requires a reason the law recognises, "
            "and consent is only one of them."
        ),
        ul([
            "Consent -- freely given, specific, informed and withdrawable, "
            "which makes it fragile.",
            "Contract -- necessary to deliver what the person asked for.",
            "Legal obligation -- required by law.",
            "Vital or public interest -- narrow, and rarely relevant "
            "commercially.",
            "Legitimate interests -- balanced against the person's rights, "
            "and requiring the balancing to be recorded.",
        ]),
        desc(
            "Consent is over-used and it is the weakest basis. It can be "
            "withdrawn at any time, which means a system relying on it must "
            "be able to stop processing that person's data -- an "
            "architectural requirement rather than a policy statement."
        ),
    ]),

    ("Rights of Individuals", [
        desc(
            "Data protection law gives people rights over their own data, "
            "and each one is a system requirement."
        ),
        ol([
            "Access -- a copy of what is held, which means being able to "
            "find all of it.",
            "Rectification -- correction of what is wrong, everywhere it "
            "was copied.",
            "Erasure -- deletion in defined circumstances, which backups "
            "complicate.",
            "Portability -- their data in a usable form, which implies an "
            "export capability.",
            "Objection -- stopping certain processing, which means the "
            "system must be able to.",
        ]),
        desc(
            "Every one of these is an engineering obligation disguised as a "
            "legal one. A system that cannot locate every copy of one "
            "person's data cannot satisfy the first three, and discovering "
            "that when a request arrives is far too late."
        ),
    ]),

    ("Security Obligations", [
        desc(
            "The law requires security proportionate to the risk rather than "
            "security in the abstract."
        ),
        ul([
            "Measures must be appropriate to the sensitivity of the data and "
            "the harm a breach would cause.",
            "The state of the art and the cost of implementation are taken "
            "into account.",
            "Both technical and organisational measures are required -- "
            "controls and the practices around them.",
            "The measures must be tested, since untested measures are "
            "assumptions.",
            "The organisation must be able to DEMONSTRATE all of this, not "
            "merely assert it.",
        ]),
        desc(
            "The last point changes what engineers must produce. "
            "Accountability means the evidence -- records of decisions, test "
            "results, access reviews -- is itself part of compliance, and "
            "measures nobody documented are difficult to distinguish from "
            "measures nobody took."
        ),
    ]),

    ("Breach Notification", [
        desc(
            "When personal data is compromised, most regimes impose a duty "
            "to tell somebody within a short period."
        ),
        table(
            ["Question", "Typical answer"],
            [["Who must be told",
              "The supervisory authority, and sometimes the individuals"],
             ["How quickly",
              "Within a short fixed period of becoming aware, often "
              "seventy-two hours"],
             ["What must be said",
              "What happened, what data, how many, the likely consequences, "
              "what is being done"],
             ["When individuals must be told",
              "Where the risk to them is high"],
             ["What if the facts are incomplete",
              "Report anyway, and supplement afterwards"]],
            caption="Five questions about breach notification.",
            footer="The last row defeats the instinct to investigate first. "
                   "The clock runs from awareness rather than from full "
                   "understanding, so a partial report on time is the "
                   "requirement and a complete one late is a breach of it."),
    ]),

    ("Cross-Border Transfer", [
        desc(
            "Moving personal data between countries is regulated separately "
            "from using it, which affects architecture directly."
        ),
        ul([
            "Transfer to a country judged to offer adequate protection is "
            "generally permitted.",
            "Otherwise, safeguards such as approved contractual terms are "
            "required.",
            "Some jurisdictions require certain data to remain within their "
            "borders entirely.",
            "Using a cloud region in another country is a transfer, whatever "
            "the interface suggests.",
            "So is support access from another country, which organisations "
            "frequently overlook.",
        ]),
        desc(
            "The last point is the one that catches otherwise careful "
            "designs. Data stored lawfully in one country and viewed by a "
            "support team in another has been transferred, and the "
            "arrangement needs the same safeguards as moving the database "
            "would."
        ),
    ]),

    ("Electronic Signatures and Records", [
        desc(
            "The law recognises electronic acts, with distinctions that "
            "matter when a document must hold up later."
        ),
        content_accordion(
            "FORMS OF ELECTRONIC SIGNATURE",
            "Increasing assurance, and increasing requirements.",
            [("Simple electronic signature",
              "Any electronic indication of agreement -- a typed name, a "
              "tick box. Admissible in many contexts and easy to dispute."),
             ("Advanced electronic signature",
              "Uniquely linked to the signatory, capable of identifying "
              "them, created with means under their sole control, and "
              "detecting any later alteration."),
             ("Qualified electronic signature",
              "An advanced signature based on a qualified certificate "
              "issued by a recognised provider, which in some jurisdictions "
              "is equivalent to a handwritten signature."),
             ("Electronic records",
              "Retention obligations apply to electronic records as to paper "
              "ones, including that they remain readable for the whole "
              "period."),
             ("Timestamping",
              "Evidence of when something existed, which supports both "
              "signatures and record integrity.")]),
    ]),

    ("Retention and Disclosure", [
        desc(
            "Organisations are obliged both to keep some data and to dispose "
            "of other data, and the two obligations meet."
        ),
        ul([
            "Some records must be retained for periods set by law, measured "
            "in years.",
            "Personal data must not be kept longer than the purpose "
            "requires.",
            "Where both apply, the retention obligation generally governs "
            "for those specific records.",
            "Law enforcement may compel disclosure under defined "
            "procedures.",
            "Disclosing without such a procedure may itself breach data "
            "protection obligations.",
        ]),
        desc(
            "The last point is practical advice for engineers who receive "
            "requests. A demand for data is complied with through the "
            "organisation's defined process and its legal advisers, not by "
            "the administrator who happens to have the access."
        ),
    ]),

    ("Cybercrime Beyond Access", [
        desc(
            "The syllabus expects the range of computer-related offences "
            "rather than only intrusion."
        ),
        table(
            ["Offence", "Consists of"],
            [["Fraud by electronic means",
              "Deception for gain, conducted through systems"],
             ["Identity theft",
              "Using another person's identity, generally for gain"],
             ["Distribution of malicious software",
              "Making or supplying software intended to impair systems"],
             ["Denial of service",
              "Impairing availability, which is an offence in itself"],
             ["Interception of communications",
              "Reading traffic without lawful authority"]],
            caption="Five categories of computer-related offence.",
            footer="Denial of service is worth noting separately because "
                   "nothing is accessed and nothing is taken. Impairing "
                   "availability is the harm the offence addresses, which "
                   "aligns the law with the availability limb of the "
                   "security triad."),
    ]),

    ("Jurisdiction", [
        desc(
            "Networks cross borders and law does not, which produces "
            "questions with no tidy answer."
        ),
        ul([
            "An act may be an offence where it was performed, where its "
            "effect landed, or both.",
            "Data protection obligations frequently follow the individual "
            "rather than the organisation.",
            "So an organisation in one country can be bound by another's "
            "rules by serving its residents.",
            "Enforcement depends on cooperation between authorities, which "
            "is slower than the offence.",
            "Conflicting obligations between jurisdictions genuinely exist "
            "and are resolved by lawyers rather than by engineers.",
        ]),
        desc(
            "The third point is what makes data protection a design "
            "consideration for any service with international users. "
            "Offering a service to residents of a jurisdiction generally "
            "brings its rules with it, whatever the company's own location."
        ),
    ]),

    ("Standards as Evidence", [
        desc(
            "Recognised security standards do not create legal obligations "
            "and are frequently used to discharge them."
        ),
        ul([
            "A certified management system is evidence that measures were "
            "considered and implemented systematically.",
            "It supports the accountability requirement, which asks the "
            "organisation to demonstrate compliance.",
            "It does not substitute for the specific obligations, which "
            "remain whatever the certificate says.",
            "Sector rules may effectively require it, which converts a "
            "voluntary standard into a condition of trading.",
            "Suppliers are increasingly required to hold one by their "
            "customers rather than by any law.",
        ]),
        desc(
            "The fourth and fifth points describe how voluntary standards "
            "acquire force. A standard nobody mandates but every customer "
            "requires is binding in practice, which is a commercial "
            "mechanism rather than a legal one."
        ),
    ]),

    ("The Engineer's Position", [
        desc(
            "What an individual engineer should actually do when the law "
            "touches their work is worth stating plainly."
        ),
        ol([
            "Do not access what you have no business reason to access, even "
            "where your credentials permit it.",
            "Do not test anything without written authorisation from "
            "somebody able to give it.",
            "Report a suspected breach immediately, since the clock starts "
            "at awareness rather than at certainty.",
            "Do not disclose data in response to a request outside the "
            "organisation's defined process.",
            "Raise a concern in writing, because an unrecorded concern is "
            "indistinguishable from no concern.",
        ]),
        desc(
            "The last step protects the engineer as much as the "
            "organisation. Where a decision is taken against advice, the "
            "existence of the written advice is what separates the person "
            "who raised it from the decision that was made."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "Information law constrains work throughout the certification."
        ),
        content_tabs(
            "WHERE THIS APPEARS ELSEWHERE",
            "Each tab is a category bound by this lesson.",
            [("Security", "Obligations behind the controls",
              "Access control, encryption and logging are technical "
              "measures here and evidence of compliance there, which is why "
              "the records are part of the control."),
             ("Database", "Retention, erasure and location",
              "Being able to find every copy of one person's data, delete "
              "it, and know which country it sits in are database design "
              "questions the law asks."),
             ("Service management", "Incident handling",
              "Breach notification imposes a fixed clock on the incident "
              "process, which must therefore recognise a personal data "
              "breach as its own category."),
             ("Development technology", "Privacy in design",
              "Minimisation, purpose limitation and the individual rights "
              "are requirements gathered at the start rather than "
              "retrofitted."),
             ("System strategy", "Where systems may be hosted",
              "Cross-border transfer rules constrain hosting and support "
              "arrangements, which makes them an architecture decision "
              "rather than a procurement one.")]),
    ]),

    ("Common Mistakes", [
        desc("Where information law items are lost."),
        review_cards(
            "MISTAKES THAT COST MARKS HERE",
            "Each is a plausible answer that is wrong.",
            [("Thinking no harm means no offence",
              "Unauthorised access is generally an offence in itself, "
              "regardless of damage or intent.",
              "Items describe a curious insider to test this."),
             ("Treating credentials as authorisation for everything",
              "Exceeding the authorisation one has is treated like having "
              "none for that access.",
              "Business reason, not technical ability."),
             ("Treating consent as the natural lawful basis",
              "It is the most fragile, since it is withdrawable, and "
              "contract or legitimate interests often fit better.",
              "Withdrawal must be technically possible."),
             ("Investigating fully before reporting a breach",
              "The clock runs from awareness, so a partial report on time "
              "beats a complete one late.",
              "Supplement afterwards."),
             ("Forgetting that support access is a transfer",
              "Viewing data from another country transfers it, whatever the "
              "storage location.",
              "It needs the same safeguards as moving the data.")]),
    ]),

    ("Review", [
        desc("The points items are built on."),
        review_cards(
            "WHAT TO CARRY OUT OF THIS LESSON",
            "Answer each before moving on.",
            [("What does the core computer misuse offence turn on?",
              "Authorisation, not harm. Access without it is generally an "
              "offence by itself.",
              "Exceeding your own authorisation counts."),
             ("What makes security testing lawful?",
              "Written authorisation from somebody with authority over the "
              "systems, with scope and period defined.",
              "Outside the scope it is simply the offence."),
             ("Why is consent the weakest lawful basis?",
              "It is withdrawable, so the system must be able to stop "
              "processing that person's data.",
              "That is an architectural requirement."),
             ("When does the breach notification clock start?",
              "At awareness, not at full understanding.",
              "Report partially on time and supplement."),
             ("What counts as a cross-border transfer?",
              "Any access from another country, including support staff "
              "viewing the data.",
              "Storage location alone does not settle it."),
             ("What does accountability add?",
              "The obligation to demonstrate compliance, which makes the "
              "records part of the control.",
              "Undocumented measures are hard to distinguish from "
              "absent ones.")]),
    ]),
]


_cyber_quiz = [
    mcq("HARD",
        "Customer records are read out of curiosity by an administrator with "
        "legitimate access, and nothing is changed.\n\nWhat is the legal position?",
        [("Exceeding authorisation is generally an offence in itself", True),
         ("No offence occurs, because the administrator's credentials "
          "permitted the access technically", False),
         ("No offence occurs, because nothing was altered, taken or "
          "disclosed to any third party", False),
         ("It is a matter for internal discipline only, since the access "
          "took place inside the organisation", False)],
        "The core computer misuse offence turns on authorisation rather than "
        "harm, and reading records without a business reason exceeds the "
        "authorisation held even where the credentials permit it "
        "technically. It is separately a data protection breach, since "
        "there is no lawful basis for the processing."),

    mcq("AVERAGE",
        "Security testing is to be performed against systems hosted by a "
        "third party.\n\nWhose authorisation is required?",
        [("Somebody with authority over the systems themselves", True),
         ("The client commissioning the test, who is contractually "
          "responsible for the systems concerned", False),
         ("The testing organisation's own management, which accepts the "
          "professional risk of the engagement", False),
         ("Nobody further, provided the scope is documented and the client "
          "has approved it in writing", False)],
        "Authorisation must come from a party able to give it for those "
        "systems, and a client does not always hold that authority over "
        "infrastructure operated by somebody else. Testing outside valid "
        "authorisation is simply unauthorised access, and the commissioning "
        "contract does not change that."),

    mcq("AVERAGE",
        "Data collected to deliver a service is later used to train a "
        "model.\n\nWhich principle does this engage?",
        [("Purpose limitation", True),
         ("Data minimisation, because model training generally requires "
          "considerably more data than service delivery", False),
         ("Storage limitation, because training requires the data to be "
          "retained beyond its original period", False),
         ("Accuracy, because a model trained on incorrect data will "
          "reproduce those errors in its output", False)],
        "Data may be used for the purpose it was collected for, and training "
        "a model is a new purpose requiring its own lawful basis. The other "
        "principles may also be engaged, but the change of purpose is the "
        "specific issue and the one that must be addressed first."),

    mcq("HARD",
        "Consent is relied on as a service's lawful basis.\n\nWhat "
        "architectural requirement does that create?",
        [("The ability to stop processing that person's data on "
          "withdrawal", True),
         ("A record of the exact wording shown to each individual at the "
          "moment consent was obtained", False),
         ("Encryption of the consented data at rest and in transit "
          "throughout its retention period", False),
         ("Separation of consented data from data processed on any other "
          "lawful basis available", False)],
        "Consent is freely withdrawable at any time, which means a system "
        "relying on it must be able to identify and cease processing one "
        "individual's data on request. This is why consent is the most "
        "fragile basis and why contract or legitimate interests frequently "
        "fit ordinary service delivery better."),

    mcq("AVERAGE",
        "A breach is discovered and its full extent is not yet known, with "
        "the notification deadline approaching.\n\nWhat should be done?",
        [("Report what is known and supplement afterwards", True),
         ("Complete the investigation first, since an inaccurate report "
          "would mislead the supervisory authority", False),
         ("Wait until the affected individuals have been identified so that "
          "they can be notified simultaneously", False),
         ("Report only if the investigation confirms that personal data was "
          "actually accessed by the intruder", False)],
        "The clock runs from becoming aware of the breach rather than from "
        "understanding it, and regimes expressly anticipate incomplete "
        "initial reports followed by further information. A partial report "
        "within the period satisfies the obligation; a complete one after it "
        "does not."),

    mcq("HARD",
        "Personal data is stored entirely within one country and a support "
        "team in another country views it.\n\nHas a transfer occurred?",
        [("Yes -- access from another country is a transfer", True),
         ("No, because the data itself remains stored within the original "
          "country's borders throughout", False),
         ("No, provided the support staff are employed by the same "
          "corporate group as the controller", False),
         ("Only where the support staff are able to export or download "
          "copies of the records they view", False)],
        "Making personal data available to somebody in another country is a "
        "transfer regardless of where it is stored, so the same safeguards "
        "are needed as for moving the database. Support arrangements are the "
        "most commonly overlooked route by which otherwise careful hosting "
        "designs transfer data internationally."),

    mcq("AVERAGE",
        "Nothing is accessed and nothing is taken in a denial of service "
        "attack.\n\nWhy is it nonetheless an offence?",
        [("Impairing availability is itself the harm addressed", True),
         ("The traffic sent constitutes unauthorised access to the target's "
          "network infrastructure", False),
         ("The tools used to conduct such attacks are unlawful to possess "
          "in most jurisdictions", False),
         ("The financial loss caused to the target makes it a form of fraud "
          "by electronic means", False)],
        "Computer misuse provisions cover impairing the operation of a "
        "system as a distinct offence from accessing it, which aligns the "
        "law with the availability limb of the security triad. Nothing needs "
        "to be accessed or taken for the offence to be complete."),

    mcq("AVERAGE",
        "Law enforcement contacts an administrator directly requesting "
        "customer data.\n\nWhat should the administrator do?",
        [("Refer it to the organisation's defined process", True),
         ("Provide the data, since law enforcement requests carry legal "
          "authority that must be complied with", False),
         ("Refuse, since disclosing personal data to third parties always "
          "breaches data protection obligations", False),
         ("Provide the data after recording the request and the identity of "
          "the officer making it in the audit log", False)],
        "Disclosure requires a lawful procedure, and confirming that one "
        "applies is not the administrator's judgement to make. Disclosing "
        "without it may itself breach data protection obligations, so the "
        "request goes through the organisation's defined route and its legal "
        "advisers."),

    mcq("HARD",
        "An organisation holds a recognised security certification and "
        "suffers a breach.\n\nWhat is the certification's effect?",
        [("It is evidence of systematic measures, not a defence", True),
         ("It transfers responsibility for the failure to the certifying "
          "body that issued the certificate", False),
         ("It exempts the organisation from the notification obligation "
          "where the controls were followed", False),
         ("It establishes that the security measures were appropriate to "
          "the risk that materialised", False)],
        "Certification supports the accountability requirement by "
        "demonstrating that measures were considered and implemented "
        "systematically. It does not discharge the specific obligations, "
        "which remain in full, and a breach is assessed on what was actually "
        "done rather than on what was certified."),

    mcq("AVERAGE",
        "Names and identifiers have been removed from a dataset.\n\nIs it outside "
        "data protection obligations?",
        [("Only if individuals cannot be identified by any available "
          "means", True),
         ("Yes, because the removal of direct identifiers is what "
          "anonymisation consists of", False),
         ("Yes, provided the removal cannot be reversed by anybody within "
          "the organisation holding it", False),
         ("No, because personal data remains subject to the obligations "
          "permanently once it has been collected", False)],
        "Identifiability includes what can be established by combining the "
        "data with other information reasonably available, so removing "
        "direct identifiers does not by itself anonymise a dataset. Whether "
        "re-identification is possible is a technical judgement carrying a "
        "legal consequence, and pseudonymised data remains personal data."),
]


LESSON_CYBER = lesson(
    MAJOR, MIDDLE,
    "Laws on Information Security and Cybercrime",
    _cyber_quiz,
    lesson_structure(
        "Laws on Information Security and Cybercrime",
        "The core computer misuse offence turns on AUTHORISATION rather than "
        "harm, so access without a business reason is an offence even with "
        "valid credentials and no damage done. Security testing is that "
        "offence unless written authorisation from somebody able to give it "
        "defines scope and period. Data protection then supplies most of "
        "what engineers meet daily: the principles, the lawful bases with "
        "CONSENT the most fragile because it is withdrawable, individual "
        "rights that are engineering obligations, a notification clock "
        "starting at AWARENESS, and cross-border rules that treat support "
        "access from abroad as a transfer.",
        [
            "Explain what the computer misuse offence turns on",
            "State what makes security testing lawful",
            "State the data protection principles",
            "Explain why consent is the weakest lawful basis",
            "Relate individual rights to system requirements",
            "State when breach notification is required",
            "Identify what counts as a cross-border transfer",
            "Explain what accountability requires",
        ],
        75,
        _cyber_sections,
        [
            ("Unauthorised access",
             "An offence in itself, without harm or intent; exceeding one's "
             "own authorisation counts."),
            ("Authorised testing",
             "Written authorisation from somebody able to give it, with "
             "scope and period defined."),
            ("Purpose limitation",
             "Data used for a new purpose needs a new basis -- which catches "
             "model training."),
            ("Consent",
             "Withdrawable, so the system must be able to stop processing "
             "one person's data."),
            ("Individual rights",
             "Access, rectification, erasure, portability, objection -- each "
             "a system capability."),
            ("Breach notification",
             "The clock starts at AWARENESS; report partially on time and "
             "supplement."),
            ("Cross-border transfer",
             "Access from another country is a transfer, support staff "
             "included."),
            ("Accountability",
             "Demonstrating compliance, which makes the records part of the "
             "control."),
        ],
        "Information law frames security work. The core computer misuse "
        "offence turns on AUTHORISATION rather than harm, so an insider "
        "reading records without a business reason has committed it despite "
        "valid credentials and an unchanged database -- and security testing "
        "is the same offence unless WRITTEN AUTHORISATION from somebody with "
        "authority over the systems defines scope and period. Data "
        "protection supplies the rest: the principles, of which PURPOSE "
        "LIMITATION catches data collected for a service and reused for "
        "something else; the lawful bases, of which CONSENT is weakest "
        "because it is withdrawable and therefore an architectural "
        "requirement; and individual rights that are engineering obligations "
        "in legal clothing, since a system unable to locate every copy of "
        "one person's data cannot satisfy them. Breach notification runs "
        "from AWARENESS rather than understanding, so a partial report on "
        "time is the requirement. Cross-border rules treat ACCESS from "
        "another country as a transfer, support teams included. And "
        "ACCOUNTABILITY requires demonstrating compliance, which makes the "
        "evidence part of the control rather than paperwork about it.",
        exam_notes=[
            desc(
                "Items describe conduct or an incident and ask what the law "
                "requires."
            ),
            ul([
                "Judging a curious insider with valid credentials.",
                "Identifying whose authorisation a test needs.",
                "Naming purpose limitation for a reuse of data.",
                "Deriving the architectural cost of consent.",
                "Reporting a breach before the facts are complete.",
                "Recognising support access as a transfer.",
                "Explaining why denial of service is an offence.",
                "Stating what a certification does and does not do.",
            ]),
            desc(
                "For any item here, ask whether there was a business reason "
                "and whether there was a document. Authorisation and "
                "evidence decide most answers in this area, and neither is "
                "supplied by technical ability."
            ),
        ],
    ))


LESSONS = [LESSON_IP, LESSON_CYBER]
