"""Development Technology -> System Development Technology, lessons 5 and 6.

Syllabus stages: object-oriented design with UML, and software construction.

UML is examined by READING rather than drawing -- a diagram is given and its
meaning asked for -- so the lesson concentrates on which diagram answers
which question and on the relationships that are easy to confuse.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Development Technology"
MIDDLE = "System Development Technology"

# ==========================================================================
# Lesson 5: Object-oriented design and UML
# ==========================================================================

_oo_sections = [
    ("Organising Software Around Things", [
        desc(
            "Structured design decomposed software by FUNCTION. The "
            "object-oriented approach decomposes it by the things the "
            "software is about, each holding its own data and the operations "
            "on it."
        ),
        table(
            ["", "Structured", "Object-oriented"],
            [["Decomposed by", "What the software does",
              "What the software is about"],
             ["Data and behaviour", "Held separately",
              "Held together in the object"],
             ["A change to a rule",
              "Touches wherever that rule is implemented",
              "Touches the class that owns it"],
             ["A change to a data format",
              "Touches everything that reads it",
              "Touches the class that stores it"]],
            caption="Two decompositions of the same problem.",
            footer="The last two rows are the practical claim. Keeping data "
                   "with the operations on it means a change lands in one "
                   "place -- which is the coupling and cohesion argument of "
                   "the previous lesson, applied structurally."),
    ]),

    ("The Four Principles", [
        desc(
            "The syllabus names four ideas, and the examination expects each "
            "by definition and by consequence."
        ),
        content_accordion(
            "ENCAPSULATION, ABSTRACTION, INHERITANCE, POLYMORPHISM",
            "Four terms, each with a purpose beyond the definition.",
            [("Encapsulation",
              "Data and the operations on it are held together, and the "
              "internals are hidden behind an interface. This is information "
              "hiding from the previous lesson, enforced by the language "
              "rather than by convention."),
             ("Abstraction",
              "A class presents the essential characteristics and suppresses "
              "the rest, so callers work with a simplified model. What is "
              "essential depends on the problem -- a customer means different "
              "things to billing and to marketing."),
             ("Inheritance",
              "A subclass takes the attributes and behaviour of a superclass "
              "and extends or specialises them. It expresses 'is a kind of', "
              "and it is the principle most often misapplied."),
             ("Polymorphism",
              "The same call behaves differently depending on the actual "
              "object receiving it. Code can work with a supertype and get "
              "the right behaviour without knowing which subtype it "
              "holds.")]),
        desc(
            "POLYMORPHISM is what makes inheritance useful rather than merely "
            "tidy. Without it, a caller would have to test which subtype it "
            "held and branch -- which is the long chain of conditionals that "
            "object orientation exists to remove."
        ),
    ]),

    ("Classes and Objects", [
        desc(
            "The distinction is elementary and reliably examined, because the "
            "words are used loosely in conversation."
        ),
        ul([
            "A CLASS is the definition -- what attributes and operations "
            "things of this kind have.",
            "An OBJECT is one instance of it, with its own values for those "
            "attributes.",
            "The class exists once; there may be any number of objects of "
            "it.",
            "An attribute belongs to each object; a CLASS attribute belongs "
            "to the class and is shared by all of them.",
            "A METHOD is an operation's implementation, and the same "
            "operation may be implemented differently in different "
            "subclasses.",
        ]),
        desc(
            "The class-attribute distinction appears in items because it "
            "produces a specific defect. A value intended to be per-object "
            "and declared on the class is shared by every instance, so one "
            "object's change appears in all of them -- which looks "
            "inexplicable until the declaration is examined."
        ),
    ]),

    ("Inheritance and Its Misuse", [
        desc(
            "Inheritance is the principle most often applied where it does "
            "not belong, and the syllabus expects the test."
        ),
        compare_grid(
            "IS A KIND OF, AGAINST HAS A",
            "Two relationships, and only one is inheritance.",
            [("Inheritance -- is a kind of",
              ["A savings account IS AN account",
               "Everything true of the parent is true of the child",
               "The child can be used wherever the parent is expected",
               "If that is not true, it is not inheritance"]),
             ("Composition -- has a",
              ["An order HAS order lines",
               "One object holds another and delegates to it",
               "Far more flexible, and changeable at run time",
               "The right answer far more often than people assume"])]),
        desc(
            "The test is SUBSTITUTABILITY: anywhere the parent type is "
            "expected, an instance of the child must work correctly. A square "
            "inheriting from a rectangle fails it, because code that sets a "
            "rectangle's width and height independently breaks on a square -- "
            "which is the classic illustration of a relationship that reads "
            "correctly in English and is wrong in code."
        ),
        desc(
            "Inheritance also creates the tightest coupling available: a "
            "subclass depends on its parent's internals and breaks when they "
            "change. That is why composition is preferred wherever both would "
            "work, which is more often than the vocabulary suggests."
        ),
    ]),

    ("UML and Its Diagram Families", [
        desc(
            "UML is a notation for describing designs, and the examination "
            "tests it by giving a purpose and asking which diagram serves it."
        ),
        image(fig("uml-diagram-families")),
        table(
            ["Diagram", "Answers", "Family"],
            [["Class", "What types exist and how they relate", "Structure"],
             ["Object", "What one snapshot of instances looks like",
              "Structure"],
             ["Component", "What deployable pieces exist", "Structure"],
             ["Deployment", "What runs where", "Structure"],
             ["Use case", "Who wants what from the system", "Behaviour"],
             ["Activity", "How a process flows, including parallel paths",
              "Behaviour"],
             ["State machine", "How one object reacts over its life",
              "Behaviour"],
             ["Sequence", "Which messages pass, in time order",
              "Interaction"]],
            caption="Eight diagrams and the question each answers.",
            footer="Match the QUESTION rather than the subject matter. "
                   "'What happens when an order is placed' is a sequence or "
                   "activity diagram; 'what an order consists of' is a class "
                   "diagram -- both are about orders."),
    ]),

    ("Reading a Class Diagram", [
        desc(
            "The class diagram is the one most often given in an item, and "
            "its relationships are where the marks are."
        ),
        image(fig("class-relationships")),
        table(
            ["Relationship", "Means", "Lifetime"],
            [["Association", "One knows about the other", "Independent"],
             ["Aggregation", "A whole with parts",
              "Parts survive the whole"],
             ["Composition", "A whole owning its parts",
              "Parts die with the whole"],
             ["Generalisation", "Is a kind of", "Not applicable"],
             ["Dependency", "Uses temporarily", "Independent"]],
            caption="Five relationships, with the test that separates the "
                    "middle two.",
            footer="AGGREGATION against COMPOSITION is the examined pair, and "
                   "LIFETIME decides it. Delete the team and the members "
                   "still exist -- aggregation. Delete the order and its "
                   "order lines are meaningless -- composition."),
        desc(
            "MULTIPLICITY is the other detail items turn on. The numbers at "
            "each end say how many objects may participate -- one to many, "
            "zero to one, one to exactly one -- and a zero at either end "
            "means the relationship is optional, which changes what the code "
            "must handle."
        ),
    ]),

    ("Reading a Sequence Diagram", [
        desc(
            "Sequence diagrams show messages between objects over time, and "
            "reading one correctly requires knowing what its layout means."
        ),
        ul([
            "Each participant has a vertical LIFELINE, and time runs "
            "downward.",
            "A horizontal arrow is a message from one participant to "
            "another.",
            "The ORDER of the arrows top to bottom is the order of the "
            "messages -- the diagram's whole point.",
            "A returning dashed arrow is a reply, and its absence does not "
            "mean there is none.",
            "A participant sending a message to itself shows internal work, "
            "which is why the lifeline can loop back.",
        ]),
        desc(
            "An item typically gives a diagram and asks what happens third, "
            "or which object initiates something. Both are answered by "
            "reading downwards carefully, and the usual error is treating the "
            "leftmost participant as the initiator when the first arrow "
            "starts elsewhere."
        ),
    ]),

    ("Use Case and Activity Diagrams", [
        desc(
            "Two behaviour diagrams appear regularly and are frequently "
            "confused, because both look like processes."
        ),
        compare_grid(
            "USE CASE AGAINST ACTIVITY",
            "Who wants what, against how it proceeds.",
            [("Use case diagram",
              ["Actors and the goals they pursue",
               "Shows the system's boundary and its users",
               "Says nothing about sequence",
               "Used to scope, not to specify flow"]),
             ("Activity diagram",
              ["The steps of a process, in order",
               "Shows decisions, and parallel paths",
               "Can span several use cases or several actors",
               "Used to specify flow, not to scope"])]),
        desc(
            "The distinction to carry is that a use case diagram has no "
            "sequence in it at all. The ovals are goals rather than steps, "
            "and reading them left to right as a process is the standard "
            "misinterpretation."
        ),
    ]),

    ("State Machine Diagrams", [
        desc(
            "A state machine shows how one object behaves over its lifetime, "
            "which is the question neither of the others answers."
        ),
        ol([
            "Each state is a condition the object can be in.",
            "Each transition is an event causing a move from one state to "
            "another.",
            "A transition may carry a GUARD -- a condition that must hold for "
            "it to be taken.",
            "The initial state says where an object begins; a final state is "
            "where it legitimately ends.",
            "Any event with no transition from the current state is one the "
            "object ignores or rejects.",
        ]),
        desc(
            "That last point is what makes the diagram valuable rather than "
            "decorative. It says explicitly what CANNOT happen, which is the "
            "part prose omits -- and it is why drawing one exposes the "
            "unspecified transitions the previous lesson described."
        ),
    ]),

    ("Designing With Objects", [
        desc(
            "Finding the right classes is the actual difficulty, and the "
            "syllabus offers a starting technique."
        ),
        ul([
            "Look for the NOUNS in the requirements -- they are candidate "
            "classes -- and the verbs, which are candidate operations.",
            "Discard nouns that are attributes of something else rather than "
            "things in their own right.",
            "Give each class one responsibility, which is cohesion applied to "
            "classes.",
            "Prefer telling an object to do something over asking it for data "
            "and deciding outside, or the object becomes a record and the "
            "logic scatters.",
            "Check that each relationship is real, since a class diagram with "
            "everything connected to everything has modelled nothing.",
        ]),
        desc(
            "The fourth point names a specific failure: an ANAEMIC design, "
            "where classes hold data and all the behaviour lives elsewhere. "
            "It is object syntax over structured design, and it gives up "
            "exactly the property -- data and behaviour together -- that made "
            "the approach worth adopting."
        ),
    ]),

    ("Interfaces and Abstract Classes", [
        desc(
            "Two mechanisms let unrelated classes be treated uniformly, and "
            "the syllabus distinguishes them."
        ),
        table(
            ["", "Interface", "Abstract class"],
            [["Declares", "Operations, with no implementation",
              "Some implemented, some not"],
             ["A class may have", "Several", "One, in most languages"],
             ["Expresses", "A capability -- can be compared, can be printed",
              "A partial kind of thing"],
             ["Suits", "Unrelated classes sharing a capability",
              "Related classes sharing implementation"]],
            caption="Two ways of declaring what a caller may rely on.",
            footer="An INTERFACE is the looser of the two, since it commits "
                   "to nothing about how the operation is performed. That is "
                   "why designs depend on interfaces rather than concrete "
                   "classes wherever the implementation might change."),
        desc(
            "Depending on an interface rather than a class is the practical "
            "form of the coupling advice from the design lesson. The caller "
            "commits to WHAT is provided and to nothing about who provides "
            "it, so a different implementation can be substituted without the "
            "caller being touched -- which is also what makes unit testing "
            "with a stub possible."
        ),
    ]),

    ("Component and Deployment Diagrams", [
        desc(
            "Two structure diagrams describe the system as it is built and "
            "shipped rather than as it is coded."
        ),
        ul([
            "A COMPONENT diagram shows the deployable pieces and the "
            "interfaces each provides and requires -- which is the "
            "architecture lesson's module structure, made concrete.",
            "A DEPLOYMENT diagram shows what runs on which node, and how the "
            "nodes are connected.",
            "Together they answer the operational questions: what must be "
            "installed, where, and what depends on what.",
            "They are the diagrams operations staff actually need, and the "
            "ones development most often omits.",
        ]),
        desc(
            "That last point connects back to the stakeholder omission of the "
            "requirements lesson. The people who will run a system need to "
            "know its shape at deployment, and a project documenting only "
            "classes and sequences has described the system to developers "
            "alone."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where object-oriented items are lost."),
        ul([
            "Confusing class with object. The class defines; the object is an "
            "instance.",
            "Using inheritance where composition belongs, without applying "
            "the substitutability test.",
            "Confusing aggregation with composition. Lifetime decides it.",
            "Reading a use case diagram as a sequence of steps. It has no "
            "sequence.",
            "Assuming the leftmost participant in a sequence diagram "
            "initiates the interaction.",
            "Declaring a per-object value on the class, so every instance "
            "shares it.",
            "Producing an anaemic design where classes hold data and all "
            "logic lives outside.",
            "Choosing a diagram by subject matter rather than by the question "
            "being asked.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A design has Square inheriting from Rectangle. Existing code "
            "sets a rectangle's width and height independently. What is "
            "wrong?\""
        ),
        ol([
            "State the test for inheritance: an instance of the child must "
            "work correctly anywhere the parent is expected.",
            "Existing code sets width and height independently, which is "
            "legitimate for a rectangle.",
            "A square cannot honour that -- changing one dimension must "
            "change the other, or it is not a square.",
            "So substituting a square breaks code written against a "
            "rectangle, and the inheritance is invalid however correct it "
            "sounds in English.",
            "The remedy is not inheritance: either a common abstraction both "
            "specialise, or composition, with the shape holding its "
            "dimensions rather than inheriting the ability to set them "
            "freely.",
        ]),
        desc(
            "This item is worth knowing as a pattern rather than an example. "
            "An 'is a kind of' that reads correctly in English can still fail "
            "in code, and the test is always the same: can the child be used "
            "wherever the parent is expected, by code that knows nothing "
            "about it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Object-oriented design draws on and feeds several lessons."),
        ul([
            "Encapsulation is the information hiding of the previous "
            "lesson.",
            "Inheritance's tight coupling is that lesson's coupling grades "
            "applied to classes.",
            "Class diagrams become the entity relationships of the Database "
            "category.",
            "State machines make the unspecified transitions of the software "
            "requirements lesson visible.",
            "Polymorphism removes the conditional chains the Programming "
            "lessons describe.",
            "Class-level testing is the unit testing of the next lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("The test for valid inheritance",
              "The child must work wherever the parent is expected",
              "An 'is a kind of' that reads well in English can still fail "
              "this, as square and rectangle show."),
             ("Aggregation against composition",
              "Do the parts survive the whole",
              "Team members do; order lines do not. Lifetime is the whole "
              "test."),
             ("What polymorphism removes",
              "The chain of conditionals testing which subtype this is",
              "Which is what makes inheritance useful rather than merely "
              "tidy."),
             ("Which diagram for 'what happens when'",
              "Sequence or activity, not use case",
              "A use case diagram contains no sequence at all -- the ovals "
              "are goals."),
             ("What a state machine says that prose does not",
              "What cannot happen",
              "An event with no transition from the current state is "
              "explicitly rejected."),
             ("The anaemic design failure",
              "Classes hold data, all behaviour lives outside",
              "Object syntax over structured design, giving up the property "
              "that motivated the approach.")]),
    ]),
]

_oo_quiz = [
    mcq("HARD",
        "A design has Square inheriting from Rectangle. Existing code sets a "
        "rectangle's width and height independently.\n\nWhat is the problem?",
        [("A square cannot be substituted for a rectangle without breaking "
          "that code", True),
         ("A square has fewer attributes than a rectangle, so some are "
          "unused", False),
         ("Inheritance between shapes should always be replaced by an "
          "interface", False),
         ("The rectangle class should inherit from the square, since it is "
          "more general", False)],
        "Valid inheritance requires substitutability: the child must work "
        "wherever the parent is expected, in code that knows nothing about "
        "it. Setting width and height independently is legitimate for a "
        "rectangle and impossible for a square, so substituting one breaks "
        "the other. The relationship reads correctly in English and is wrong "
        "in code, which is exactly what the test catches."),

    mcq("AVERAGE",
        "What distinguishes aggregation from composition in a class diagram?",
        [("In composition the parts do not outlive the whole", True),
         ("In composition the parts are of the same class as the "
          "whole", False),
         ("In aggregation the relationship is optional at both ends", False),
         ("In aggregation the parts may belong to only one whole", False)],
        "Lifetime is the test. A team and its members is aggregation, since "
        "deleting the team leaves the people; an order and its order lines is "
        "composition, since the lines are meaningless without the order. Both "
        "express a whole-part relationship, and only the strength of "
        "ownership separates them -- which is why this is the pair the "
        "examination asks about."),

    mcq("AVERAGE",
        "Which UML diagram shows the messages exchanged between objects in "
        "time order?",
        [("Sequence diagram", True),
         ("Class diagram, which shows how the objects relate", False),
         ("Use case diagram, which shows the interaction with "
          "actors", False),
         ("State machine diagram, which shows changes over time", False)],
        "A sequence diagram places participants along the top with lifelines "
        "running downward, so the vertical position of each arrow gives the "
        "order of messages. A state machine also concerns time and shows one "
        "object's own states rather than communication between several, and a "
        "use case diagram contains no ordering at all."),

    mcq("HARD",
        "What does polymorphism allow that inheritance alone would not?",
        [("Code holding a supertype gets the right behaviour without knowing "
          "the subtype", True),
         ("A subclass may add attributes that the superclass does not "
          "define", False),
         ("Several classes may share an implementation without duplicating "
          "it", False),
         ("An object's class may be changed after it has been "
          "created", False)],
        "Without polymorphism a caller would have to test which subtype it "
        "held and branch accordingly, which is precisely the chain of "
        "conditionals the approach exists to remove. Sharing implementation "
        "and adding attributes are what inheritance itself provides; "
        "dispatching on the actual object is what makes that inheritance "
        "useful rather than merely tidy."),

    mcq("AVERAGE",
        "Declaring a value that was intended to differ per object as a "
        "class attribute.\n\nWhat happens?",
        [("Every instance shares the one value, so one object's change "
          "appears in all", True),
         ("Each instance receives its own copy initialised from the class "
          "value", False),
         ("The value cannot be modified after the class is loaded", False),
         ("Instances created later see the value and earlier ones do "
          "not", False)],
        "A class attribute belongs to the class rather than to any instance, "
        "so all objects see the same storage. The symptom -- one object's "
        "update appearing on all of them -- looks inexplicable until the "
        "declaration is examined, which is what makes this distinction worth "
        "knowing beyond the definition."),

    mcq("HARD",
        "Nearly every class on a class diagram is connected to nearly "
        "every other.\n\nWhat does this indicate?",
        [("The relationships have not been examined, so the model says "
          "little", True),
         ("The design achieves high cohesion between related "
          "classes", False),
         ("The classes should be merged into a smaller number", False),
         ("The diagram is showing dependencies rather than "
          "associations", False),
         ],
        "A relationship on a class diagram is a claim that these two classes "
        "genuinely relate in the problem domain. Connecting everything to "
        "everything makes no claim at all and hides the structure the diagram "
        "was drawn to reveal -- and it usually signals tight coupling, since "
        "the drawn relationships tend to become real dependencies in code."),

    mcq("AVERAGE",
        "In a use case diagram, what do the ovals represent?",
        [("Goals that actors pursue with the system", True),
         ("Steps performed in sequence during a process", False),
         ("States that an entity passes through", False),
         ("Components that will be deployed separately", False)],
        "Each oval is something an actor wants to achieve, and the diagram "
        "scopes the system by showing who wants what from it. There is no "
        "sequence in the notation at all, so reading the ovals left to right "
        "as a process is the standard misinterpretation -- flow belongs on an "
        "activity or sequence diagram."),

    mcq("HARD",
        "A design has classes that hold data with all the behaviour "
        "implemented in separate service classes.\n\nWhat has been lost?",
        [("Data and behaviour together, which was the reason to use objects "
          "at all", True),
         ("Inheritance, since data-only classes cannot be "
          "specialised", False),
         ("Encapsulation of the service classes' internal logic", False),
         ("The ability to test the classes independently of each "
          "other", False)],
        "Keeping data with the operations on it is what makes a change land "
        "in one place, which is the whole practical claim of the approach. "
        "Classes reduced to records with logic elsewhere are structured "
        "design written in object syntax -- an anaemic design -- and it "
        "scatters exactly the logic that ownership was meant to concentrate."),

    mcq("AVERAGE",
        "What does a guard on a state machine transition specify?",
        [("A condition that must hold for the transition to be taken", True),
         ("An action performed while the transition occurs", False),
         ("The event that causes the transition to fire", False),
         ("The state the object returns to if the transition fails", False)],
        "A transition fires on an event, and a guard adds a condition that "
        "must also be true -- so the same event may lead to different states "
        "depending on circumstances. Together with the absence of a "
        "transition, which means the event is rejected, guards are how a "
        "state machine says precisely what may and may not happen."),

    mcq("HARD",
        "Why is composition usually preferred to inheritance where both would "
        "work?",
        [("Inheritance creates the tightest coupling, since a subclass "
          "depends on its parent's internals", True),
         ("Composition executes faster because no dispatch is "
          "required", False),
         ("Inheritance cannot express relationships between more than two "
          "classes", False),
         ("Composition allows an object's type to be determined at "
          "compile time", False)],
        "A subclass is coupled to its superclass's internal structure and "
        "breaks when that changes, which is the tightest dependency available "
        "in an object-oriented design. Composition holds another object and "
        "delegates to its interface, which is far looser and changeable at "
        "run time -- so it is the right answer more often than the vocabulary "
        "of inheritance suggests."),
]

LESSON_DEV_OO = lesson(
    MAJOR, MIDDLE,
    "Object-Oriented Design and UML Modelling",
    _oo_quiz,
    lesson_structure(
        "Object-Oriented Design and UML Modelling",
        "Object orientation decomposes software by what it is ABOUT rather "
        "than by what it does, keeping data with the operations on it so that "
        "a change lands in one place. This lesson covers the four principles "
        "and what each is for beyond its definition, the class and object "
        "distinction and the shared-value defect it explains, and "
        "inheritance's misuse -- tested by substitutability, since an 'is a "
        "kind of' that reads correctly in English can still be wrong in code. "
        "It then works through UML as the examination uses it, by READING: "
        "which diagram answers which question, the class relationships "
        "separated by lifetime, and how to read a sequence diagram without "
        "the usual errors.",
        [
            "Contrast structured with object-oriented decomposition",
            "Define encapsulation, abstraction, inheritance and polymorphism "
            "with their purposes",
            "Distinguish class from object, and instance from class "
            "attributes",
            "Apply the substitutability test to a proposed inheritance",
            "Choose the UML diagram that answers a stated question",
            "Read a class diagram, including aggregation, composition and "
            "multiplicity",
            "Read a sequence diagram and a state machine diagram",
            "Identify an anaemic design and explain what it gives up",
        ],
        85,
        _oo_sections,
        [
            ("Encapsulation",
             "Data and its operations held together with internals hidden -- "
             "information hiding enforced by the language."),
            ("Abstraction",
             "Presenting the essential characteristics for the problem at "
             "hand and suppressing the rest."),
            ("Inheritance",
             "A subclass taking and specialising a superclass. Expresses 'is "
             "a kind of', and creates the tightest coupling available."),
            ("Polymorphism",
             "The same call behaving differently by actual type, which "
             "removes the chain of conditionals testing which subtype it is."),
            ("Class against object",
             "The definition against one instance of it, each object holding "
             "its own attribute values."),
            ("Class attribute",
             "Belongs to the class and is shared by every instance -- the "
             "cause of one object's change appearing on all."),
            ("Substitutability",
             "The test for inheritance: the child must work wherever the "
             "parent is expected."),
            ("Association, aggregation, composition",
             "Knows about; a whole whose parts survive it; a whole whose "
             "parts do not."),
            ("Multiplicity",
             "How many objects may participate at each end, with a zero "
             "making the relationship optional."),
            ("Sequence diagram",
             "Messages between participants with time running downward -- the "
             "vertical order is the point."),
            ("State machine diagram",
             "States, events, transitions and guards, saying explicitly what "
             "cannot happen."),
            ("Anaemic design",
             "Classes holding data with behaviour elsewhere -- structured "
             "design in object syntax."),
        ],
        "Object orientation decomposes by what software is ABOUT rather than "
        "by what it does, so data and the operations on it stay together and "
        "a change to a rule or a format lands in one class. The four "
        "principles each do work beyond their definitions: encapsulation is "
        "information hiding the language enforces, abstraction is deciding "
        "what is essential FOR THIS PROBLEM, inheritance expresses 'is a kind "
        "of', and polymorphism is what makes inheritance useful by removing "
        "the conditional chain that would otherwise test which subtype is "
        "held. A class defines and an object instantiates, and a per-object "
        "value declared on the class is shared by every instance -- a defect "
        "that looks inexplicable until the declaration is read. Inheritance "
        "is the principle most misapplied, and SUBSTITUTABILITY is the test: "
        "square inheriting from rectangle reads correctly in English and "
        "breaks code that sets dimensions independently, which is why "
        "composition is preferred wherever both would work. UML is examined "
        "by reading, so the skill is matching the QUESTION to the diagram -- "
        "with class relationships separated by LIFETIME, sequence diagrams "
        "read downward rather than left to right, and use case diagrams "
        "containing no sequence whatever.",
        exam_notes=[
            desc(
                "Items give a diagram or a described relationship and ask "
                "what it means or whether it is correct."
            ),
            ul([
                "Applying the substitutability test to an inheritance.",
                "Distinguishing aggregation from composition by lifetime.",
                "Choosing the diagram that answers a stated question.",
                "Reading the order of messages in a sequence diagram.",
                "Explaining what polymorphism provides.",
                "Explaining the effect of a class attribute.",
                "Identifying an anaemic design.",
            ]),
            desc(
                "For any inheritance item, ask whether code written against "
                "the parent would still work given the child. That single "
                "question decides every one of them, and it is what separates "
                "a relationship that sounds right from one that is."
            ),
        ],
    ))

# ==========================================================================
# Lesson 6: Construction
# ==========================================================================

_build_sections = [
    ("Turning Design Into Code", [
        desc(
            "Construction implements the detailed design, and the syllabus "
            "treats it as three activities rather than one: writing code, "
            "reviewing it, and testing each unit."
        ),
        image(fig("cost-of-defect")),
        desc(
            "All three exist to find defects as early as possible, and the "
            "cost curve is why. A defect caught by the developer who wrote it "
            "costs minutes; the same defect caught in system testing costs a "
            "cycle of everybody's time, and in production it costs whatever "
            "it did before somebody noticed."
        ),
    ]),

    ("Writing Code That Can Be Maintained", [
        desc(
            "Most of a system's cost comes after it is delivered, so code is "
            "written for the person who will read it rather than for the "
            "machine."
        ),
        ul([
            "Name things for what they mean, since a name is the "
            "documentation that cannot go stale.",
            "Keep functions short enough to hold in mind at once, which is "
            "cohesion applied to a single routine.",
            "Follow the project's conventions even where personal preference "
            "differs, because consistency is worth more than any individual "
            "choice.",
            "Handle errors as the design specified rather than deciding "
            "locally, or the handling becomes inconsistent by construction.",
            "Comment WHY rather than what -- the code already says what, and "
            "the reasoning is what a reader cannot recover.",
        ]),
        desc(
            "The comment rule is examined because it is counter-intuitive. A "
            "comment restating the code duplicates something that will change "
            "without it; a comment explaining why an apparently odd approach "
            "was necessary preserves knowledge nobody else has, and prevents "
            "a maintainer 'fixing' it."
        ),
    ]),

    ("Coding Standards", [
        desc(
            "A standard settles the questions that have no right answer so "
            "nobody spends time on them."
        ),
        table(
            ["Covers", "Purpose"],
            [["Naming conventions", "Consistency, so code reads uniformly"],
             ["Layout and formatting",
              "Diffs show real changes rather than reformatting"],
             ["Language features to avoid",
              "Ruling out constructs known to cause defects"],
             ["Error handling approach", "Uniform behaviour across modules"],
             ["Comment and documentation expectations",
              "Knowledge survives the author"]],
            caption="Five things a coding standard settles.",
            footer="The second row is worth noticing. A codebase where "
                   "formatting varies produces change records full of "
                   "reformatting noise, which makes reviewing the actual "
                   "change harder -- so consistency has a direct, practical "
                   "payoff."),
        desc(
            "A standard's value is the consistency rather than the "
            "individual rules, which is why arguing about which convention to "
            "adopt matters far less than adopting one and applying it. Tools "
            "that check and format automatically remove the question "
            "entirely."
        ),
    ]),

    ("Reviewing Code", [
        desc(
            "Review finds defects that testing cannot, and finds them before "
            "the code runs at all."
        ),
        compare_grid(
            "WHAT REVIEW FINDS AGAINST WHAT TESTING FINDS",
            "They overlap far less than people assume.",
            [("Review finds",
              ["Missing cases nobody thought to test",
               "Unclear code that will be misread later",
               "Departures from the design",
               "Security and maintainability problems"]),
             ("Testing finds",
              ["Behaviour that differs from what was expected",
               "Defects in paths the tests exercise",
               "Regressions in what previously worked",
               "Nothing about code nobody wrote"])]),
        desc(
            "The last entry in each column is the pairing that matters. "
            "Testing cannot find a case nobody implemented, because there is "
            "nothing to run; review reads the specification alongside the "
            "code and notices the absence -- which is why the two are "
            "complementary rather than alternatives."
        ),
        desc(
            "The syllabus names several forms: an INSPECTION is formal, with "
            "defined roles and recorded findings; a WALKTHROUGH is the author "
            "leading others through the work; PAIR programming reviews "
            "continuously as the code is written. They differ in cost and in "
            "formality rather than in purpose."
        ),
    ]),

    ("Static Analysis", [
        desc(
            "Some defects can be found by examining code without running it, "
            "and tools do this more thoroughly than people."
        ),
        ul([
            "Type errors, unreachable code and unused values are found "
            "mechanically and reliably.",
            "Common defect patterns -- resource leaks, null dereferences, "
            "unchecked results -- are detected by pattern matching.",
            "Style and complexity measures are computed consistently, without "
            "anybody's judgement being involved.",
            "Security-specific analysis finds injection and unsafe "
            "construct usage before anything is deployed.",
        ]),
        desc(
            "The value is coverage rather than depth. A tool examines every "
            "line every time without tiring, which is exactly what human "
            "review cannot do -- and it frees the review to concentrate on "
            "the judgement questions that no tool can answer."
        ),
    ]),

    ("Unit Testing", [
        desc(
            "A unit test exercises one module against its specified "
            "behaviour, and it is the cheapest test level there is."
        ),
        table(
            ["Property", "Why it matters"],
            [["Tests one unit in isolation",
              "A failure identifies the defect's location immediately"],
             ["Runs fast", "So it can be run on every change"],
             ["Is repeatable", "A test that sometimes fails teaches nobody "
                               "anything"],
             ["Is independent of other tests",
              "Order-dependent tests fail mysteriously"],
             ["Checks behaviour, not implementation",
              "Or every refactoring breaks the tests"]],
            caption="Five properties of a useful unit test.",
            footer="The last row is the one that decides whether a test suite "
                   "helps or obstructs. Tests coupled to how a module works "
                   "internally must be rewritten whenever it is improved, "
                   "which makes improving it expensive."),
        desc(
            "STUBS and MOCKS are what make isolation possible. A stub stands "
            "in for something the unit depends on and returns fixed answers; "
            "a mock also records how it was called, so the test can check the "
            "unit interacted with it correctly."
        ),
    ]),

    ("Designing Unit Test Cases", [
        desc(
            "Testing every possible input is impossible, so cases are chosen "
            "by technique rather than by intuition."
        ),
        image(fig("boundary-values")),
        ol([
            "Divide the inputs into EQUIVALENCE CLASSES -- sets of values the "
            "code should treat identically.",
            "Take one value from each class, since testing more from the same "
            "class adds cases and no information.",
            "Add BOUNDARY VALUES: the edge of each class, and the values just "
            "inside and just outside it.",
            "Add the invalid classes too, since rejecting bad input correctly "
            "is behaviour as much as accepting good input.",
            "Add any case the specification calls out explicitly, and any "
            "that previously produced a defect.",
        ]),
        desc(
            "BOUNDARIES are where defects cluster, which is why they earn a "
            "technique of their own. Off-by-one errors and wrong comparison "
            "operators both live exactly at the edge, so a test using the "
            "middle of a valid range finds almost nothing."
        ),
    ]),

    ("Black Box and White Box", [
        desc(
            "Test cases are derived either from the specification or from the "
            "code, and the two find different things."
        ),
        image(fig("blackbox-whitebox")),
        desc(
            "BLACK BOX testing works from the specification, using "
            "equivalence classes and boundary values, and knows nothing about "
            "the internals. WHITE BOX testing works from the code, aiming to "
            "exercise its statements and branches."
        ),
        desc(
            "Neither finds what the other finds, which is the examinable "
            "point. White box testing cannot find a MISSING function -- there "
            "is no code to cover, so full coverage is achieved without ever "
            "noticing the absence. Black box testing cannot know that a path "
            "inside the code was never exercised."
        ),
        table(
            ["Coverage measure", "Requires"],
            [["Statement coverage", "Every statement executed at least once"],
             ["Branch coverage", "Every decision taken both ways"],
             ["Path coverage", "Every combination of decisions"]],
            caption="Three coverage measures, in increasing strength.",
            footer="Statement coverage is weaker than it sounds: a condition "
                   "with no else branch reaches 100% while the case where the "
                   "condition is false has never been tried. Branch coverage "
                   "is the meaningful minimum."),
    ]),

    ("Debugging", [
        desc(
            "Testing finds that something is wrong; debugging finds why, and "
            "the syllabus treats it as a method rather than an art."
        ),
        ol([
            "Reproduce the failure reliably, since a defect that appears "
            "intermittently cannot be confirmed fixed.",
            "Narrow the region where it occurs, by bisecting the input, the "
            "code path or the change history.",
            "Form a hypothesis that explains ALL the symptoms, not merely the "
            "one being looked at.",
            "Test the hypothesis with a change that would confirm or refute "
            "it.",
            "Fix the cause rather than the symptom, and add a test that would "
            "have caught it.",
        ]),
        desc(
            "Step five is what stops the same defect returning. A fix with no "
            "test is a defect that can reappear silently, and adding the test "
            "is also the cheapest way to prove the fix actually worked."
        ),
    ]),

    ("Test-First Development", [
        desc(
            "Writing a test before the code it tests is a practice the "
            "syllabus names, and its benefits are not chiefly about "
            "testing."
        ),
        ol([
            "Write a test for behaviour that does not exist yet, and watch it "
            "fail.",
            "Write the simplest code that makes it pass.",
            "Improve the code's structure, with the test confirming behaviour "
            "is unchanged.",
            "Repeat for the next piece of behaviour.",
        ]),
        desc(
            "The first step forces the interface to be designed from the "
            "CALLER's point of view, before any implementation exists to "
            "influence it -- which tends to produce interfaces that are "
            "pleasant to use rather than convenient to write."
        ),
        desc(
            "The third step is the one that depends on the others. "
            "Restructuring code is safe only when something can confirm the "
            "behaviour did not change, so the tests are what make continuous "
            "improvement affordable rather than risky."
        ),
    ]),

    ("Managing Technical Debt", [
        desc(
            "Code is sometimes written in a way known to be inadequate "
            "because delivering sooner matters more, and the syllabus treats "
            "this as a decision rather than a failing."
        ),
        compare_grid(
            "DELIBERATE DEBT AGAINST ACCIDENTAL DEBT",
            "Both slow future work; only one was chosen.",
            [("Deliberate",
              ["Taken knowingly to meet a date",
               "Recorded, with what it will cost to repay",
               "Repaid when the pressure passes",
               "A legitimate engineering trade"]),
             ("Accidental",
              ["Arises from inexperience or haste",
               "Nobody records it, because nobody noticed",
               "Discovered by whoever next touches the code",
               "Accumulates until change becomes expensive"])]),
        desc(
            "The examinable point is that debt has INTEREST: every subsequent "
            "change to that code costs more than it should. Deliberate debt "
            "is affordable because somebody is tracking the payments; "
            "accidental debt compounds silently until a system reaches the "
            "state where estimates stop being reliable."
        ),
    ]),

    ("Integrating Frequently", [
        desc(
            "Construction happens in parallel across a team, and how often "
            "the work is combined decides how painful combining it is."
        ),
        image(fig("branching-merge")),
        desc(
            "A developer working alone for two weeks has a codebase that has "
            "diverged for two weeks, and every conflict accumulated over that "
            "period is resolved at once, by somebody reconstructing decisions "
            "made days ago. Integrating daily makes each reconciliation small "
            "enough to be trivial."
        ),
        desc(
            "CONTINUOUS INTEGRATION is this taken to its conclusion: every "
            "change is merged and the whole suite is run automatically, so a "
            "break is detected within minutes and attributed to one small "
            "change. The alternative is discovering at the end that several "
            "changes together broke something, with no way to tell which."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where construction items are lost."),
        ul([
            "Believing testing can find a function nobody implemented. Only "
            "review reads the specification alongside the code.",
            "Treating statement coverage as sufficient. A missing else branch "
            "is untested at 100%.",
            "Expecting white box testing to find missing functionality.",
            "Testing the middle of a valid range rather than its boundaries.",
            "Writing tests against implementation, so refactoring breaks "
            "them.",
            "Commenting what the code does rather than why.",
            "Fixing a symptom without a hypothesis that explains every "
            "symptom.",
            "Fixing a defect without adding a test that would have caught "
            "it.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A module achieves 100% statement coverage and a defect is "
            "found in production where a condition was false. How was it "
            "missed?\""
        ),
        ol([
            "Establish what statement coverage requires: every statement "
            "executed at least once.",
            "Consider a condition with no else branch: executing the "
            "statements inside it covers them all.",
            "The case where the condition is FALSE executes no statement, so "
            "it is not required by statement coverage at all.",
            "So 100% statement coverage was achieved without that path ever "
            "being tried, which is exactly the reported defect.",
            "BRANCH coverage would have required the decision to be taken "
            "both ways, and is the meaningful minimum for that reason.",
        ]),
        desc(
            "The general lesson is that a coverage figure measures what was "
            "executed rather than what was verified. High coverage with weak "
            "assertions proves very little, and choosing the coverage measure "
            "matters as much as reaching a number in it."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Construction is where several earlier lessons meet."),
        ul([
            "Detailed design supplies what each module must do, from the "
            "previous lesson.",
            "Testable design -- explicit interfaces, injected dependencies -- "
            "is what makes unit testing possible.",
            "Equivalence classes and boundaries are set reasoning from "
            "Discrete Mathematics.",
            "Static analysis for injection is the Security category's "
            "application controls.",
            "Coding standards and review are quality processes in the "
            "management lessons.",
            "Unit tests become the regression suite of the integration "
            "lesson.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Six results this lesson expects immediately.",
            [("What review finds that testing cannot",
              "A case nobody implemented",
              "There is nothing to run, so only reading the specification "
              "alongside the code finds the absence."),
             ("Why statement coverage is weak",
              "A condition with no else reaches 100% untested on the false "
              "path",
              "Branch coverage requires each decision both ways, and is the "
              "meaningful minimum."),
             ("Where defects cluster",
              "At boundaries",
              "Off-by-one errors and wrong operators live exactly there, so "
              "testing mid-range finds little."),
             ("Stub against mock",
              "Returns fixed answers, against also recording how it was "
              "called",
              "Both provide the isolation that makes a unit test a unit "
              "test."),
             ("Why tests should check behaviour not implementation",
              "Otherwise every improvement breaks the tests",
              "Which makes improving the code expensive and so it stops "
              "happening."),
             ("What a comment should say",
              "Why, not what",
              "The code already says what; the reasoning is what a reader "
              "cannot recover.")]),
    ]),
]

_build_quiz = [
    mcq("HARD",
        "A module has 100% statement coverage, and a production defect occurs "
        "on a path where a condition was false.\n\nHow was it missed?",
        [("Statement coverage does not require a condition with no else "
          "branch to be taken both ways", True),
         ("The test suite was executed against an earlier version of the "
          "module", False),
         ("Statement coverage counts only executable lines and excludes "
          "conditions", False),
         ("The production environment evaluated the condition differently "
          "from the test one", False)],
        "Executing the statements inside a condition covers them all, and the "
        "case where the condition is false executes no statement -- so it is "
        "never required. Branch coverage demands each decision be taken both "
        "ways and is the meaningful minimum for exactly this reason. A "
        "coverage figure measures what was executed rather than what was "
        "verified."),

    mcq("AVERAGE",
        "Code review finds a category of defect that testing cannot "
        "find at all.\n\nWhich category?",
        [("A required function that was never implemented at all", True),
         ("Behaviour that differs from what the specification "
          "describes", False),
         ("A defect on a path that the test cases do not exercise", False),
         ("A regression in functionality that previously worked", False)],
        "Testing runs code, so it can find nothing about code nobody wrote -- "
        "there is nothing to execute and no failure to observe. Review reads "
        "the specification alongside the implementation and notices the "
        "absence. That complementarity is why both are performed rather than "
        "one being chosen over the other."),

    mcq("HARD",
        "Why is white box testing unable to find missing functionality?",
        [("It derives cases from the code, and absent code produces no cases "
          "to derive", True),
         ("It examines only the paths the developer considered "
          "important", False),
         ("It is performed by developers who share the original "
          "misunderstanding", False),
         ("It measures coverage rather than checking behaviour against a "
          "specification", False)],
        "Cases come from the code's structure, so a function nobody wrote "
        "contributes no statements or branches and full coverage is reached "
        "without its absence being noticed. Black box testing derives cases "
        "from the specification and therefore can find it -- which is exactly "
        "why the two techniques are used together rather than one replacing "
        "the other."),

    mcq("AVERAGE",
        "Where should test values be concentrated when testing a numeric "
        "input range?",
        [("At the boundaries, and just inside and outside them", True),
         ("Evenly distributed across the whole valid range", False),
         ("In the middle of the valid range, as a representative "
          "case", False),
         ("At values known to occur most frequently in production", False)],
        "Off-by-one errors and wrong comparison operators are among the "
        "commonest defects and both live exactly at the edge of a range, so a "
        "test using a mid-range value passes whether the boundary is handled "
        "correctly or not. One value per equivalence class plus the "
        "boundaries finds far more per test than spreading cases evenly."),

    mcq("AVERAGE",
        "What distinguishes a mock from a stub in unit testing?",
        [("A mock records how it was called so the interaction can be "
          "checked", True),
         ("A mock returns realistic data while a stub returns fixed "
          "values", False),
         ("A mock replaces an external system while a stub replaces an "
          "internal module", False),
         ("A mock is generated automatically while a stub is written by "
          "hand", False)],
        "Both stand in for a dependency so the unit can be tested in "
        "isolation. A stub simply supplies answers; a mock additionally "
        "records the calls made to it, so the test can assert that the unit "
        "interacted with its dependency as expected -- which is what makes it "
        "useful when the interaction itself is the behaviour being verified."),

    mcq("HARD",
        "Unit tests are written against a module's internal implementation "
        "rather than its behaviour.\n\nWhat is the consequence?",
        [("Improving the implementation breaks the tests, so it stops "
          "happening", True),
         ("The tests run more slowly because they access internal "
          "state", False),
         ("The tests cannot be executed without the module's "
          "dependencies", False),
         ("Coverage measurements become unreliable for that "
          "module", False)],
        "Tests coupled to how a module works must be rewritten whenever it is "
        "restructured, which turns every refactoring into additional work and "
        "makes the code progressively harder to improve. A suite testing "
        "behaviour supports change; one testing implementation obstructs it, "
        "which is the opposite of what the suite exists for."),

    mcq("AVERAGE",
        "Comments in maintainable code concentrate on one thing.\n\n"
        "Which?",
        [("Why the code takes the approach it does", True),
         ("What each statement in the code performs", False),
         ("Which requirement the code implements, by number", False),
         ("When the code was written and by whom", False)],
        "The code already states what it does, so a restating comment "
        "duplicates something that will change without it and become "
        "misleading. The reasoning behind an apparently odd approach is what "
        "a reader cannot recover and what stops a maintainer 'correcting' "
        "something that was deliberate. Authorship and dates are recorded by "
        "version control."),

    mcq("HARD",
        "Why should a defect fix be accompanied by a test that would have "
        "caught it?",
        [("It proves the fix works and prevents the defect returning "
          "silently", True),
         ("Test coverage requirements mandate a test for every change "
          "made", False),
         ("The test documents the defect for future maintainers to "
          "read", False),
         ("It allows the fix to be reverted safely if it causes "
          "problems", False),
         ],
        "The test is the cheapest available demonstration that the fix "
        "actually addressed the problem, and it remains in the suite "
        "afterwards so that a later change reintroducing the defect fails "
        "immediately. Without it, the same defect can return without anybody "
        "noticing until it reaches production again."),

    mcq("AVERAGE",
        "What is the purpose of dividing inputs into equivalence classes?",
        [("Values within a class are treated identically, so one case "
          "suffices", True),
         ("Each class corresponds to one branch through the code being "
          "tested", False),
         ("Classes indicate which inputs the specification declares "
          "valid", False),
         ("Testing every class guarantees complete statement "
          "coverage", False)],
        "If the code should treat every value in a set the same way, testing "
        "several of them adds cases without adding information. One value per "
        "class plus the boundaries gives most of the defect-finding power for "
        "a small number of tests, which is the point of the technique -- "
        "exhaustive testing being impossible."),

    mcq("HARD",
        "In debugging, why must a hypothesis explain every symptom rather "
        "than only the one being investigated?",
        [("A hypothesis explaining one symptom may address a coincidence "
          "rather than the cause", True),
         ("Multiple symptoms indicate multiple defects requiring separate "
          "fixes", False),
         ("Symptoms not explained by the hypothesis will reappear after the "
          "fix is deployed", False),
         ("Explaining all symptoms is required before a change may be "
          "submitted for review", False)],
        "A partial explanation can be satisfied by something adjacent to the "
        "real cause, and acting on it produces a fix that removes one visible "
        "effect while the actual defect remains. Requiring the hypothesis to "
        "account for everything observed is what distinguishes locating a "
        "cause from suppressing a symptom."),
]

LESSON_DEV_BUILD = lesson(
    MAJOR, MIDDLE,
    "Software Construction: Coding, Review and Unit Testing",
    _build_quiz,
    lesson_structure(
        "Software Construction: Coding, Review and Unit Testing",
        "Construction is three activities rather than one -- writing code, "
        "reviewing it and testing each unit -- and all three exist because a "
        "defect gets an order of magnitude more expensive at every stage it "
        "survives. This lesson covers writing for the maintainer rather than "
        "the machine, what coding standards actually buy, and the "
        "complementarity that matters most: review finds the function nobody "
        "implemented, which testing cannot because there is nothing to run. "
        "It then covers unit testing properly -- the properties of a useful "
        "test, stubs and mocks, equivalence classes and the boundaries where "
        "defects cluster, and why statement coverage can reach a hundred per "
        "cent with a path never tried.",
        [
            "Explain why construction includes review and unit testing",
            "Write and recognise maintainable code, including comment "
            "practice",
            "State what a coding standard settles and why consistency is the "
            "benefit",
            "Explain what review finds that testing cannot, and the forms of "
            "review",
            "Describe what static analysis contributes",
            "State the properties of a useful unit test and the role of stubs "
            "and mocks",
            "Design test cases using equivalence classes and boundary values",
            "Distinguish black box from white box testing and compare the "
            "coverage measures",
        ],
        85,
        _build_sections,
        [
            ("Comment practice",
             "Explain WHY, since the code already states what and the "
             "reasoning cannot be recovered."),
            ("Coding standard",
             "Settles naming, layout, permitted constructs and error "
             "handling. The consistency is the benefit."),
            ("Code review",
             "Finds missing cases, unclear code and design departures -- "
             "including functions nobody wrote."),
            ("Inspection and walkthrough",
             "A formal review with roles and records, against the author "
             "leading others through the work."),
            ("Static analysis",
             "Finding defects without running the code. Its value is covering "
             "every line every time."),
            ("Unit test",
             "Exercises one module in isolation, fast, repeatable, "
             "independent, and against behaviour rather than implementation."),
            ("Stub and mock",
             "A stand-in returning fixed answers; one that also records how it "
             "was called."),
            ("Equivalence class",
             "A set of inputs the code should treat identically, so one value "
             "from each suffices."),
            ("Boundary value analysis",
             "Testing at the edge of each class and just either side, where "
             "off-by-one defects live."),
            ("Black box testing",
             "Cases derived from the specification. Can find missing "
             "functionality."),
            ("White box testing",
             "Cases derived from the code. Cannot find missing functionality, "
             "since absent code produces no cases."),
            ("Statement against branch coverage",
             "Every statement executed, against every decision taken both "
             "ways. The second is the meaningful minimum."),
        ],
        "Construction writes, reviews and unit tests, and all three exist "
        "because a defect surviving a stage costs an order of magnitude more "
        "at the next. Code is written for whoever reads it next, which makes "
        "naming the documentation that cannot go stale and makes a comment's "
        "job explaining WHY rather than what. Coding standards settle the "
        "questions with no right answer, and the consistency rather than any "
        "individual rule is the benefit. Review and testing overlap far less "
        "than assumed: review finds a required function nobody implemented, "
        "which testing cannot, since there is nothing to run -- while testing "
        "finds behaviour that differs from expectation on the paths it "
        "exercises. Static analysis contributes coverage rather than depth, "
        "examining every line every time. A useful unit test is isolated, "
        "fast, repeatable, independent and written against BEHAVIOUR, since "
        "tests coupled to implementation make every improvement expensive. "
        "Cases come from equivalence classes -- one value each, since more "
        "adds no information -- plus the BOUNDARIES, where off-by-one errors "
        "and wrong operators actually live. And the coverage measures matter: "
        "statement coverage reaches a hundred per cent with a condition's "
        "false path never tried, so branch coverage is the meaningful "
        "minimum.",
        exam_notes=[
            desc(
                "Items describe a testing or review situation and ask why "
                "something was missed, or which technique applies."
            ),
            ul([
                "Explaining how a defect survived full statement coverage.",
                "Stating what review finds that testing cannot.",
                "Explaining why white box testing misses absent functions.",
                "Choosing test values for a range.",
                "Distinguishing a stub from a mock.",
                "Explaining the cost of testing implementation.",
                "Stating what a comment should contain.",
            ]),
            desc(
                "When an item says a defect escaped despite testing, ask what "
                "the technique used is structurally incapable of finding. "
                "Missing functions escape white box testing and statement "
                "coverage misses untaken false branches -- both are "
                "properties of the method rather than failures of effort."
            ),
        ],
    ))

LESSONS = [LESSON_DEV_OO, LESSON_DEV_BUILD]
