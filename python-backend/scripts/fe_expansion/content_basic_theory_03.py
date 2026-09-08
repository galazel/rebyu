"""Basic Theory -> Basic Theory, lessons 3 to 5.

Three lessons in one module because they are short-tailed minor categories
that share an idea: each is about the boundary between a continuous physical
world and a discrete digital one.

  3. Theory of information -- how meaning is encoded as symbols, how symbols
     are compressed, how a machine decides whether a string is well formed.
  4. Theory of communications -- how those symbols cross a physical medium
     and how the damage is detected.
  5. Theory of measurement and control -- how a computer senses and acts on
     physical quantities.

Together they complete syllabus minor categories 3, 4 and 5.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Basic Theory"
MIDDLE = "Basic Theory"

# ==========================================================================
# Lesson 3: Theory of Information, Coding and Automata
# ==========================================================================

_info_sections = [
    ("Information as a Measurable Quantity", [
        desc(
            "Information theory begins from a claim that sounds strange until "
            "you sit with it: the amount of information in a message is "
            "inversely related to how expected it was. A message that tells "
            "you something you already knew carries no information at all."
        ),
        desc(
            "'The server is up' carries almost nothing if the server is up "
            "99.99% of the time. 'The server is down' carries a great deal, "
            "precisely because it is rare. Formally, the information content "
            "of an event of probability p is the logarithm base 2 of 1/p, "
            "measured in bits -- so an event with probability one half "
            "carries one bit, one in four carries two bits, and one in "
            "1,024 carries ten."
        ),
        compare_grid(
            "WHY THIS IS AN ENGINEERING FACT, NOT A PHILOSOPHICAL ONE",
            "The definition is what makes compression possible and what sets "
            "its limit.",
            [("It bounds compression",
              "The average information content of a source -- its entropy -- "
              "is the smallest average number of bits per symbol any lossless "
              "scheme can achieve. No algorithm beats it."),
             ("It explains why compression works",
              "Real data is predictable. English text, source code and log "
              "files all have entropy far below their storage size, and the "
              "gap is what a compressor collects."),
             ("It explains why compressed data will not compress",
              "A well-compressed file is already near its entropy, so a "
              "second pass has nothing left to remove and usually grows it "
              "slightly by adding a header."),
             ("It sets channel capacity",
              "The same reasoning bounds how much information a noisy channel "
              "can carry reliably, which is where the Communications lesson "
              "picks the idea up.")]),
    ]),

    ("From Analogue to Digital", [
        desc(
            "Sound, temperature, voltage and light are continuous: they take "
            "any value, and they take it at every instant. A computer stores "
            "discrete values at discrete times. Bridging that gap is "
            "analogue-to-digital conversion, and it happens in three steps of "
            "which two lose information permanently."
        ),
        image(fig("ad-conversion")),
        desc(
            "SAMPLING takes a measurement at regular intervals and discards "
            "everything between them. How often is enough is settled by the "
            "sampling theorem: to reconstruct a signal you must sample at "
            "more than twice its highest frequency. Human hearing reaches "
            "about 20 kHz, which is why audio CDs sample at 44.1 kHz. Sample "
            "too slowly and high frequencies do not merely vanish -- they "
            "reappear disguised as low ones, an artefact called aliasing."
        ),
        desc(
            "QUANTISATION rounds each sample to one of a finite set of "
            "levels, and discards the difference. The number of levels is set "
            "by the bit depth: 8 bits gives 256 levels, 16 bits gives 65,536. "
            "The rounding error is quantisation noise, and every extra bit "
            "halves it."
        ),
        desc(
            "ENCODING writes the quantised values as bit patterns. Alone "
            "among the three, it loses nothing -- it is a change of notation, "
            "not of content. The examination likes this distinction: asked "
            "where information is lost in A/D conversion, the answer is "
            "sampling and quantisation, never encoding."
        ),
    ]),

    ("Compression", [
        desc(
            "Compression removes redundancy. It divides cleanly into two "
            "kinds by a single question: can the original be recovered "
            "exactly?"
        ),
        content_tabs(
            "LOSSLESS AND LOSSY",
            "The choice is decided by what the data is for, not by how much "
            "space is available.",
            [("Lossless", "The original is recovered bit for bit",
              "Redundancy is removed and nothing else. Used where any change "
              "is unacceptable: executables, source code, spreadsheets, "
              "archives, medical images. ZIP, gzip, PNG and FLAC are "
              "lossless. Ratios are modest -- typically two to four times on "
              "text, and nothing at all on already-compressed data."),
             ("Lossy", "Detail judged imperceptible is discarded",
              "Achieves far higher ratios by exploiting the limits of human "
              "perception -- frequencies the ear does not hear, colour "
              "detail the eye does not resolve. JPEG, MP3, AAC and most "
              "video codecs are lossy. The loss is cumulative, so repeatedly "
              "editing and resaving a JPEG degrades it each time."),
             ("Run-length encoding", "The simplest lossless method",
              "Replaces a run of identical values with the value and a "
              "count, so a long line of the same pixel becomes two numbers. "
              "Excellent on fax images and screen captures with flat areas; "
              "on data without runs it can produce output larger than the "
              "input.")]),
        table(
            ["Symbol", "Frequency", "Fixed-length code", "Huffman code"],
            [["A", "45%", "000 (3 bits)", "0 (1 bit)"],
             ["B", "25%", "001 (3 bits)", "10 (2 bits)"],
             ["C", "15%", "010 (3 bits)", "110 (3 bits)"],
             ["D", "10%", "011 (3 bits)", "1110 (4 bits)"],
             ["E", "5%", "100 (3 bits)", "1111 (4 bits)"]],
            caption="Average length falls from 3.00 bits per symbol to 2.00.",
            footer="No code is a prefix of another, so the decoder reads the "
                   "stream bit by bit and always knows where a code ends -- "
                   "no separators are needed, and nothing is lost."),
        desc(
            "Huffman coding is the lossless method the syllabus names, and it "
            "applies the entropy idea directly: give the frequent symbols "
            "short codes and the rare ones long codes, so the average length "
            "falls. The codes are built so that none is a prefix of another, "
            "which means the decoder can read the stream bit by bit and know "
            "exactly where each code ends without any separator."
        ),
        desc(
            "The figure's example makes the gain concrete. Five symbols need "
            "three bits each under a fixed-length code, giving 3.00 bits per "
            "symbol regardless of frequency. Huffman gives the 45% symbol one "
            "bit and the 5% symbol four, and the weighted average falls to "
            "2.00 bits -- a third smaller, with nothing lost."
        ),
    ]),

    ("Character Representation", [
        desc(
            "A character code is a table mapping numbers to characters. That "
            "is the whole of it, and the consequence is the one that matters: "
            "a byte carries no indication of which table it should be read "
            "with, so the encoding has to be known separately."
        ),
        table(
            ["Code", "Width", "Covers", "Note"],
            [["ASCII", "7 bits", "English, digits, control codes",
              "The common ancestor of the rest"],
             ["JIS", "7 or 8 bits", "Japanese, with mode switching",
              "Stateful: uses escape sequences"],
             ["Shift-JIS", "1 or 2 bytes", "Japanese, leaving ASCII intact",
              "Widely deployed on personal computers"],
             ["EUC", "1 to 3 bytes", "Japanese on UNIX systems",
              "Stateless: no escape sequences"],
             ["Unicode / UCS", "Variable", "Every script",
              "UTF-8 is byte-identical to ASCII"]],
            caption="A character code is a table; a byte means nothing "
                    "without knowing which table produced it.",
            footer="Reading bytes with the wrong code produces mojibake. The "
                   "text is intact and only the interpretation is wrong, "
                   "which is why no recovery is needed."),
        desc(
            "ASCII is the ancestor, defining 128 characters in seven bits: "
            "the English letters, digits, punctuation and a set of control "
            "codes. Everything that came afterwards either extends it or has "
            "to coexist with it."
        ),
        content_accordion(
            "THE CODES THE SYLLABUS NAMES",
            "The Japanese encodings are examined because the FE examination "
            "is Japanese in origin, and because they illustrate the general "
            "problem of fitting a large character set into a byte stream.",
            [("JIS code",
              "Switches between character sets using escape sequences "
              "embedded in the stream. Stateful, which means a byte's meaning "
              "depends on what came before it -- so a message truncated in "
              "the middle can be misread from that point on."),
             ("Shift-JIS",
              "Encodes Japanese in one or two bytes while leaving the "
              "single-byte ASCII range intact, so existing software that "
              "handled ASCII kept working. Widely deployed on personal "
              "computers for exactly that reason."),
             ("EUC (Extended UNIX Code)",
              "A stateless multi-byte encoding using one to three bytes per "
              "character, designed for UNIX systems where escape-sequence "
              "state was awkward. No mode switching, so any byte position can "
              "be interpreted independently."),
             ("Unicode and UCS",
              "One code point for every character in every script, "
              "eliminating the need to know which national encoding a "
              "document uses. UTF-8 is the dominant serialisation: variable "
              "width, one to four bytes, and byte-identical to ASCII for the "
              "ASCII range, which is why it displaced everything else."),
             ("Zoned and packed decimal",
              "Not character codes but decimal number formats, grouped here "
              "by the syllabus because both concern how a digit is stored as "
              "a byte. Zoned holds one digit per byte with a zone in the "
              "upper half; packed holds two per byte with a sign nibble.")]),
        desc(
            "Reading bytes with the wrong table produces mojibake -- text "
            "that renders as meaningless symbols. It is worth naming clearly, "
            "because it is misdiagnosed constantly: the data is not damaged "
            "and nothing needs recovering. Only the interpretation is wrong, "
            "and reading the same bytes with the correct encoding restores "
            "the text perfectly."
        ),
    ]),

    ("Predicate Logic and Inference", [
        desc(
            "Propositional logic, from the first lesson, deals in whole "
            "statements. Predicate logic goes inside them, expressing "
            "properties of objects and quantifying over them -- 'every user "
            "has a role', 'some transaction is unmatched'. That is what lets "
            "a rule be written once and applied to any number of facts, and "
            "it is the formal basis of a relational query."
        ),
        compare_grid(
            "TWO DIRECTIONS OF INFERENCE",
            "The syllabus contrasts these explicitly, and the distinction is "
            "about what the conclusion is worth.",
            [("Deduction",
              "From general rules to a specific conclusion. If the rules are "
              "true the conclusion is CERTAIN. All servers in this rack are "
              "on circuit A; this is a server in the rack; therefore it is on "
              "circuit A."),
             ("Induction",
              "From specific observations to a general rule. The conclusion "
              "is PROBABLE, never certain. Every failure so far occurred "
              "under high load; therefore load causes failures -- which the "
              "next counter-example may overturn.")]),
        desc(
            "Machine learning is induction performed at scale, which is why "
            "a trained model is confident rather than correct and why it "
            "fails on inputs unlike its training data. A rules engine is "
            "deduction, which is why its conclusions can be traced and "
            "audited. Both appear in the AI overview the syllabus asks for, "
            "and the difference between them explains most of what each is "
            "good and bad at."
        ),
    ]),

    ("Formal Languages and Grammars", [
        desc(
            "A formal language is a set of strings deemed valid. A grammar "
            "is the finite set of rules that decides membership -- which is "
            "how a compiler can accept infinitely many valid programs while "
            "holding only a page of rules."
        ),
        table(
            ["Symbol", "Means", "Example"],
            [["::=", "is defined as", "<digit> ::= 0 | 1 | 2"],
             ["|", "or, separating alternatives", "<sign> ::= + | -"],
             ["<name>", "a non-terminal, naming another rule",
              "<integer> refers to a rule"],
             ["a literal", "a terminal symbol, standing for itself",
              "the character 0 itself"]],
            caption="Reading BNF, the notation for a language's grammar.",
            footer="Recursion in a rule is what lets a page of grammar "
                   "describe infinitely many valid programs."),
        desc(
            "BNF, Backus-Naur Form, is the notation. A rule defines a "
            "non-terminal in terms of terminals and other non-terminals, with "
            "alternatives separated by a vertical bar. Recursion is what "
            "gives it unbounded reach: a rule that defines an integer as a "
            "digit followed by an integer describes numbers of any length in "
            "one line."
        ),
        desc(
            "A syntax diagram, sometimes called a railroad diagram, carries "
            "the same information graphically: follow any path through the "
            "diagram and you have produced a valid string. The examination "
            "may present either notation and ask which of four candidate "
            "strings the grammar accepts -- a question answered by tracing, "
            "not by recall."
        ),
        desc(
            "Note the boundary of what a grammar does. It defines which "
            "strings are well FORMED, not which are MEANINGFUL. A statement "
            "assigning a string to an integer variable can be perfectly "
            "grammatical and still wrong, which is exactly why a compiler has "
            "a semantic analysis phase after its syntax analysis phase."
        ),
    ]),

    ("Automata", [
        desc(
            "A finite automaton is the simplest useful model of computation: "
            "a set of states, an input alphabet, and a transition rule saying "
            "which state each input moves you to. It has no memory beyond the "
            "state it is currently in, which is both its limitation and the "
            "reason it is so cheap to implement."
        ),
        image(fig("automaton-states")),
        media_text(
            fig("automaton-states"),
            "TRACING AN AUTOMATON",
            "Examination items give a state transition table or diagram and "
            "an input string, and ask where you end up.",
            "The method is mechanical",
            "Start in the start state. Read the input one symbol at a time, "
            "and for each symbol move to whichever state the table says. When "
            "the input is exhausted, the string is accepted if you are in an "
            "accepting state and rejected otherwise. Write the state down "
            "after every symbol -- attempting to hold the sequence in your "
            "head is where the marks are lost.",
            layout="image-right"),
        desc(
            "Automata are not academic. A lexical analyser is a finite "
            "automaton over characters; a regular expression compiles into "
            "one; a TCP connection is a state machine; and a protocol "
            "specification is largely a transition table. The Software Design "
            "lesson returns to the same idea as the state machine diagram."
        ),
    ]),

    ("Compiler and Language Theory", [
        desc(
            "Turning source text into something a machine executes is done in "
            "phases, each consuming the previous one's output. Knowing the "
            "phases is worth more than it appears, because it tells you what "
            "kind of mistake an error message is reporting."
        ),
        image(fig("compiler-phases")),
        ol([
            "LEXICAL ANALYSIS scans the characters and groups them into "
            "tokens -- identifiers, keywords, operators, literals. An "
            "unrecognisable character is caught here.",
            "SYNTAX ANALYSIS, or parsing, checks the token sequence against "
            "the grammar and builds a syntax tree. A missing bracket or "
            "semicolon is caught here.",
            "SEMANTIC ANALYSIS checks meaning: are the types compatible, is "
            "this name declared, does this call have the right number of "
            "arguments? A type error is caught here.",
            "OPTIMISATION rewrites the intermediate representation to be "
            "faster or smaller without changing what it does.",
            "CODE GENERATION emits the target machine or intermediate code.",
        ]),
        desc(
            "The practical reading: an error naming a line and a character is "
            "usually lexical or syntactic, and an error naming a type or a "
            "name is semantic. A program that compiles cleanly has passed all "
            "three checks and may still be entirely wrong, because no phase "
            "checks intent."
        ),
    ]),

    ("An Overview of Artificial Intelligence", [
        desc(
            "The syllabus asks for an overview rather than depth, and the "
            "useful framing is by what the system learns from."
        ),
        content_accordion(
            "THE CATEGORIES TO RECOGNISE",
            "Examination items describe a scenario and ask which approach it "
            "is, so learn them by what data each one needs.",
            [("Knowledge-based and expert systems",
              "Rules written by human experts, applied by an inference "
              "engine. Deductive, so conclusions can be explained and "
              "audited. Brittle at the edges of the rule set, and expensive "
              "to maintain as the domain changes."),
             ("Supervised learning",
              "Learns from labelled examples -- inputs paired with the "
              "correct output -- and then predicts labels for new inputs. "
              "Classification and regression. Needs a labelled data set, "
              "which is usually the expensive part."),
             ("Unsupervised learning",
              "Finds structure in unlabelled data: clustering similar items, "
              "detecting anomalies, reducing dimensions. Used where nobody "
              "knows in advance what the categories are."),
             ("Reinforcement learning",
              "Learns by acting and receiving a reward signal, without being "
              "told the correct action. Suits control and game-playing, where "
              "the right move is only judged by its eventual outcome."),
             ("Neural networks and deep learning",
              "Layers of weighted connections trained by adjusting weights to "
              "reduce error. Extremely capable on perception tasks, and "
              "difficult to explain -- which is the trade against a rules "
              "engine, and the reason regulated domains still use both.")]),
    ]),

    ("Redundancy: Why Real Data Compresses at All", [
        desc(
            "If entropy is the floor, the obvious question is why real files "
            "sit so far above it. The answer is redundancy, and it takes "
            "several distinct forms -- which is why several distinct "
            "compression techniques exist rather than one."
        ),
        table(
            ["Kind of redundancy", "What it looks like", "Exploited by"],
            [["Repeated symbols", "Long runs of the same value",
              "Run-length encoding"],
             ["Uneven frequencies", "Some symbols far commoner than others",
              "Huffman and arithmetic coding"],
             ["Repeated sequences", "The same phrase appearing again later",
              "Dictionary methods such as LZ77"],
             ["Predictable neighbours", "A pixel resembling the one beside it",
              "Predictive and transform coding"],
             ["Imperceptible detail", "Content the eye or ear will not notice",
              "Lossy codecs: JPEG, MP3"]],
            caption="Five different kinds of redundancy, and the family of "
                    "methods that removes each.",
            footer="A general-purpose compressor combines several of these, "
                   "which is why gzip does far better on English text than on "
                   "an already-encoded photograph."),
        desc(
            "Only the last row is lossy. The first four remove structure that "
            "can be perfectly rebuilt, which is why lossless methods recover "
            "the original bit for bit; the fifth discards content, which is "
            "why lossy compression achieves ratios the others cannot approach "
            "and why its damage accumulates across repeated saves."
        ),
    ]),

    ("Quantisation Depth and Dynamic Range", [
        desc(
            "Bit depth decides how finely a sample can be recorded, and the "
            "relationship is exponential: each extra bit doubles the number "
            "of levels and halves the quantisation error."
        ),
        table(
            ["Bit depth", "Levels", "Typical use", "Effect"],
            [["1 bit", "2", "Black-and-white fax", "Presence or absence only"],
             ["8 bits", "256", "Simple audio, greyscale images",
              "Audible hiss on quiet passages"],
             ["16 bits", "65,536", "CD audio",
              "Quantisation noise below hearing"],
             ["24 bits", "16.7 million", "Studio audio, colour depth",
              "Headroom for later processing"]],
            caption="What bit depth buys, per sample.",
            footer="Extra depth matters most where the signal will be "
                   "processed afterwards: every operation adds rounding "
                   "error, and the spare bits absorb it."),
        desc(
            "The examination pairs this with the sampling rate to size a "
            "file. Uncompressed audio needs sample rate times bit depth times "
            "channel count: CD audio is 44,100 x 16 x 2, which is 1,411,200 "
            "bits -- about 176 kilobytes -- for every second. That figure is "
            "why compression was not a convenience but a precondition for "
            "digital audio and video reaching consumers at all."
        ),
    ]),

    ("Reading a State Transition Table", [
        desc(
            "An automaton is more often given as a table than as a diagram, "
            "because a table is unambiguous and compact. The rows are states, "
            "the columns are input symbols, and each cell holds the state the "
            "machine moves to."
        ),
        table(
            ["Current state", "On input 0", "On input 1", "Accepting?"],
            [["S0 (start)", "S1", "S0", "No"],
             ["S1", "S1", "S2", "No"],
             ["S2", "S1", "S0", "Yes"]],
            caption="The automaton accepting binary strings that end in 01.",
            footer="Trace the input one symbol at a time, writing the state "
                   "down after each. Acceptance depends only on the state "
                   "after the LAST symbol."),
        desc(
            "Notice how much the table settles that prose would leave vague. "
            "Every state has an entry for every input, so the machine can "
            "never be stuck; exactly one state is accepting; and the "
            "transitions out of S2 show that reaching an accepting state does "
            "not end the trace, since a further symbol moves on from it."
        ),
        desc(
            "That last point is the one examination items exploit. A "
            "candidate who stops as soon as the machine touches an accepting "
            "state gets the wrong answer on any input with symbols after it, "
            "and the distractors are written for exactly that mistake."
        ),
    ]),

    ("What an Automaton Cannot Do", [
        desc(
            "A finite automaton remembers only which state it is in, and that "
            "limitation is precise rather than vague: it can count only as "
            "high as it has states."
        ),
        desc(
            "So it can recognise strings ending in 01, strings with an even "
            "number of ones, or strings matching any regular expression. It "
            "CANNOT recognise a string with equal numbers of opening and "
            "closing brackets, because that needs unbounded counting, and no "
            "fixed number of states can hold an unbounded count."
        ),
        compare_grid(
            "WHY THIS IS A PRACTICAL FACT",
            "The boundary explains a real division of labour inside every "
            "compiler, and a rule of thumb worth carrying.",
            [("What the lexer does",
              "Recognises tokens -- identifiers, numbers, operators. All "
              "regular, all recognisable by a finite automaton, which is why "
              "a lexer is fast and simple."),
             ("What the parser does",
              "Recognises nesting -- brackets, blocks, expressions. Not "
              "regular, so it needs a grammar and a stack, which is why "
              "parsing is the heavier phase."),
             ("The rule of thumb",
              "A regular expression cannot correctly match arbitrarily "
              "nested structures. This is why parsing HTML or source code "
              "with one goes wrong on the cases that matter."),
             ("Where the boundary sits",
              "Counting to a fixed limit is regular; counting without a "
              "limit is not. Two nesting levels can be matched by a regular "
              "expression; any number cannot.")]),
    ]),

    ("Common Mistakes", [
        desc(
            "The recurring errors on this material, each a confusion between "
            "two things the syllabus deliberately separates."
        ),
        ul([
            "Believing encoding loses information in A/D conversion. Sampling "
            "and quantisation lose it; encoding is only a change of "
            "notation.",
            "Sampling at exactly twice the highest frequency. The theorem "
            "requires MORE than twice.",
            "Expecting lossless compression to shrink already-compressed "
            "data. It is already near its entropy.",
            "Treating mojibake as data corruption. The bytes are intact; only "
            "the character code being applied is wrong.",
            "Confusing deduction with induction. Deduction gives certainty "
            "from rules; induction gives probability from observations.",
            "Assuming a grammatically valid program is meaningful. Syntax "
            "analysis and semantic analysis are separate phases for exactly "
            "this reason.",
            "Trying to trace an automaton mentally. Write the state after "
            "every input symbol.",
        ]),
    ]),

    ("Recall Check", [
        desc("Cover the answers and produce each one before checking."),
        review_cards(
            "TEST YOURSELF",
            "Five results this lesson expects on sight.",
            [("Information content of a probability-p event",
              "log base 2 of 1/p, in bits",
              "Probability one half gives one bit; one in 1,024 gives ten. "
              "Rare events carry more information than common ones."),
             ("The sampling theorem",
              "Sample above twice the highest frequency",
              "Below that, high frequencies reappear disguised as low ones -- "
              "aliasing. 20 kHz hearing is why CDs sample at 44.1 kHz."),
             ("Where A/D conversion loses information",
              "Sampling and quantisation only",
              "Encoding is a change of notation and loses nothing. This "
              "distinction is examined directly."),
             ("Why Huffman codes need no separators",
              "No code is a prefix of another",
              "The decoder reads bit by bit and always knows where a code "
              "ends. Frequent symbols get the short codes."),
             ("Deduction versus induction",
              "Certain from rules; probable from observations",
              "A rules engine deduces and can explain itself. A trained "
              "model induces, and is confident rather than correct.")]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("This lesson supplies vocabulary several later ones assume."),
        ul([
            "A/D conversion and sampling return in Multimedia as audio and "
            "image encoding, and in Measurement and Control as the sensor "
            "path.",
            "Compression returns in Multimedia as JPEG and MPEG, and in "
            "Network as payload efficiency.",
            "Character codes return in Database as column collations and in "
            "Network as content encoding.",
            "Grammars and automata return in Programming Languages as "
            "parsing, and in Software Design as the state machine diagram.",
            "Entropy and channel capacity return in the next lesson as the "
            "limit on a noisy channel.",
        ]),
    ]),
]

_info_quiz = [
    mcq("EASY",
        "An audio signal contains frequencies up to 15 kHz.\n\n"
        "According to the sampling theorem, what is the minimum acceptable "
        "sampling rate?",
        [("7.5 kHz", False),
         ("15 kHz", False),
         ("Above 30 kHz", True),
         ("Exactly 30 kHz", False)],
        "The sampling theorem requires a rate greater than twice the highest "
        "frequency present, so above 30 kHz. Sampling at exactly 30 kHz is "
        "the boundary case the theorem excludes, and sampling at or below "
        "15 kHz causes aliasing, where high frequencies are reconstructed as "
        "spurious low ones rather than simply being lost."),

    mcq("EASY",
        "Analogue-to-digital conversion is performed in three stages: "
        "sampling, quantisation and encoding.\n\n"
        "At which stage or stages is information permanently lost?",
        [("Sampling and quantisation only", True),
         ("Encoding only", False),
         ("Quantisation and encoding only", False),
         ("All three stages equally", False)],
        "Sampling discards everything that happened between the sample "
        "instants, and quantisation discards the difference between the true "
        "value and the nearest available level. Encoding merely writes the "
        "already-quantised values as bit patterns -- a change of notation "
        "that is fully reversible and loses nothing."),

    mcq("AVERAGE",
        "Five symbols occur with frequencies 45%, 25%, 15%, 10% and 5%. A "
        "Huffman code assigns them 1, 2, 3, 4 and 4 bits respectively.\n\n"
        "What is the average number of bits per symbol?",
        [("2.00", True),
         ("2.80", False),
         ("3.00", False),
         ("2.40", False)],
        "Weight each code length by its frequency: (0.45 x 1) + (0.25 x 2) + "
        "(0.15 x 3) + (0.10 x 4) + (0.05 x 4) = 0.45 + 0.50 + 0.45 + 0.40 + "
        "0.20 = 2.00 bits. The value 3.00 is the fixed-length code that "
        "Huffman improves on, and 2.80 is the unweighted mean of the five "
        "code lengths, which ignores the frequencies that make the scheme "
        "work at all."),

    mcq("AVERAGE",
        "A text file is compressed with a lossless algorithm, reducing it to "
        "30% of its original size. The compressed file is then passed through "
        "the same algorithm again.\n\n"
        "What is the most likely outcome?",
        [("It shrinks by roughly another 70%.", False),
         ("Its size is essentially unchanged, possibly slightly larger.",
          True),
         ("It shrinks, but the original can no longer be recovered.", False),
         ("The algorithm rejects the input as already compressed.", False)],
        "Compression works by removing redundancy, and the first pass has "
        "already taken the file close to its entropy -- the theoretical floor "
        "on lossless representation. There is little redundancy left to "
        "exploit, so the second pass gains almost nothing and typically adds "
        "a few bytes of container overhead. Recoverability is unaffected, "
        "since lossless compression remains lossless however many times it is "
        "applied."),

    mcq("AVERAGE",
        "Text stored in one character encoding is opened by an application "
        "that assumes a different encoding, and displays as meaningless "
        "symbols.\n\n"
        "What is the correct diagnosis?",
        [("The file was truncated during transfer and must be resent.",
          False),
         ("The bytes are intact but are being interpreted with the wrong "
          "code table.", True),
         ("The characters were permanently lost when the file was saved.",
          False),
         ("The file must be recovered from backup, since the damage is "
          "irreversible.", False)],
        "A character code is a mapping from numbers to characters, and a byte "
        "carries no record of which mapping produced it. Nothing has been "
        "damaged: reopening the same bytes with the correct encoding restores "
        "the text exactly. Treating this as corruption and restoring from "
        "backup is a common and entirely unnecessary response, and it will "
        "reproduce the same display problem."),

    mcq("HARD",
        "Consider a finite automaton with start state S0. From S0, input 0 "
        "goes to S1 and input 1 stays at S0. From S1, input 1 goes to the "
        "accepting state S2 and input 0 stays at S1. From S2, input 0 goes to "
        "S1 and input 1 goes to S0.\n\n"
        "Is the input string 1 0 0 1 0 accepted?",
        [("Yes, because the string contains the sequence 01.", False),
         ("Yes, because the automaton visits S2 during the trace.", False),
         ("No, because the automaton finishes in S1 rather than S2.", True),
         ("No, because the automaton never reaches S2 at all.", False)],
        "Trace it: S0 --1--> S0 --0--> S1 --0--> S1 --1--> S2 --0--> S1. The "
        "automaton does reach the accepting state S2 partway through, but the "
        "final 0 moves it back to S1, and acceptance depends solely on the "
        "state after the LAST symbol. This automaton accepts strings ending "
        "in 01, and the string ends in 10. Visiting an accepting state en "
        "route is irrelevant."),

    mcq("AVERAGE",
        "A compiler reports that a variable declared as an integer is being "
        "assigned a text value.\n\n"
        "Which phase of compilation detected this?",
        [("Lexical analysis", False),
         ("Syntax analysis", False),
         ("Code generation", False),
         ("Semantic analysis", True)],
        "The statement is perfectly well formed -- the tokens are all valid "
        "and the sequence matches the grammar -- so lexical and syntax "
        "analysis both pass it. The problem is one of meaning, and type "
        "compatibility is exactly what semantic analysis checks. Code "
        "generation runs only after all checking has succeeded."),

    mcq("HARD",
        "An incident review notes that every outage in the past year occurred "
        "during a deployment, and concludes that deployments cause outages.\n\n"
        "What kind of inference is this, and what does it establish?",
        [("Deduction, establishing the conclusion with certainty", False),
         ("Deduction, establishing it only for the observed period", False),
         ("Induction, establishing a probable rather than certain "
          "conclusion", True),
         ("Induction, establishing the conclusion with certainty once enough "
          "cases are observed", False)],
        "Reasoning from specific observations to a general rule is induction, "
        "and its conclusions are always provisional -- a single outage "
        "outside a deployment window would overturn this one. No number of "
        "confirming cases converts induction into certainty. Deduction runs "
        "the other way, from general rules to a specific conclusion, and only "
        "it delivers certainty when its premises hold."),

    mcq("EASY",
        "Under the definition used in information theory, which message "
        "carries the MOST information?",
        [("One reporting an event that occurs with probability 0.5", False),
         ("One reporting an event that occurs with probability 0.99", False),
         ("One reporting an event that occurs with probability 0.001", True),
         ("One reporting an event that is certain to occur", False)],
        "Information content is the logarithm base 2 of 1/p, so it rises as "
        "probability falls: 0.001 gives roughly 10 bits, 0.5 gives exactly 1, "
        "and 0.99 gives about 0.014. A certain event carries zero information "
        "because the recipient already knew the outcome. This inverse "
        "relationship is what makes rare events worth reporting and common "
        "ones worth compressing."),

    mcq("AVERAGE",
        "A grammar in BNF defines a valid identifier, and a candidate string "
        "must be tested against it.\n\n"
        "What does the grammar determine about that string?",
        [("Whether it is well formed, but nothing about what it means",
          True),
         ("Whether it is well formed and whether its type is correct", False),
         ("What the string evaluates to when the program runs", False),
         ("Whether the identifier has been declared elsewhere", False)],
        "A grammar defines membership of a formal language -- which strings "
        "are structurally legal -- and nothing more. Type correctness and "
        "whether a name has been declared are semantic questions, checked in "
        "a later compilation phase, and runtime values are not a property of "
        "the grammar at all. This separation is precisely why a program can "
        "parse cleanly and still be rejected, or compile cleanly and still be "
        "wrong."),
]

LESSON_INFORMATION = lesson(
    MAJOR, MIDDLE,
    "Theory of Information, Coding and Automata",
    _info_quiz,
    lesson_structure(
        "Theory of Information, Coding and Automata",
        "This lesson is about how meaning becomes symbols and symbols become "
        "bits. It measures information, converts a continuous signal into a "
        "discrete one and identifies exactly where that loses something, "
        "explains what compression can and cannot achieve, sets out the "
        "character codes that decide what a byte means, and then turns to the "
        "formal side -- grammars that define which strings are legal, "
        "automata that decide membership, and the compiler phases that apply "
        "both. It closes with the overview of artificial intelligence the "
        "syllabus asks for.",
        [
            "Explain information content and entropy, and why they bound "
            "compression",
            "Describe sampling, quantisation and encoding, and state where "
            "information is lost",
            "Apply the sampling theorem and explain aliasing",
            "Distinguish lossless from lossy compression and compute the "
            "average code length of a Huffman code",
            "Identify the character codes the syllabus names and diagnose a "
            "wrong-encoding fault",
            "Distinguish deduction from induction and relate each to a class "
            "of AI system",
            "Read a BNF grammar and trace a finite automaton to decide "
            "acceptance",
            "Name the compiler phases and say which detects a given error",
        ],
        70,
        _info_sections,
        [
            ("Information content",
             "The logarithm base 2 of 1/p for an event of probability p, "
             "measured in bits. Rare events carry more information than "
             "common ones; a certain event carries none."),
            ("Entropy",
             "The average information content per symbol of a source, and "
             "therefore the floor on the average bits per symbol that any "
             "lossless compression can achieve."),
            ("Sampling",
             "Measuring a continuous signal at regular intervals. Everything "
             "between the samples is discarded."),
            ("Sampling theorem",
             "To reconstruct a signal, sample at MORE than twice its highest "
             "frequency. Below that rate, high frequencies reappear as "
             "spurious low ones."),
            ("Aliasing",
             "The artefact produced by under-sampling: a high frequency is "
             "reconstructed as a different, lower one rather than being "
             "absent."),
            ("Quantisation",
             "Rounding each sample to one of a finite set of levels. The "
             "discarded remainder is quantisation noise, halved by each "
             "additional bit of depth."),
            ("Lossless compression",
             "Compression from which the original is recovered bit for bit. "
             "ZIP, PNG and FLAC. Ratios are modest and fall to nothing on "
             "already-compressed data."),
            ("Lossy compression",
             "Compression that discards detail judged imperceptible, "
             "achieving far higher ratios. JPEG and MP3. The loss accumulates "
             "across repeated saves."),
            ("Huffman coding",
             "A lossless scheme giving frequent symbols short codes and rare "
             "ones long codes, built so no code is a prefix of another and "
             "the stream therefore needs no separators."),
            ("Run-length encoding",
             "Replacing a run of identical values with the value and a count. "
             "Effective on data with long runs, and capable of expanding data "
             "without them."),
            ("Character code",
             "A table mapping numbers to characters. A byte carries no record "
             "of which table produced it, which is why the encoding must be "
             "known separately."),
            ("Mojibake",
             "Text rendered meaningless by being read with the wrong "
             "character code. The bytes are undamaged and the correct "
             "encoding restores them exactly."),
            ("Deduction",
             "Inference from general rules to a specific conclusion. Certain, "
             "provided the rules hold."),
            ("Induction",
             "Inference from specific observations to a general rule. "
             "Probable, never certain, and overturnable by one "
             "counter-example."),
            ("BNF (Backus-Naur Form)",
             "A notation for a grammar, defining non-terminals in terms of "
             "terminals and other non-terminals. Recursion lets a finite set "
             "of rules describe infinitely many valid strings."),
            ("Finite automaton",
             "A model of computation consisting of states, an input alphabet "
             "and transitions. It remembers only its current state, and "
             "acceptance depends solely on the state after the last input "
             "symbol."),
            ("Lexical analysis",
             "The compiler phase grouping characters into tokens. Catches "
             "characters that belong to no token."),
            ("Syntax analysis",
             "The compiler phase checking the token sequence against the "
             "grammar and building a syntax tree. Catches structural errors "
             "such as a missing bracket."),
            ("Semantic analysis",
             "The compiler phase checking meaning -- types, declarations, "
             "argument counts. Catches errors in code that is perfectly well "
             "formed."),
        ],
        "Information is measured by surprise: an event of probability p "
        "carries log base 2 of 1/p bits, so rare messages say more than "
        "common ones, and a source's average -- its entropy -- is the hard "
        "floor under any lossless compression. Converting an analogue signal "
        "to digital samples it, quantises it and encodes it, and only the "
        "first two lose anything; sampling must exceed twice the highest "
        "frequency or aliasing turns high frequencies into false low ones. "
        "Lossless compression removes redundancy and stops at the entropy, "
        "which is why a compressed file will not compress again; lossy "
        "compression discards what perception will not miss and accumulates "
        "damage across saves. Huffman coding gives short codes to frequent "
        "symbols and needs no separators because no code prefixes another. A "
        "character code is only a table, so text read with the wrong one "
        "produces mojibake -- an interpretation fault, never corruption. On "
        "the formal side, deduction takes rules to certain conclusions while "
        "induction takes observations to probable ones, which is the "
        "difference between a rules engine and a trained model. A BNF grammar "
        "decides which strings are well formed and says nothing about "
        "meaning, an automaton decides acceptance by the state it finishes "
        "in and not by the states it passes through, and a compiler applies "
        "both in order -- lexical, syntax, semantic -- which is why the phase "
        "that reports an error tells you what kind of error it is.",
        exam_notes=[
            desc(
                "This material appears on Subject A as short conceptual "
                "items, and its automata and grammar content is genuine "
                "preparation for Subject B, where tracing a defined process "
                "against a given input is the whole task."
            ),
            ul([
                "Applying the sampling theorem to a stated frequency.",
                "Identifying where A/D conversion loses information.",
                "Computing an average code length from a Huffman table.",
                "Distinguishing lossless from lossy for a stated data type.",
                "Naming the character code from a described property.",
                "Tracing a finite automaton over a given input string.",
                "Naming which compiler phase catches a described error.",
                "Classifying an argument as deductive or inductive.",
            ]),
            desc(
                "Automaton items reward writing the state down after each "
                "symbol. Acceptance depends only on the final state, and the "
                "distractors are built for candidates who stop tracing as "
                "soon as they touch an accepting state."
            ),
        ],
    ))

# ==========================================================================
# Lesson 4: Theory of Communications
# ==========================================================================

_comms_sections = [
    ("What Has to Survive the Journey", [
        desc(
            "Communication theory asks a single question: how does a pattern "
            "of bits leave one machine, cross a physical medium that "
            "distorts and corrupts it, and arrive intact at another? Every "
            "topic here is one part of that answer."
        ),
        compare_grid(
            "THE FOUR PROBLEMS A LINK MUST SOLVE",
            "Each is handled by a different mechanism, and the examination "
            "asks you to match a symptom to the right one.",
            [("Getting bits onto the medium",
              "A wire carries voltage and a fibre carries light, not ones and "
              "zeros. Encoding and modulation bridge that."),
             ("Sharing the medium",
              "One physical link usually carries several conversations. "
              "Multiplexing divides it in time, frequency or wavelength."),
             ("Keeping the ends in step",
              "The receiver must know where each bit and each frame begins. "
              "Synchronous and asynchronous transmission solve this "
              "differently."),
             ("Surviving corruption",
              "Noise flips bits. Error detection notices; error correction "
              "repairs, either by redundancy or by asking again.")]),
    ]),

    ("Signals, Bandwidth and Capacity", [
        desc(
            "A signal is a physical quantity varying over time -- a voltage, "
            "a light intensity, a radio wave. Bandwidth is the range of "
            "frequencies a medium will carry, and it is the fundamental limit "
            "on how fast that medium can signal."
        ),
        desc(
            "Two rates are distinguished and constantly confused. The BAUD "
            "RATE is the number of signal changes -- symbols -- per second. "
            "The BIT RATE is the number of bits per second. They are equal "
            "only when each symbol carries exactly one bit. A modulation "
            "scheme carrying four bits per symbol gives a bit rate four times "
            "the baud rate, which is the whole point of using one."
        ),
        table(
            ["Quantity", "Measured in", "What it describes"],
            [["Bandwidth", "Hertz",
              "The range of frequencies the medium will carry"],
             ["Baud rate", "Symbols per second",
              "How often the signal changes"],
             ["Bit rate", "Bits per second",
              "Baud rate times the bits carried per symbol"],
             ["Signal-to-noise ratio", "Decibels",
              "How far the signal stands above the noise"],
             ["Throughput", "Bits per second",
              "What is actually delivered once overhead and loss are counted"]],
            caption="Five quantities that are constantly confused with one "
                    "another.",
            footer="Throughput is always below the bit rate, because framing, "
                   "headers, acknowledgements and retransmissions all consume "
                   "part of it."),
        desc(
            "Capacity is bounded by bandwidth and by noise together. Widening "
            "the bandwidth raises the ceiling; more noise lowers it, because "
            "a noisy channel cannot reliably distinguish as many signal "
            "levels. This is why a link's usable rate falls as its "
            "signal-to-noise ratio worsens, rather than the link simply "
            "failing -- and why a long cable run is slower rather than dead."
        ),
    ]),

    ("Modulation", [
        desc(
            "Modulation impresses data onto a carrier wave. A sine wave has "
            "exactly three properties that can be varied, which is why there "
            "are exactly three families of modulation scheme."
        ),
        image(fig("modulation-schemes")),
        desc(
            "AMPLITUDE modulation varies the wave's height. It is the "
            "simplest to build and the most vulnerable to noise, because "
            "noise is itself an amplitude disturbance and the receiver cannot "
            "tell the two apart."
        ),
        desc(
            "FREQUENCY modulation varies the rate of oscillation. Since "
            "amplitude noise does not change a wave's frequency, it is "
            "markedly more robust -- the reason FM radio sounds clean where "
            "AM crackles -- at the cost of occupying more bandwidth."
        ),
        desc(
            "PHASE modulation varies the timing offset of the wave. It is "
            "efficient and noise-resistant, and it underlies most modern "
            "high-rate links. Combining phase with amplitude gives quadrature "
            "amplitude modulation, QAM, which packs several bits into each "
            "symbol and is how a fixed bandwidth is made to carry a high bit "
            "rate."
        ),
        desc(
            "The trade-off running through all of it: packing more bits per "
            "symbol means the receiver must distinguish more closely spaced "
            "signal states, which needs a better signal-to-noise ratio. This "
            "is why a link negotiates down to a slower scheme when conditions "
            "worsen rather than dropping, and why the same modem is fast on a "
            "short line and slow on a long one."
        ),
    ]),

    ("Multiplexing", [
        desc(
            "Multiplexing lets one physical medium carry several independent "
            "streams. The three methods divide the medium along three "
            "different axes."
        ),
        content_tabs(
            "THREE WAYS TO SHARE ONE MEDIUM",
            "Each divides a different resource, and each suits a different "
            "kind of traffic.",
            [("Time division (TDM)", "Divide the timeline",
              "Each stream gets the whole medium during its allotted time "
              "slot, in a repeating cycle. Simple and fair, but a slot "
              "assigned to an idle stream is wasted -- which is what "
              "statistical TDM fixes by allocating slots on demand rather "
              "than by rotation."),
             ("Frequency division (FDM)", "Divide the spectrum",
              "Each stream is modulated onto a different carrier frequency "
              "and all transmit simultaneously, separated by filters at the "
              "receiver. Guard bands between channels prevent interference "
              "and consume part of the available spectrum."),
             ("Wavelength division (WDM)", "Divide the light",
              "The optical form of frequency division: several wavelengths "
              "of light share one fibre. Dense WDM carries dozens of channels "
              "on a single strand, which is how long-haul capacity is "
              "expanded without laying new fibre.")]),
    ]),

    ("Synchronous and Asynchronous Transmission", [
        desc(
            "The receiver must know where each character or frame begins. "
            "Two approaches solve this, and the difference is what they spend "
            "to do it."
        ),
        compare_grid(
            "TWO WAYS TO STAY IN STEP",
            "One frames every character; the other frames a whole block.",
            [("Asynchronous",
              "Each character is wrapped in a start bit and one or more stop "
              "bits, so the receiver resynchronises at every character. "
              "Simple, tolerant of irregular gaps, and wasteful -- typically "
              "two framing bits for every eight of data."),
             ("Synchronous",
              "A whole block is sent against a shared clock, with framing "
              "only at the block's boundaries. Far more efficient for bulk "
              "transfer, but the two ends must maintain clock agreement "
              "throughout.")]),
        desc(
            "The efficiency gap is not small. Asynchronous framing spends "
            "about 20% of the link on start and stop bits, which is "
            "acceptable for a keyboard and unacceptable for a backbone. This "
            "is why terminal-style links are asynchronous and high-speed "
            "links are synchronous."
        ),
        image(fig("transmission-modes")),
        desc(
            "Separately from framing, a link is described by which directions "
            "it supports. SIMPLEX carries data one way only. HALF DUPLEX "
            "carries it both ways but only one at a time, so the ends take "
            "turns and collisions must be managed. FULL DUPLEX carries it "
            "both ways simultaneously, which needs either separate paths or "
            "separate frequencies -- and is the default on switched Ethernet, "
            "where each host has the link to itself."
        ),
    ]),

    ("Error Detection", [
        desc(
            "Noise flips bits, and a receiver has no way to notice unless the "
            "sender adds redundancy. Every detection scheme is the same "
            "bargain: extra bits computed from the data, checked on arrival."
        ),
        table(
            ["Method", "Detects", "Corrects", "Cost"],
            [["Parity bit", "Any odd number of errors", "Nothing", "1 bit"],
             ["Checksum", "Most bit errors, not reordering", "Nothing",
              "A few bytes"],
             ["CRC", "Burst errors reliably", "Nothing", "16 or 32 bits"],
             ["Hamming code", "Two-bit errors", "Single-bit errors",
              "Several bits"],
             ["ARQ (retransmission)", "Via one of the above", "By resending",
              "One round trip"]],
            caption="Detection is cheap; correction costs either redundancy "
                    "or a round trip.",
            footer="A parity bit is blind to any even number of flipped bits, "
                   "which is why it is a teaching example rather than a "
                   "production mechanism."),
        desc(
            "A PARITY BIT is the minimum: one bit set so that the total "
            "number of ones is even, under even parity, or odd, under odd "
            "parity. It detects any odd number of flipped bits and is blind "
            "to any even number -- two errors cancel and the check passes. "
            "That limitation is why parity is a teaching example rather than "
            "a production mechanism, though it survives in memory as the "
            "cheapest possible check."
        ),
        desc(
            "A CHECKSUM adds the data words together and sends the sum. It "
            "catches most single-bit errors cheaply, but it is insensitive to "
            "reordering -- addition is commutative, so swapping two words "
            "leaves the sum unchanged."
        ),
        desc(
            "A CRC, cyclic redundancy check, treats the message as a large "
            "binary number, divides it by an agreed generator polynomial, and "
            "sends the remainder. It is far stronger than a checksum, "
            "especially against burst errors -- consecutive corrupted bits, "
            "which is what physical interference actually produces -- and it "
            "is cheap enough in hardware that Ethernet puts a 32-bit CRC on "
            "every frame."
        ),
        desc(
            "Note what none of these do: they detect, they do not repair. A "
            "frame failing its CRC is discarded, and recovery is somebody "
            "else's problem -- which is why the Network lesson's transport "
            "layer exists."
        ),
    ]),

    ("Error Correction", [
        desc(
            "Correction costs more than detection, and the choice between the "
            "two ways of paying is decided by the round-trip time."
        ),
        content_accordion(
            "TWO STRATEGIES",
            "Forward correction spends bandwidth; retransmission spends "
            "time. Which is cheaper depends on the link.",
            [("Forward error correction (Hamming and similar)",
              "Enough redundancy is sent that the receiver can locate and "
              "repair an error without asking. A Hamming code places parity "
              "bits at power-of-two positions, each covering a defined subset "
              "of the data bits; the failing checks combine into a number "
              "that is the position of the flipped bit. It corrects any "
              "single-bit error and detects any double-bit one."),
             ("Automatic repeat request (ARQ)",
              "The receiver detects an error and asks for a retransmission. "
              "Cheap in redundancy and expensive in latency: the cost is one "
              "round trip per failure, plus the buffering to hold "
              "unacknowledged data. This is what TCP does."),
             ("Choosing between them",
              "Forward correction wins wherever a round trip is expensive or "
              "impossible -- a deep-space link, a broadcast with no return "
              "channel, a stored medium such as an optical disc. ARQ wins on "
              "short, mostly reliable links where retransmission is rare and "
              "the round trip is short, which describes most terrestrial "
              "networking.")]),
        desc(
            "The general principle behind correction is worth carrying: "
            "detection needs only enough redundancy to notice that the "
            "received pattern is not a legal one, while correction needs "
            "enough that the nearest legal pattern is unambiguous. That is a "
            "strictly stronger requirement, and it is why correcting codes "
            "always cost more bits than detecting ones."
        ),
    ]),

    ("Serial and Parallel Transmission", [
        desc(
            "Bits can be sent one after another down a single path, or "
            "several at a time down several paths. Intuition says parallel is "
            "faster, and for decades it was -- then it stopped being, for a "
            "reason worth understanding."
        ),
        table(
            ["", "Serial", "Parallel"],
            [["Paths", "One", "One per bit, plus control"],
             ["Cost per metre", "Low", "High"],
             ["Distance", "Long runs are practical", "Short runs only"],
             ["Limiting problem", "Per-line signalling rate",
              "Skew: lines arriving at different times"],
             ["Modern examples", "USB, SATA, PCIe, Ethernet",
              "Internal buses over very short distances"]],
            caption="Why nearly every external interface is now serial.",
            footer="As clock rates rose, the tiny differences in path length "
                   "on a parallel cable became larger than one bit period, so "
                   "the bits stopped arriving together. Serial links have no "
                   "skew to solve, so they scaled and parallel ones did not."),
        desc(
            "This is a genuinely instructive reversal: parallel ATA gave way "
            "to serial ATA, and parallel PCI to serial PCI Express, both times "
            "because the fastest achievable serial link overtook the fastest "
            "manageable parallel one. The general lesson is that a design "
            "advantage can expire when the numbers around it change."
        ),
    ]),

    ("Baseband and Broadband", [
        desc(
            "A second way of dividing transmission methods, and one the "
            "syllabus names explicitly."
        ),
        compare_grid(
            "TWO WAYS TO OCCUPY A MEDIUM",
            "The question is whether the medium carries one signal in its "
            "natural form or several on separate carriers.",
            [("Baseband",
              "The digital signal is placed on the medium directly, using its "
              "whole bandwidth for one channel. Simple and efficient; this is "
              "what Ethernet does, which is why its standards are named "
              "10BASE-T and 1000BASE-T."),
             ("Broadband",
              "The medium is divided into frequency bands, each carrying a "
              "modulated signal, so several channels share it "
              "simultaneously. Cable television and DSL work this way.")]),
        desc(
            "The everyday use of 'broadband' to mean 'fast internet' is not "
            "this meaning, and the examination uses the technical one. A "
            "gigabit Ethernet link is baseband despite being fast; a slow "
            "cable connection is broadband despite not being."
        ),
    ]),

    ("Line Coding", [
        desc(
            "Before modulation there is a more basic question: how is a 1 or "
            "a 0 represented as a voltage over time? The answer is a line "
            "code, and the schemes differ in how they handle two problems -- "
            "keeping the receiver's clock in step, and avoiding a persistent "
            "DC offset that transformers and capacitors cannot pass."
        ),
        table(
            ["Scheme", "How a bit is sent", "Self-clocking?", "Cost"],
            [["NRZ", "One voltage level held for the whole bit", "No",
              "Cheapest, and loses sync on a long run of one value"],
             ["NRZI", "A transition means 1; no transition means 0",
              "Partly", "Long runs of 0 still lose sync"],
             ["Manchester", "A transition in the MIDDLE of every bit", "Yes",
              "Needs twice the signalling rate"],
             ["4B/5B", "Four data bits mapped to a five-bit pattern", "Yes",
              "25% overhead, and no long runs by construction"]],
            caption="Line codes, and the trade each makes between clock "
                    "recovery and efficiency.",
            footer="Manchester encoding guarantees a transition every bit, so "
                   "the receiver can never drift -- which is why the original "
                   "Ethernet used it and paid the doubled signalling rate."),
        desc(
            "The pattern to take away is that a self-clocking code buys "
            "reliability with bandwidth. Faster standards moved from "
            "Manchester's 100% overhead to 4B/5B's 25% by guaranteeing "
            "transitions through a lookup table rather than through the shape "
            "of every bit -- the same problem solved more cheaply once "
            "hardware could afford the table."
        ),
    ]),

    ("Circuit Switching and Packet Switching", [
        desc(
            "When a medium is shared between many conversations, something "
            "must decide who gets it and when. Two answers have shaped every "
            "network built."
        ),
        table(
            ["", "Circuit switching", "Packet switching"],
            [["Setup", "A path is reserved before any data flows",
              "None; each packet is routed independently"],
             ["Capacity", "Guaranteed for the call's duration",
              "Shared, and variable"],
             ["Idle time", "Wasted -- the circuit is held regardless",
              "Used by other traffic"],
             ["Delay", "Constant once established",
              "Variable, and packets may arrive out of order"],
             ["Failure", "The call drops with the path",
              "Traffic reroutes around the fault"],
             ["Example", "The traditional telephone network",
              "The internet"]],
            caption="Reserving a path against sharing one.",
            footer="Packet switching wins on efficiency and resilience and "
                   "loses on predictability, which is why real-time traffic "
                   "over it needs quality-of-service mechanisms that "
                   "reintroduce some of what circuit switching gave away."),
        desc(
            "A third option sits between them. Virtual circuit switching "
            "establishes a path in advance, as circuit switching does, but "
            "carries packets along it and shares the underlying capacity, as "
            "packet switching does -- giving ordered delivery and predictable "
            "routing without dedicating the bandwidth."
        ),
    ]),

    ("Flow Control", [
        desc(
            "A fast sender can overwhelm a slow receiver whatever the medium "
            "does, because the bottleneck is the receiver's buffer rather "
            "than the link. Flow control is the sender's agreement to slow "
            "down, and the two mechanisms differ sharply in efficiency."
        ),
        content_tabs(
            "TWO FLOW-CONTROL MECHANISMS",
            "Both prevent overrun; only one keeps a long link busy.",
            [("Stop and wait", "Send one, then wait for the acknowledgement",
              "The simplest possible scheme, and the least efficient. The "
              "sender is idle for a full round trip after every frame, so on "
              "a link with any real latency the utilisation collapses -- a "
              "1ms frame followed by a 50ms round trip leaves the link idle "
              "98% of the time. Fine for a short local link, useless for a "
              "long one."),
             ("Sliding window", "Send several before waiting",
              "The sender may have up to a window's worth of unacknowledged "
              "frames outstanding, so it keeps transmitting while earlier "
              "acknowledgements are still in flight. Sizing the window to the "
              "bandwidth-delay product -- the amount of data in flight when "
              "the link is fully used -- keeps the link busy continuously. "
              "This is what TCP does."),
             ("Why the window size matters", "Bandwidth times delay",
              "A window smaller than the bandwidth-delay product throttles "
              "the connection no matter how fast the link is, which is the "
              "classic explanation for a fast intercontinental link "
              "delivering disappointing throughput. The link is not the "
              "problem; the window is.")]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A link transmits 8-bit characters asynchronously with one "
            "start bit and one stop bit, at 9,600 baud with one bit per "
            "symbol. How many characters can be sent per second?\""
        ),
        ol([
            "Convert baud to bits per second. One bit per symbol means the "
            "bit rate equals the baud rate: 9,600 bits per second.",
            "Count the bits per character. Asynchronous framing adds a start "
            "bit and a stop bit to the 8 data bits, so each character "
            "occupies 10 bits on the line.",
            "Divide: 9,600 / 10 = 960 characters per second.",
            "Check the framing overhead separately if asked: 8 useful bits of "
            "every 10 is 80% efficiency.",
        ]),
        desc(
            "The item is testing two things at once, and both are easy to "
            "miss. Dividing 9,600 by 8 rather than 10 forgets the framing and "
            "gives 1,200, which will be among the options. Assuming the baud "
            "rate differs from the bit rate when the question has told you it "
            "does not is the other trap, and it is why the phrase 'one bit "
            "per symbol' is in the stem at all."
        ),
    ]),

    ("Common Mistakes", [
        desc("Where marks are lost on this material."),
        ul([
            "Treating baud rate and bit rate as the same thing. They differ "
            "by the number of bits carried per symbol.",
            "Forgetting start and stop bits when converting a bit rate into "
            "characters per second.",
            "Reading 'broadband' as 'fast' rather than as 'divided into "
            "frequency bands'.",
            "Sizing a sliding window below the bandwidth-delay product, then "
            "blaming the link for the throughput.",
            "Believing a parity bit catches any error. It is blind to any "
            "even number of flipped bits.",
            "Expecting a CRC to correct errors. It detects only; the frame is "
            "discarded.",
            "Assuming higher-order modulation is always better. It needs a "
            "better signal-to-noise ratio, which a poor line cannot supply.",
            "Confusing half duplex with full duplex. Half duplex is "
            "bidirectional but not simultaneous.",
            "Choosing ARQ for a link with no return channel or a very long "
            "round trip, where forward correction is the only option.",
        ]),
    ]),

    ("Recall Check", [
        desc("Produce each answer before revealing it."),
        review_cards(
            "TEST YOURSELF",
            "Five facts this lesson expects on sight.",
            [("Baud rate versus bit rate",
              "Bit rate = baud rate x bits per symbol",
              "They are equal only when each symbol carries one bit. QAM "
              "carries several, which is how a fixed bandwidth reaches a high "
              "bit rate."),
             ("What a parity bit misses",
              "Any even number of errors",
              "Two flipped bits cancel and the check passes. It detects odd "
              "counts only, which is why production links use a CRC."),
             ("What a CRC does with a bad frame",
              "Detects it; the frame is discarded",
              "CRC never corrects. Recovery belongs to a higher layer, which "
              "is why TCP exists above Ethernet."),
             ("The three modulated properties",
              "Amplitude, frequency, phase",
              "Amplitude is the most noise-vulnerable because noise is itself "
              "amplitude. QAM combines amplitude and phase."),
             ("When forward correction beats ARQ",
              "When a round trip is expensive or impossible",
              "Deep space, broadcast without a return channel, stored media. "
              "ARQ wins on short, reliable, low-latency links.")]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("Almost all of this recurs in the Network middle category."),
        ul([
            "Modulation and encoding return as the physical layer.",
            "Multiplexing returns as WDM in optical transport and as "
            "channelisation in wireless.",
            "CRC returns as the Ethernet frame check sequence.",
            "ARQ returns as TCP's retransmission and acknowledgement "
            "mechanism.",
            "Signal-to-noise ratio returns as the reason cable lengths are "
            "limited.",
            "Full and half duplex return as a switch port setting whose "
            "mismatch is a classic fault.",
        ]),
    ]),
]

_comms_quiz = [
    mcq("EASY",
        "Signalling on a link occurs 2,400 times per second, and each "
        "signal change carries four bits.\n\n"
        "What is its bit rate?",
        [("600 bits per second", False),
         ("2,400 bits per second", False),
         ("9,600 bits per second", True),
         ("4,800 bits per second", False)],
        "Bit rate is the baud rate multiplied by the bits carried per symbol: "
        "2,400 x 4 = 9,600 bits per second. Answering 2,400 assumes one bit "
        "per symbol, which is true only for the simplest schemes, and 600 "
        "divides where it should multiply. Carrying several bits per symbol "
        "is precisely why higher-order modulation exists."),

    mcq("EASY",
        "Even parity is applied to the seven data bits 1011001.\n\n"
        "What is the parity bit, and what does the scheme guarantee?",
        [("0, and it detects any single-bit error but not all double-bit "
          "errors", True),
         ("1, and it detects any single-bit error but not all double-bit "
          "errors", False),
         ("0, and it detects and corrects any single-bit error", False),
         ("1, and it detects any number of errors", False)],
        "The data contains four ones, which is already even, so the parity "
        "bit is 0 to keep the total even. Parity detects any ODD number of "
        "flipped bits; two flips return the count to even and pass the check "
        "undetected. It also cannot correct anything, since knowing the "
        "parity is wrong gives no indication of which bit is at fault."),

    mcq("AVERAGE",
        "Physical interference on a cable typically corrupts several "
        "consecutive bits at once rather than isolated ones.\n\n"
        "Which mechanism is designed for this pattern of damage?",
        [("A single parity bit per byte", False),
         ("A simple additive checksum", False),
         ("A cyclic redundancy check", True),
         ("An acknowledgement timer", False)],
        "A CRC treats the frame as a large binary number and sends the "
        "remainder after division by a generator polynomial, which makes it "
        "very strong against burst errors -- runs of consecutive corrupted "
        "bits, which is what real interference produces. A parity bit misses "
        "any even number of flips, and a burst frequently contains an even "
        "number; an additive checksum is weak against reordering and against "
        "compensating errors; and an acknowledgement timer detects loss, not "
        "corruption."),

    mcq("AVERAGE",
        "Telemetry reaches Earth from a spacecraft over a link whose "
        "round-trip signal delay is measured in tens of minutes.\n\n"
        "Which error-handling strategy is appropriate?",
        [("Automatic repeat request, since it uses bandwidth efficiently",
          False),
         ("Forward error correction, since retransmission is impractical",
          True),
         ("A parity bit, since the link is low-bandwidth", False),
         ("No error handling, since deep-space links are noise-free", False)],
        "ARQ costs one round trip per detected error, and tens of minutes per "
        "correction is not a usable recovery mechanism. Forward error "
        "correction sends enough redundancy for the receiver to repair damage "
        "unaided, trading bandwidth for the round trip -- exactly the right "
        "trade here. Deep-space links are in fact very noisy, being extremely "
        "weak by the time they arrive, and a parity bit neither corrects nor "
        "reliably detects."),

    mcq("AVERAGE",
        "Several independent data streams must share one optical fibre.\n\n"
        "Which technique assigns each stream a different wavelength of "
        "light?",
        [("Time division multiplexing", False),
         ("Statistical multiplexing", False),
         ("Wavelength division multiplexing", True),
         ("Frequency shift keying", False)],
        "WDM is the optical form of frequency division multiplexing: each "
        "stream is carried on a different wavelength and all travel the fibre "
        "simultaneously. Time division would give each stream the whole fibre "
        "in rotating slots; statistical multiplexing is time division with "
        "on-demand allocation; and frequency shift keying is a modulation "
        "scheme for a single stream, not a way of sharing a medium."),

    mcq("HARD",
        "A modem on a long, electrically noisy line negotiates a slower "
        "modulation scheme carrying fewer bits per symbol, rather than "
        "failing to connect.\n\n"
        "What explains this behaviour?",
        [("Fewer bits per symbol means fewer signal states to distinguish, "
          "which a poor signal-to-noise ratio can still support.", True),
         ("Slower schemes use less bandwidth, and a long line has less "
          "bandwidth available.", False),
         ("Slower schemes include error correction that faster ones omit.",
          False),
         ("The modem is limited by propagation delay, which rises with line "
          "length.", False)],
        "Packing more bits into each symbol requires more distinct signal "
        "states, spaced more closely together, and the receiver must tell "
        "them apart against the noise. As the signal-to-noise ratio worsens, "
        "the closely spaced states become indistinguishable, so the link "
        "falls back to a scheme with fewer, better-separated states. "
        "Bandwidth and propagation delay are properties of the line rather "
        "than of the scheme, and error correction is not what distinguishes "
        "the two modulation rates."),

    mcq("EASY",
        "Two devices exchange data in both directions, but only one may "
        "transmit at any given moment.\n\n"
        "Which transmission mode is this?",
        [("Simplex", False),
         ("Half duplex", True),
         ("Full duplex", False),
         ("Synchronous", False)],
        "Half duplex is bidirectional but not simultaneous -- the ends take "
        "turns, which is why collision management is needed. Simplex carries "
        "data one way only and has no reverse channel at all. Full duplex "
        "allows both directions at once. Synchronous describes how framing "
        "and clocking work, which is a separate question from direction."),

    mcq("AVERAGE",
        "Asynchronous transmission wraps each 8-bit character in one start "
        "bit and one stop bit.\n\n"
        "What proportion of the transmitted bits is actual data?",
        [("100%", False),
         ("80%", True),
         ("87.5%", False),
         ("75%", False)],
        "Each character occupies 10 bits on the line -- 1 start, 8 data, 1 "
        "stop -- so the data share is 8/10 = 80%. That 20% overhead is "
        "tolerable for a keyboard and unacceptable on a backbone, which is "
        "why bulk links use synchronous transmission and frame a whole block "
        "at once. Answering 87.5% counts only one framing bit rather than "
        "two."),

    mcq("HARD",
        "A Hamming code adds parity bits at positions 1, 2, 4 and 8, each "
        "covering a defined subset of the transmitted bits. On arrival, the "
        "checks at positions 1 and 4 fail while those at 2 and 8 pass.\n\n"
        "What does this indicate?",
        [("Two bits are in error, at positions 1 and 4.", False),
         ("The parity bits themselves are corrupt and the data is sound.",
          False),
         ("A single bit at position 5 is in error and can be corrected.",
          True),
         ("The error is detected but its position cannot be determined.",
          False)],
        "The failing checks combine additively to give the position of the "
        "flipped bit: 1 + 4 = 5. That is the whole design of a Hamming code "
        "-- each data bit is covered by a unique combination of parity bits, "
        "so the pattern of failures names the culprit and it can simply be "
        "flipped back. The failing checks are not themselves the error "
        "positions, and the position is entirely determinable, which is what "
        "distinguishes forward correction from mere detection."),

    mcq("AVERAGE",
        "During bulk file transfer over a short, reliable local link, an "
        "engineer must choose between forward error correction and "
        "retransmission.\n\n"
        "Which favours retransmission, and why?",
        [("Forward correction, because it avoids consuming bandwidth on "
          "redundancy", False),
         ("Retransmission, because the round trip is short and errors are "
          "rare", True),
         ("Retransmission, because it detects a wider class of errors", False),
         ("Forward correction, because local links have no return channel",
          False)],
        "ARQ pays one round trip per detected error and nothing otherwise, so "
        "on a short link where errors are rare its expected cost is very "
        "low -- while forward correction pays its redundancy on every frame "
        "whether or not anything went wrong. The reasoning inverts on a "
        "high-latency or unidirectional link. Forward correction is the "
        "scheme that consumes bandwidth continuously, and a local link "
        "certainly has a return channel."),
]

LESSON_COMMUNICATIONS = lesson(
    MAJOR, MIDDLE,
    "Theory of Communications: Transmission, Modulation and Error Control",
    _comms_quiz,
    lesson_structure(
        "Theory of Communications: Transmission, Modulation and Error Control",
        "This lesson follows a pattern of bits from one machine to another "
        "across a physical medium that distorts and corrupts it. It covers "
        "how data is impressed onto a signal by varying its amplitude, "
        "frequency or phase; how one medium is shared between several "
        "conversations by dividing time, frequency or wavelength; how the two "
        "ends stay in step; and how corruption is detected by parity, "
        "checksum and CRC, and repaired either by sending enough redundancy "
        "to fix it or by asking for it again. Nearly all of it reappears in "
        "the Network category as the physical and data link layers.",
        [
            "Distinguish baud rate from bit rate and compute one from the "
            "other",
            "Compare amplitude, frequency and phase modulation on noise "
            "resistance and bandwidth",
            "Explain how bandwidth and signal-to-noise ratio together bound "
            "channel capacity",
            "Select the appropriate multiplexing method for a described "
            "situation",
            "Compare synchronous with asynchronous transmission and compute "
            "framing overhead",
            "Distinguish simplex, half duplex and full duplex",
            "Compare parity, checksum and CRC on what each detects and misses",
            "Choose between forward error correction and ARQ from the "
            "properties of a link",
        ],
        65,
        _comms_sections,
        [
            ("Bandwidth",
             "The range of frequencies a medium will carry. It is the "
             "fundamental limit on signalling speed, and widening it raises "
             "the capacity ceiling."),
            ("Baud rate",
             "Signal changes, or symbols, per second. Equal to the bit rate "
             "only when each symbol carries exactly one bit."),
            ("Bit rate",
             "Bits per second: the baud rate multiplied by the number of bits "
             "each symbol carries."),
            ("Signal-to-noise ratio",
             "The strength of the signal relative to the noise. It bounds how "
             "many distinct signal states a receiver can tell apart, and "
             "therefore how many bits a symbol can carry."),
            ("Modulation",
             "Impressing data onto a carrier wave by varying its amplitude, "
             "frequency or phase -- the only three properties a sine wave "
             "has."),
            ("Amplitude shift keying",
             "Modulation by varying the wave's height. Simplest to build and "
             "most vulnerable to noise, since noise is itself amplitude."),
            ("Frequency shift keying",
             "Modulation by varying the oscillation rate. Resistant to "
             "amplitude noise at the cost of more bandwidth."),
            ("Phase shift keying",
             "Modulation by varying the wave's timing offset. Efficient and "
             "robust; combined with amplitude variation it becomes QAM."),
            ("QAM",
             "Quadrature amplitude modulation: varying amplitude and phase "
             "together to carry several bits per symbol. Needs a good "
             "signal-to-noise ratio to work."),
            ("Time division multiplexing",
             "Sharing a medium by giving each stream the whole channel during "
             "its own repeating time slot. Statistical TDM allocates slots on "
             "demand instead, so idle streams waste nothing."),
            ("Frequency division multiplexing",
             "Sharing a medium by giving each stream its own carrier "
             "frequency, with guard bands between them to prevent "
             "interference."),
            ("Wavelength division multiplexing",
             "The optical form of frequency division: several wavelengths of "
             "light share one fibre, which is how long-haul capacity grows "
             "without new cable."),
            ("Asynchronous transmission",
             "Framing each character individually with start and stop bits, "
             "so the receiver resynchronises constantly. Simple and about "
             "20% wasteful."),
            ("Synchronous transmission",
             "Framing a whole block against a shared clock, with framing only "
             "at block boundaries. Efficient for bulk transfer and dependent "
             "on maintained clock agreement."),
            ("Simplex, half duplex, full duplex",
             "One direction only; both directions alternately; both "
             "directions at once. Full duplex needs separate paths or "
             "frequencies and is the default on switched Ethernet."),
            ("Parity bit",
             "A single bit making the count of ones even or odd. Detects any "
             "odd number of errors and is blind to any even number, so it "
             "cannot be relied on alone."),
            ("Cyclic redundancy check",
             "A remainder from dividing the frame by a generator polynomial. "
             "Strong against burst errors and cheap in hardware, which is why "
             "Ethernet frames carry one. It detects but never corrects."),
            ("Hamming code",
             "A forward error-correcting code whose parity bits sit at "
             "power-of-two positions. The failing checks sum to the position "
             "of the flipped bit, so a single-bit error is located and "
             "repaired."),
            ("ARQ",
             "Automatic repeat request: the receiver detects an error and "
             "asks for a retransmission. Cheap in bandwidth, expensive in "
             "latency, and unusable where the round trip is very long."),
        ],
        "Getting bits across a physical medium means solving four problems, "
        "and each has its own mechanism. Data is impressed on a carrier by "
        "varying its amplitude, frequency or phase -- amplitude being the "
        "most vulnerable because noise is amplitude, phase being the basis of "
        "modern links, and QAM combining two of them to carry several bits "
        "per symbol. That is why bit rate and baud rate differ, and why a "
        "noisy line negotiates down to fewer bits per symbol rather than "
        "failing: more states packed together need a better signal-to-noise "
        "ratio to separate. One medium is shared by dividing time, frequency "
        "or, in fibre, wavelength. The ends stay in step either "
        "asynchronously, framing every character at about 20% overhead, or "
        "synchronously, framing a whole block against a shared clock. And "
        "corruption is handled in two stages: detection by parity, which "
        "misses any even number of flips, by a checksum, which misses "
        "reordering, or by a CRC, which catches the burst errors real "
        "interference produces; then repair, either by forward error "
        "correction that sends enough redundancy to locate and fix the fault, "
        "or by ARQ that simply asks again. Forward correction wins wherever a "
        "round trip is expensive; ARQ wins on short reliable links, which is "
        "why TCP uses it.",
        exam_notes=[
            desc(
                "Communications theory is examined on Subject A as short "
                "calculations and as matching a mechanism to a described "
                "situation."
            ),
            ul([
                "Converting between baud rate and bit rate given bits per "
                "symbol.",
                "Computing framing overhead for asynchronous transmission.",
                "Identifying the modulation family from a described property.",
                "Choosing a multiplexing method for a stated medium.",
                "Stating what a parity bit fails to detect.",
                "Choosing between forward correction and ARQ from link "
                "characteristics.",
                "Distinguishing simplex, half duplex and full duplex.",
            ]),
            desc(
                "The recurring trap is treating baud and bit rate as "
                "interchangeable. Read carefully for the phrase 'bits per "
                "symbol' or 'signal changes per second', which is the "
                "examiner telling you which one is meant."
            ),
        ],
    ))

# ==========================================================================
# Lesson 5: Theory of Measurement and Control
# ==========================================================================

_control_sections = [
    ("Computers That Touch the Physical World", [
        desc(
            "Most software reads from a database and writes to a screen. "
            "Control software reads from a sensor and writes to a motor, and "
            "that change of endpoints changes almost everything about how it "
            "must be built. A late database query returns late results; a "
            "late control decision can wreck the machine it controls."
        ),
        desc(
            "This minor category is small in the syllabus and large in "
            "practice: it underlies the embedded systems, industrial devices "
            "and IoT material later in the certification, and it is where the "
            "A/D conversion of the information lesson becomes an actual "
            "engineering constraint rather than a definition."
        ),
        image(fig("sensor-actuator")),
        desc(
            "The chain is always the same. A SENSOR converts a physical "
            "quantity into an electrical signal. An A/D converter turns that "
            "signal into a number. The controller computes a response. A D/A "
            "converter turns that number back into a signal. An ACTUATOR "
            "converts the signal into physical action. Everything the "
            "computer does happens in the middle, on numbers that are already "
            "approximations."
        ),
    ]),

    ("Sensors and Actuators", [
        desc(
            "The two ends of the chain are mirror images: one converts the "
            "world into signals, the other converts signals into the world."
        ),
        compare_grid(
            "THE TWO TRANSDUCERS",
            "A transducer is anything converting energy from one form to "
            "another; sensors and actuators are the input and output cases.",
            [("Sensors -- world to signal",
              "Temperature by thermocouple or thermistor, pressure by strain "
              "gauge, position by encoder, light by photodiode, acceleration "
              "and rotation by MEMS accelerometer and gyroscope, presence by "
              "infrared or ultrasonic detector."),
             ("Actuators -- signal to world",
              "Motors for rotation, servos and stepper motors for controlled "
              "position, solenoids and relays for switching, valves for flow, "
              "heaters for temperature, and displays and indicators for "
              "reporting to a person.")]),
        desc(
            "Every sensor has characteristics an examination item may name. "
            "RANGE is the span of values it can measure. RESOLUTION is the "
            "smallest change it can distinguish. ACCURACY is how close its "
            "reading is to the true value, and PRECISION is how repeatable "
            "that reading is -- a distinction worth holding, since a sensor "
            "can be precisely wrong, returning the same incorrect value every "
            "time. RESPONSE TIME is how quickly it reflects a change, and it "
            "sets an upper bound on how fast the loop above it can usefully "
            "run."
        ),
    ]),

    ("Feedback Control", [
        desc(
            "Feedback control is a loop: measure the output, compare it to "
            "the target, and act to reduce the difference. It is the "
            "structure of a thermostat, a cruise control, an autoscaler and a "
            "flow-control window, and it is worth recognising because the "
            "same failure modes appear in all of them."
        ),
        image(fig("control-loop")),
        desc(
            "The target value is the SETPOINT. The difference between the "
            "setpoint and the measured value is the ERROR. The controller's "
            "whole job is to drive the error towards zero, and how "
            "aggressively it does so is the central design decision."
        ),
        content_accordion(
            "WHAT GOES WRONG IN A FEEDBACK LOOP",
            "These failure modes are general. They appear in mechanical "
            "controllers, in autoscalers and in retry policies alike.",
            [("Oscillation",
              "The controller responds too aggressively, overshoots the "
              "setpoint, corrects hard in the other direction and overshoots "
              "again. A heater that swings between too hot and too cold; an "
              "autoscaler that adds ten instances then removes them a minute "
              "later."),
             ("Sluggishness",
              "The controller responds too weakly and the error persists. "
              "Safe but ineffective -- the system never reaches its setpoint, "
              "or takes so long that the disturbance has changed by the time "
              "it arrives."),
             ("Lag and instability",
              "Delay between acting and observing the effect. If the "
              "controller acts again before the previous action has shown up "
              "in the measurement, it is effectively correcting for an error "
              "it has already fixed -- which drives oscillation even when the "
              "gain is otherwise reasonable. This is why an autoscaler needs "
              "a cool-down period."),
             ("Hysteresis and dead band",
              "A deliberate zone around the setpoint in which no action is "
              "taken, so that small fluctuations do not cause constant "
              "switching. It trades a little accuracy for a great deal of "
              "stability, and it is why a thermostat has a tolerance rather "
              "than a single temperature.")]),
    ]),

    ("Feedforward Control", [
        desc(
            "Feedback can only react to an error that already exists. "
            "Feedforward control measures the DISTURBANCE instead of the "
            "output, predicts its effect from a model, and compensates before "
            "the error appears."
        ),
        image(fig("control-comparison")),
        desc(
            "A building's heating that increases output when the outside "
            "temperature drops, without waiting for the indoor temperature to "
            "fall, is feedforward. A service that pre-scales for a scheduled "
            "marketing campaign rather than waiting for the load to arrive is "
            "doing the same thing."
        ),
        desc(
            "The trade is clear. Feedforward is fast, because it does not "
            "wait for an error, but it is only as good as its model -- and it "
            "is blind to any disturbance it does not measure. Feedback is "
            "slower but corrects everything, including what nobody "
            "anticipated. Real systems combine them: feedforward handles the "
            "predictable bulk of the response, and feedback cleans up "
            "whatever the model got wrong."
        ),
    ]),

    ("Sequence and Real-Time Control", [
        desc(
            "Not all control is continuous. SEQUENCE CONTROL executes a fixed "
            "series of steps, each triggered by the completion of the last or "
            "by a condition becoming true -- a washing machine cycle, a "
            "production line, a startup sequence. It is naturally expressed "
            "as a state machine, which is the automaton from the previous "
            "lesson doing industrial work."
        ),
        desc(
            "REAL-TIME control adds a timing requirement to correctness. A "
            "real-time system is one where a correct answer delivered late is "
            "a wrong answer, and the syllabus distinguishes two strengths of "
            "that requirement."
        ),
        content_tabs(
            "HARD AND SOFT REAL-TIME",
            "The difference is what happens when a deadline is missed, and it "
            "determines what the system may be built from.",
            [("Hard real-time", "A missed deadline is a system failure",
              "Anti-lock braking, engine ignition timing, flight control, "
              "medical infusion. The deadline is part of the specification, "
              "so the system must be provably able to meet it in the worst "
              "case -- which rules out unpredictable delays such as "
              "general-purpose garbage collection, virtual memory paging and "
              "best-effort networking."),
             ("Soft real-time", "A missed deadline degrades quality",
              "Video playback, audio streaming, a responsive user interface. "
              "A late frame is dropped and the user notices a glitch, but "
              "nothing is destroyed. This tolerance is what lets soft "
              "real-time systems run on ordinary operating systems."),
             ("Why the distinction decides the design", "Worst case, not average",
              "A hard real-time system is designed around its WORST case, "
              "not its average -- an average latency of 1ms with an "
              "occasional 200ms pause fails a 10ms deadline every time that "
              "pause occurs. This is the single most common mistake in "
              "real-time work, and it is why measuring the mean tells you "
              "almost nothing about whether a deadline will hold.")]),
    ]),

    ("Where a Control Loop Loses Accuracy", [
        desc(
            "Every stage of the chain contributes error, and they accumulate. "
            "Knowing which stage dominates is what tells you where spending "
            "money will help."
        ),
        table(
            ["Stage", "Error it contributes", "How it is reduced"],
            [["Sensor", "Offset, drift, non-linearity",
              "Calibration, and a better-grade sensor"],
             ["A/D conversion", "Quantisation error",
              "More bits of depth"],
             ["Sampling", "Changes missed between samples",
              "A faster sampling rate"],
             ["Computation", "Rounding in fixed-point arithmetic",
              "Wider arithmetic, or careful scaling"],
             ["Actuator", "Backlash, hysteresis, finite resolution",
              "Better mechanics, or position feedback"]],
            caption="The error budget of a control loop, stage by stage.",
            footer="Improving a stage that is not the dominant contributor "
                   "changes nothing measurable, which is why the budget is "
                   "worth writing down before anything is bought."),
        desc(
            "The habit this encourages is the useful one: quantify before "
            "improving. A loop whose sensor drifts by two degrees gains "
            "nothing at all from a converter upgrade that reduces "
            "quantisation error by a hundredth of a degree, and the money "
            "would have been better spent on calibration."
        ),
    ]),

    ("Control in Software Systems", [
        desc(
            "The vocabulary of this lesson describes software infrastructure "
            "as accurately as it describes machinery, and recognising that is "
            "worth more than the examination marks it carries."
        ),
        table(
            ["Control concept", "Its software equivalent"],
            [["Setpoint", "A target latency, queue depth or replica count"],
             ["Sensor", "A metric: CPU use, request rate, queue length"],
             ["Actuator", "Adding or removing instances, shedding load"],
             ["Loop lag", "Instance start-up time before capacity arrives"],
             ["Dead band", "A scaling threshold with hysteresis between the "
                           "scale-up and scale-down points"],
             ["Oscillation", "Thrashing: scaling up and down repeatedly"],
             ["Feedforward", "Pre-scaling for a scheduled traffic event"]],
            caption="An autoscaler is a feedback controller, and it fails in "
                    "the ways feedback controllers fail.",
            footer="This is why a cool-down period exists, why scale-up and "
                   "scale-down thresholds differ, and why an autoscaler tuned "
                   "purely on average load thrashes under spiky traffic."),
        desc(
            "The same reading applies to TCP congestion control, to retry "
            "policies with backoff, and to circuit breakers. Each measures an "
            "output, compares it to a target and adjusts, and each has to "
            "solve gain and lag to avoid oscillating -- which is exactly why "
            "exponential backoff and jitter exist."
        ),
    ]),

    ("Open-Loop Control", [
        desc(
            "Before feedback there is the option of no feedback at all. An "
            "open-loop controller applies a predetermined action and never "
            "checks the result: a microwave runs for the time you set, a "
            "traffic light follows a fixed cycle, a sprinkler runs for twenty "
            "minutes whether or not it is raining."
        ),
        compare_grid(
            "WHEN NO FEEDBACK IS THE RIGHT ANSWER",
            "Open loop is not a primitive version of closed loop. It is the "
            "correct choice under specific conditions, and the wrong one "
            "outside them.",
            [("Open loop suits",
              "A predictable process, a disturbance that does not vary, no "
              "practical way to measure the output, or a consequence of being "
              "wrong that is too small to justify a sensor."),
             ("Open loop fails when",
              "The load varies, the environment changes, or components drift "
              "with age -- because nothing in the design will ever notice, "
              "and the error simply persists.")]),
        desc(
            "The distinction is examined as a classification question: given "
            "a described system, is there a measurement of the OUTPUT feeding "
            "back into the decision? If not, it is open loop, however "
            "sophisticated the rest of it is. A timer is not feedback."
        ),
    ]),

    ("Proportional, Integral and Derivative Control", [
        desc(
            "Having computed an error, how hard should the controller push? "
            "PID answers this by combining three terms, each responding to a "
            "different aspect of the error, and it is by far the most widely "
            "deployed control algorithm in existence."
        ),
        table(
            ["Term", "Responds to", "What it fixes", "What it costs"],
            [["Proportional (P)", "The error right now",
              "Provides the bulk of the response",
              "Alone, it leaves a persistent residual error"],
             ["Integral (I)", "The accumulated error over time",
              "Eliminates the residual error P leaves",
              "Can wind up and overshoot badly after a long error"],
             ["Derivative (D)", "The rate at which the error is changing",
              "Damps the response and reduces overshoot",
              "Amplifies measurement noise"]],
            caption="The three terms of a PID controller.",
            footer="Tuning is choosing the weight of each term. Too much P "
                   "oscillates, too much I overshoots after a sustained "
                   "error, and too much D makes the controller twitch at "
                   "every noisy reading."),
        desc(
            "The intuition is worth carrying even outside control "
            "engineering, because the same three signals appear in "
            "autoscaling and in rate limiting. Proportional asks how far off "
            "we are now; integral asks how long we have been off, which is "
            "what catches a small persistent shortfall; derivative asks "
            "whether things are already improving, which is what stops the "
            "controller piling on more correction into a situation that is "
            "recovering by itself."
        ),
    ]),

    ("Sampling Inside a Control Loop", [
        desc(
            "A digital controller does not observe continuously. It samples, "
            "computes and acts on a cycle, and the choice of cycle time is "
            "bounded on both sides."
        ),
        ul([
            "Too SLOW and the loop cannot react to changes that matter. The "
            "sampling theorem applies here as much as it does to audio: "
            "sampling below twice the rate of the fastest change means the "
            "controller is blind to it, and may be misled by aliasing into "
            "seeing a slow drift that is not there.",
            "Too FAST and each cycle sees almost no change, so the derivative "
            "term is computed from a difference dominated by measurement "
            "noise, and the actuator is commanded to move constantly for no "
            "benefit and considerable wear.",
            "The sensible band is set by the process itself -- fast enough to "
            "catch the quickest disturbance the system must reject, slow "
            "enough that each sample carries real information.",
        ]),
        desc(
            "The actuator imposes its own limit from the other side. "
            "Commanding a valve to a new position every ten milliseconds when "
            "it takes two seconds to travel achieves nothing except a queue "
            "of stale commands, and it is a common way to make a control "
            "system worse by making its loop faster."
        ),
    ]),

    ("Reliability and Fail-Safe Design", [
        desc(
            "A control system acts on the physical world, so its failure "
            "modes have physical consequences. What it does when a component "
            "fails is a design decision that must be made deliberately rather "
            "than discovered."
        ),
        content_accordion(
            "DESIGNING FOR FAILURE",
            "The syllabus's terms, each answering a different question about "
            "what happens when something breaks.",
            [("Fail-safe",
              "On failure, the system moves to a state that is safe even "
              "though it may not be useful. A railway signal that fails to "
              "red, a brake that engages when its control power is lost. The "
              "safe state is chosen for consequence, not for convenience."),
             ("Fail-soft (graceful degradation)",
              "On failure, the system keeps operating with reduced function "
              "rather than stopping. A production line dropping to manual "
              "control, an aircraft losing an autopilot mode but staying "
              "flyable."),
             ("Fool-proof",
              "The design prevents incorrect operation from causing harm in "
              "the first place -- an interlock that will not let a machine "
              "start with its guard open, a connector that only fits one way "
              "round. It anticipates the operator's mistake rather than "
              "blaming it."),
             ("Fault tolerance",
              "Redundant components let the system continue correctly through "
              "a failure, with no degradation at all. The most expensive "
              "answer, and the only acceptable one where neither stopping nor "
              "degrading is tolerable.")]),
        desc(
            "These four are examined as a matching exercise, and the "
            "discriminating question is what the system DOES on failure: "
            "moves to a safe state, continues with less, prevents the error "
            "arising, or continues unaffected."
        ),
    ]),

    ("Embedded and Real-Time Systems", [
        desc(
            "Control software usually runs on an embedded system -- a "
            "computer built into the equipment it controls rather than "
            "presented as a computer. That setting imposes constraints that "
            "shape everything about how it is written."
        ),
        table(
            ["Constraint", "Consequence for the software"],
            [["Limited memory and processing",
              "Fixed allocation, no large runtimes, careful data structures"],
             ["No operator present",
              "It must recover from faults unaided; there is nobody to "
              "restart it"],
             ["Timing requirements",
              "Worst-case execution time matters more than average speed"],
             ["Long deployed life",
              "Updates are difficult or impossible, so correctness must be "
              "established before shipping"],
             ["Physical consequences",
              "A defect can damage equipment or injure someone, which raises "
              "the standard of verification"]],
            caption="Why embedded software is written differently.",
            footer="A real-time operating system exists to make timing "
                   "predictable: priority-based pre-emptive scheduling, "
                   "bounded interrupt latency, and no unpredictable pauses "
                   "for memory management."),
        desc(
            "The single idea connecting all of it is determinism. A "
            "general-purpose operating system optimises for average "
            "throughput and is happy to pause occasionally to do so; a "
            "real-time one accepts lower average throughput in exchange for a "
            "worst case it can state. That is the whole trade, and it follows "
            "directly from a deadline being part of correctness."
        ),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "\"A temperature controller holds a setpoint of 80 degrees. When "
            "the load increases, the temperature settles at 76 degrees and "
            "remains there indefinitely, with no oscillation. Which control "
            "term is missing or too weak?\""
        ),
        ol([
            "Characterise the symptom. The value is stable but wrong: a "
            "persistent error that neither grows nor decays.",
            "Rule out an oscillation problem. There is no swinging, so "
            "excessive proportional gain and derivative damping are not the "
            "question.",
            "Recall what each term responds to. Proportional responds to the "
            "current error, so with a fixed gain it always leaves SOME error "
            "-- the output is proportional to the error, so zero error would "
            "mean zero output.",
            "Identify the term that acts on a persistent error: integral, "
            "which accumulates the error over time and keeps increasing its "
            "contribution until the error is gone.",
            "Answer: the integral term is missing or set too low.",
        ]),
        desc(
            "The reasoning generalises, and that is why the item is worth "
            "working. A steady offset points to the integral term; an "
            "oscillation points to too much proportional gain or too little "
            "derivative damping; and a sluggish response points to too little "
            "gain overall. Match the symptom to the term."
        ),
    ]),

    ("Common Mistakes", [
        desc("The errors that recur in control questions."),
        ul([
            "Confusing accuracy with precision. A sensor can be precisely "
            "wrong, returning the same incorrect reading every time.",
            "Treating feedforward as a better feedback. It is blind to any "
            "disturbance it does not measure.",
            "Ignoring loop lag. Acting again before the last action has shown "
            "up in the measurement causes oscillation at any gain.",
            "Judging a hard real-time system by average latency. Only the "
            "worst case matters.",
            "Sampling a control loop more slowly than the sensor's response "
            "time warrants, or faster than the actuator can act.",
            "Omitting a dead band, so tiny fluctuations cause constant "
            "switching and wear the actuator out.",
        ]),
    ]),

    ("Recall Check", [
        desc("Answer each before turning it over."),
        review_cards(
            "TEST YOURSELF",
            "Four distinctions this lesson exists to establish.",
            [("Accuracy versus precision",
              "Close to true, versus repeatable",
              "A sensor reading the same wrong value every time is precise "
              "and inaccurate. Calibration fixes accuracy; better hardware "
              "fixes precision."),
             ("Feedback versus feedforward",
              "Reacts to error, versus anticipates disturbance",
              "Feedback corrects anything but only after the fact. "
              "Feedforward is fast but only as good as its model. Real "
              "systems use both."),
             ("Hard versus soft real-time",
              "Missed deadline fails, versus degrades",
              "Braking is hard; video playback is soft. Hard real-time is "
              "designed around the worst case, never the average."),
             ("Why a thermostat has a dead band",
              "To stop constant switching",
              "A zone around the setpoint where no action is taken trades a "
              "little accuracy for stability and actuator life.")]),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc("A small category with a long reach."),
        ul([
            "A/D and D/A conversion come directly from the Theory of "
            "Information lesson.",
            "Sequence control is the automaton of that lesson, and the state "
            "machine diagram of Software Design.",
            "Real-time constraints return in Operating Systems as scheduling "
            "and in Hardware as embedded design.",
            "Sensors and actuators return in Industrial Devices, IoT and "
            "Consumer Appliances.",
            "The feedback loop itself is the shape of service management's "
            "monitoring and of the PDCA cycle in project management.",
        ]),
    ]),
]

_control_quiz = [
    mcq("EASY",
        "In a control system, one component converts a physical quantity "
        "such as temperature into an electrical signal the computer can "
        "read.\n\n"
        "What is this device called?",
        [("An actuator", False),
         ("A sensor", True),
         ("A controller", False),
         ("A setpoint", False)],
        "A sensor converts a physical quantity into a signal, forming the "
        "input end of a control system. An actuator runs the other way, "
        "converting a signal into physical action. The controller is the "
        "computation between them, and a setpoint is the target value rather "
        "than any device at all."),

    mcq("AVERAGE",
        "Every reading taken from a temperature sensor is 23.7 degrees, "
        "while a calibrated reference shows the true temperature is 21.0 "
        "degrees.\n\n"
        "How should this sensor be described?",
        [("Accurate but not precise", False),
         ("Neither accurate nor precise", False),
         ("Precise but not accurate", True),
         ("Both accurate and precise", False)],
        "Precision is repeatability and accuracy is closeness to the true "
        "value. Returning the identical reading every time is excellent "
        "precision; being 2.7 degrees off is poor accuracy. This combination "
        "is the most tractable kind of sensor fault, because a consistent "
        "offset can be calibrated out in software, whereas a sensor that is "
        "imprecise gives a different error each reading and cannot be "
        "corrected the same way."),

    mcq("AVERAGE",
        "A building's heating system increases output as soon as the outdoor "
        "temperature falls, without waiting for the indoor temperature to "
        "drop.\n\n"
        "Which control strategy is this?",
        [("Feedback control, since temperature is being measured", False),
         ("Sequence control, since the steps follow in order", False),
         ("Hysteresis, since a tolerance band is applied", False),
         ("Feedforward control, since it acts on the disturbance", True)],
        "Feedforward measures the DISTURBANCE -- here the outdoor temperature "
        "-- and compensates before any error appears in the controlled "
        "variable. Feedback would wait for the indoor temperature to fall "
        "below the setpoint and then react. Sequence control executes fixed "
        "ordered steps, and hysteresis is a dead band around a setpoint, "
        "neither of which is what this system is doing."),

    mcq("HARD",
        "An autoscaler adds capacity whenever load exceeds a threshold, but "
        "new instances take three minutes to become useful. The scaler "
        "re-evaluates every thirty seconds.\n\n"
        "What behaviour should be expected?",
        [("Capacity will be added too slowly to meet the load.", False),
         ("Repeated over-provisioning, because the scaler acts before "
          "earlier actions take effect.", True),
         ("The scaler will stabilise once the first instances start.", False),
         ("Nothing unusual, since the evaluation interval is shorter than "
          "the startup time.", False)],
        "This is loop lag. During the three minutes an instance takes to "
        "start, the scaler evaluates five more times, still sees high load, "
        "and adds capacity again each time -- correcting for an error it has "
        "already acted on. The result is a large over-provision followed by "
        "an aggressive scale-down, and then often the cycle repeats. The "
        "standard remedy is a cool-down period at least as long as the "
        "startup time, so each action is observed before the next is taken."),

    mcq("EASY",
        "In an anti-lock braking system, a control decision arriving after "
        "its deadline is treated as a system failure rather than a "
        "degradation.\n\n"
        "How is such a system classified?",
        [("Soft real-time", False),
         ("Sequence controlled", False),
         ("Hard real-time", True),
         ("Feedforward controlled", False)],
        "A hard real-time system is one where a missed deadline constitutes "
        "failure, so the deadline is part of the specification and the design "
        "must guarantee it in the worst case. Soft real-time systems, such as "
        "video playback, merely degrade when a deadline slips. Sequence "
        "control and feedforward describe how control decisions are made, not "
        "how their timing requirements are classified."),

    mcq("HARD",
        "A control task shows an average response time of 1ms, but "
        "occasionally pauses for 200ms when the runtime reclaims memory. The "
        "deadline is 10ms.\n\n"
        "Is this suitable for a hard real-time application?",
        [("Yes, because the average is far inside the deadline.", False),
         ("Yes, provided the pauses occur less than 1% of the time.", False),
         ("Only if the deadline is relaxed to 200ms.", False),
         ("No, because a hard deadline must hold in the worst case.", True)],
        "A hard real-time guarantee is about the worst case, not the average "
        "or a percentile: every occurrence of the 200ms pause is a failure, "
        "regardless of how rare it is. Averages are irrelevant to a hard "
        "deadline, and this is precisely why hard real-time systems avoid "
        "unpredictable mechanisms such as general-purpose garbage collection "
        "and demand paging. Relaxing the deadline to 200ms would change the "
        "application's requirement rather than solve its problem."),

    mcq("AVERAGE",
        "Set to 20 degrees, a thermostat takes no action until the "
        "temperature falls below 19 or rises above 21.\n\n"
        "What is the purpose of this band?",
        [("To improve measurement accuracy near the setpoint", False),
         ("To prevent constant switching from small fluctuations", True),
         ("To compensate for the sensor's response time", False),
         ("To allow feedforward control to operate", False)],
        "A dead band, or hysteresis, deliberately ignores small deviations so "
        "the heater does not switch on and off continuously as the "
        "temperature wanders by a fraction of a degree. It trades a little "
        "accuracy for a great deal of stability and considerable actuator "
        "life. It does not improve the sensor's accuracy, and it is a "
        "feedback refinement rather than anything to do with feedforward."),

    mcq("AVERAGE",
        "Inside a washing machine, a fixed series of stages runs in order, "
        "each beginning when the previous one completes or a condition "
        "becomes true.\n\n"
        "Which form of control is this, and how is it best modelled?",
        [("Feedback control, modelled as a control loop", False),
         ("Sequence control, modelled as a state machine", True),
         ("Real-time control, modelled as a scheduling problem", False),
         ("Feedforward control, modelled as a predictive equation", False)],
        "Sequence control executes ordered steps triggered by completion or "
        "by a condition, which maps exactly onto a state machine: states are "
        "the stages, and transitions are the triggering conditions. That is "
        "the finite automaton of the information theory lesson applied to "
        "industrial control. Feedback would continuously correct a measured "
        "error against a setpoint, which is not what a fixed cycle does."),

    mcq("AVERAGE",
        "Which characteristic of a sensor describes the smallest change in "
        "the measured quantity that it can distinguish?",
        [("Range", False),
         ("Accuracy", False),
         ("Resolution", True),
         ("Response time", False)],
        "Resolution is the finest distinguishable change, and it is set by "
        "the sensor and by the bit depth of the A/D conversion after it. "
        "Range is the span between the smallest and largest measurable "
        "values, accuracy is closeness to the true value, and response time "
        "is how quickly the reading reflects a change -- which separately "
        "bounds how fast a control loop above the sensor can usefully run."),

    mcq("HARD",
        "Despite a correctly implemented controller, a control loop begins "
        "oscillating: the controlled value swings above and below the "
        "setpoint with growing amplitude.\n\n"
        "Which explanation fits best?",
        [("The sensor's range is too narrow for the setpoint.", False),
         ("The system is responding too aggressively relative to its own "
          "delay.", True),
         ("The setpoint has been configured above the actuator's maximum "
          "output.", False),
         ("Feedforward compensation is missing from the design.", False)],
        "Oscillation of growing amplitude is the signature of excessive gain "
        "combined with lag: the controller overshoots, and because it acts "
        "again before the previous correction has appeared in the "
        "measurement, it is effectively correcting an error it has already "
        "addressed. Reducing the gain, adding a dead band, or waiting for the "
        "effect before acting again are the remedies. A setpoint beyond the "
        "actuator's range would produce a steady unreached target rather "
        "than a swing, and missing feedforward slows response without "
        "destabilising it."),
]

LESSON_CONTROL = lesson(
    MAJOR, MIDDLE,
    "Theory of Measurement and Control Systems",
    _control_quiz,
    lesson_structure(
        "Theory of Measurement and Control Systems",
        "This lesson is about software whose inputs are sensors and whose "
        "outputs are motors, valves and heaters. It follows the chain from a "
        "physical quantity through conversion, computation and back out to "
        "physical action; sets out the characteristics that describe a "
        "sensor; contrasts feedback control, which corrects errors after they "
        "appear, with feedforward control, which anticipates them; and "
        "explains why a hard real-time deadline is a statement about the "
        "worst case rather than the average. The failure modes here -- "
        "oscillation, lag, and the need for a dead band -- turn up in "
        "autoscalers and retry policies as readily as in thermostats.",
        [
            "Trace the sensor, converter, controller and actuator chain of a "
            "control system",
            "Distinguish accuracy, precision, resolution, range and response "
            "time for a sensor",
            "Explain feedback control in terms of setpoint and error, and "
            "diagnose oscillation, sluggishness and lag",
            "Contrast feedforward with feedback control and say when each is "
            "appropriate",
            "Explain the purpose of hysteresis and a dead band",
            "Distinguish sequence control from continuous control and model "
            "it as a state machine",
            "Distinguish hard from soft real-time and explain why hard "
            "deadlines are judged on the worst case",
        ],
        55,
        _control_sections,
        [
            ("Transducer",
             "Any device converting energy from one form to another. A sensor "
             "is the input case and an actuator the output case."),
            ("Sensor",
             "A device converting a physical quantity into an electrical "
             "signal -- thermocouple, strain gauge, encoder, photodiode, "
             "accelerometer."),
            ("Actuator",
             "A device converting a signal into physical action -- motor, "
             "servo, stepper, solenoid, relay, valve, heater."),
            ("Accuracy",
             "How close a reading is to the true value. Fixed by "
             "calibration when the error is a consistent offset."),
            ("Precision",
             "How repeatable a reading is. A sensor can be precise and "
             "inaccurate, returning the same wrong value every time."),
            ("Resolution",
             "The smallest change in the measured quantity that a sensor can "
             "distinguish, bounded also by the bit depth of the A/D "
             "conversion after it."),
            ("Response time",
             "How quickly a sensor's reading reflects a change. It sets an "
             "upper bound on how fast the control loop above it can usefully "
             "run."),
            ("Setpoint",
             "The target value a control system is trying to hold."),
            ("Error",
             "The difference between the setpoint and the measured value. "
             "Driving it to zero is the controller's entire job."),
            ("Feedback control",
             "Measuring the output, comparing it to the setpoint and acting "
             "to reduce the error. Corrects any disturbance, but only after "
             "it has already had an effect."),
            ("Feedforward control",
             "Measuring the disturbance, predicting its effect from a model "
             "and compensating before an error appears. Fast, and blind to "
             "anything it does not measure."),
            ("Hysteresis (dead band)",
             "A zone around the setpoint in which no action is taken, so "
             "small fluctuations do not cause constant switching. Trades "
             "accuracy for stability and actuator life."),
            ("Loop lag",
             "Delay between acting and observing the effect. Acting again "
             "before the previous action shows up in the measurement drives "
             "oscillation, which is why an autoscaler needs a cool-down."),
            ("Sequence control",
             "Executing a fixed series of steps, each triggered by the "
             "previous one completing or by a condition holding. Naturally "
             "modelled as a state machine."),
            ("Hard real-time",
             "A system in which a missed deadline is a failure. Designed "
             "around the worst case, which rules out unpredictable delays "
             "such as garbage collection and demand paging."),
            ("Soft real-time",
             "A system in which a missed deadline degrades quality without "
             "causing failure -- a dropped video frame rather than a crash."),
        ],
        "Control software differs from ordinary software in its endpoints: it "
        "reads sensors and drives actuators, with A/D and D/A conversion at "
        "each boundary, so everything it computes is arithmetic on "
        "approximations of continuous quantities. A sensor is described by "
        "its range, resolution, response time and -- crucially separate -- "
        "its accuracy and precision, since a sensor can repeat the same wrong "
        "value perfectly. Feedback control measures the output, computes the "
        "error against a setpoint and acts to shrink it; its characteristic "
        "failures are oscillation from too much gain, sluggishness from too "
        "little, and instability from acting again before the last action has "
        "shown up in the measurement -- which is exactly why an autoscaler "
        "needs a cool-down and a thermostat needs a dead band. Feedforward "
        "measures the disturbance instead and compensates in advance, which "
        "is faster but only as good as its model and blind to anything "
        "unmeasured, so real systems combine the two. Sequence control "
        "executes ordered steps and is a state machine in industrial dress. "
        "And a real-time requirement is hard when a missed deadline is a "
        "failure and soft when it is merely a glitch -- a distinction that "
        "decides the whole design, because a hard deadline must hold in the "
        "worst case and an average latency tells you nothing about whether it "
        "will.",
        exam_notes=[
            desc(
                "This category contributes a small but reliable number of "
                "Subject A items, usually conceptual rather than numeric."
            ),
            ul([
                "Naming a component of the sensor-to-actuator chain.",
                "Distinguishing accuracy from precision for a described "
                "sensor.",
                "Identifying feedback or feedforward from a described "
                "behaviour.",
                "Explaining the purpose of a dead band or hysteresis.",
                "Classifying a system as hard or soft real-time from the "
                "consequence of a missed deadline.",
                "Diagnosing oscillation as excessive gain combined with lag.",
            ]),
            desc(
                "The most reliably examined idea here is that a hard "
                "real-time system is judged on its worst case. Any item "
                "quoting an average latency alongside an occasional long "
                "pause is testing exactly that."
            ),
        ],
    ))

LESSONS = [LESSON_INFORMATION, LESSON_COMMUNICATIONS, LESSON_CONTROL]
