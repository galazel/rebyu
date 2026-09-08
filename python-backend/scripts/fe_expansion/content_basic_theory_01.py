"""Basic Theory -> Basic Theory, lesson 1 of 5: Discrete mathematics.

Covers syllabus minor category 1 in full: radix and radix conversion, numeric
representation including complements and fractions, arithmetic operations and
their precision, sets and propositions, and logical operations.

This is the lesson the rest of the certification stands on. Subject A asks
radix conversion, shift arithmetic, overflow and De Morgan directly, and
Subject B cannot be traced at all by someone who is unsure what a bit pattern
means -- so the material is worked through here rather than summarised, and
every rule is shown being applied to a specific number rather than stated.

No calculator is permitted in the examination, which shapes the whole lesson:
every worked example is sized to be done on paper, because that is the size
the paper asks them at.
"""

from builders import (compare_grid, content_accordion, content_tabs, desc,
                      image, lesson, lesson_structure, mcq, media_text, ol,
                      review_cards, table, ul)
from figures import fig

MAJOR = "Basic Theory"
MIDDLE = "Basic Theory"

# ---------------------------------------------------------------- sections

_sections = [
    ("Why a Computer Counts in Twos", [
        desc(
            "A computer stores numbers in twos for a physical reason, not a "
            "mathematical one. The components it is built from -- a "
            "transistor, a capacitor, a magnetised region of a disk -- are "
            "reliable at telling two states apart and unreliable at telling "
            "ten apart. A circuit that must distinguish 'above 2 volts' from "
            "'below 0.8 volts' tolerates noise, ageing and temperature drift. "
            "A circuit that must distinguish ten voltage levels on the same "
            "wire fails the first time the supply sags."
        ),
        desc(
            "So the machine represents everything -- integers, fractions, "
            "text, colours, sound, machine instructions -- as patterns of two "
            "symbols. That single decision is the source of nearly every "
            "surprising behaviour in this lesson: why a program can add 1 to "
            "a positive number and get a negative one, why 0.1 + 0.2 does not "
            "equal 0.3, and why a value that is exact in a currency column is "
            "approximate in a floating-point one."
        ),
        compare_grid(
            "WHAT THE MACHINE ACTUALLY STORES",
            "None of these is a number. Each is a bit pattern plus an agreed "
            "rule for reading it, and reading a pattern by the wrong rule is "
            "how most of the surprises in this lesson happen.",
            [("An unsigned integer",
              "The pattern read as plain positional binary. 1111 1011 is "
              "251."),
             ("A signed integer",
              "The same pattern read as two's complement. 1111 1011 is -5."),
             ("A character",
              "The same pattern used as an index into a character code "
              "table."),
             ("A machine instruction",
              "The same pattern decoded as an opcode and its operands by the "
              "processor.")]),
        desc(
            "The examination does not ask you to admire this. It asks you to "
            "convert between bases without a calculator, to predict what a "
            "shift does to a signed value, to say which precision error a "
            "given calculation suffers from, and to simplify a logical "
            "expression. Every one of those is a mechanical skill, and this "
            "lesson builds them by doing them."
        ),
    ]),

    ("Positional Notation, Made Explicit", [
        desc(
            "A numeral is not a number. The characters 1101 are a numeral, "
            "and until you are told the base, they denote nothing in "
            "particular. In positional notation each place is worth the base "
            "times the place to its right, and the value of the numeral is "
            "the sum of each digit times its place value."
        ),
        table(
            ["Base", "Digits used", "Place values (right to left)",
             "What 1101 means"],
            [["Binary (2)", "0 1", "8 4 2 1", "8 + 4 + 0 + 1 = 13"],
             ["Octal (8)", "0-7", "512 64 8 1", "512 + 64 + 0 + 1 = 577"],
             ["Decimal (10)", "0-9", "1000 100 10 1",
              "1000 + 100 + 0 + 1 = 1101"],
             ["Hexadecimal (16)", "0-9 A-F", "4096 256 16 1",
              "4096 + 256 + 0 + 1 = 4353"]],
            caption="The same four characters, read in four bases.",
            footer="Each place is worth the base times the place to its "
                   "right, which is the whole of positional notation."),
        desc(
            "The base is also called the radix, and the two words are used "
            "interchangeably in the syllabus. A base-n number uses n distinct "
            "digits, from 0 up to n-1 -- which is why binary has no digit 2, "
            "octal has no digit 8, and hexadecimal has to borrow the letters "
            "A to F to reach sixteen symbols."
        ),
        desc(
            "Notation for the base varies. This lesson writes it as a "
            "subscript where it matters: 1101(2) is thirteen, 1101(10) is one "
            "thousand one hundred and one. In code you will meet 0b1101, "
            "0o15, 0x0D and plain 13 for exactly the same four notations."
        ),
    ]),

    ("Binary, Octal and Hexadecimal in Practice", [
        desc(
            "Three bases matter in practice, and each is used where it is "
            "convenient rather than because it is fundamental."
        ),
        content_tabs(
            "THE THREE BASES YOU WILL ACTUALLY MEET",
            "Binary is what the machine uses; octal and hexadecimal are "
            "shorthands humans use to write binary down without losing track "
            "of the bits.",
            [("Binary", "Base 2 -- digits 0 and 1",
              "One binary digit is one bit, and eight bits are one byte. "
              "Binary is unambiguous and exactly matches the hardware, but it "
              "is unreadable at length: a 32-bit address written in binary is "
              "thirty-two characters that the eye cannot chunk. Every other "
              "representation in this lesson exists to make binary "
              "writable."),
             ("Octal", "Base 8 -- digits 0 to 7",
              "Each octal digit stands for exactly three bits, because 8 is "
              "2 cubed. Octal survives mainly in Unix file permissions, where "
              "755 means three groups of three permission bits, and in some "
              "older machine architectures whose word sizes were multiples of "
              "three bits."),
             ("Hexadecimal", "Base 16 -- digits 0 to 9 and A to F",
              "Each hexadecimal digit stands for exactly four bits, because "
              "16 is 2 to the fourth. That makes one byte exactly two hex "
              "digits, which is why memory dumps, colour codes, MAC "
              "addresses and character codes are all written in hex. A is 10, "
              "B is 11, C is 12, D is 13, E is 14 and F is 15.")]),
        desc(
            "Learn the sixteen hexadecimal digits and the first sixteen "
            "powers of two by heart. Both appear in Subject A items where the "
            "arithmetic is trivial once you know them and impossible in the "
            "time available if you do not."
        ),
    ]),

    ("Converting from Decimal to Another Base", [
        desc(
            "To convert a whole number from decimal into base n, divide "
            "repeatedly by n and collect the remainders. The procedure is "
            "mechanical and takes about twenty seconds by hand."
        ),
        ol([
            "Divide the number by the target base.",
            "Write down the remainder. It is a digit of the answer.",
            "Replace the number with the quotient.",
            "Repeat until the quotient is 0.",
            "Read the remainders from the LAST one to the FIRST.",
        ]),
        image(fig("radix-conversion")),
        desc(
            "The last step is where marks are lost. The first remainder you "
            "produce is the LEAST significant digit, so the answer is the "
            "remainders in reverse order of production. Converting 45 to "
            "binary gives remainders 1, 0, 1, 1, 0, 1 in that order, and the "
            "answer is 101101(2), not 101101 read the other way -- check it "
            "by adding the place values: 32 + 8 + 4 + 1 = 45."
        ),
        desc(
            "Converting the other way, from base n to decimal, needs no "
            "procedure at all: multiply each digit by its place value and "
            "add. 2AF(16) is 2 x 256 + 10 x 16 + 15 x 1 = 512 + 160 + 15 = "
            "687."
        ),
    ]),

    ("The Shortcut Between Binary, Octal and Hexadecimal", [
        desc(
            "Because 8 and 16 are both powers of 2, converting between binary "
            "and either of them requires no arithmetic whatever -- only "
            "grouping. This is worth more than it sounds: an examination item "
            "that looks like a conversion problem often collapses to four "
            "seconds of work once you group the bits."
        ),
        ul([
            "Binary to octal: group the bits in THREES from the right, "
            "padding the left group with zeros, and replace each group with "
            "its octal digit.",
            "Binary to hexadecimal: group the bits in FOURS from the right, "
            "again padding on the left, and replace each group with its hex "
            "digit.",
            "Octal or hexadecimal to binary: expand each digit into its three "
            "or four bits, keeping the leading zeros.",
        ]),
        desc(
            "Worked through: 11010110(2) in fours is 1101 and 0110, which are "
            "D and 6, so the value is D6(16). The same bits in threes, padded, "
            "are 011, 010, 110 -- that is 326(8). Note that converting hex to "
            "octal is done by going through binary rather than directly, "
            "because 8 and 16 are not powers of each other."
        ),
        desc(
            "Group from the RIGHT, always. Grouping from the left is the "
            "reliable way to get a wrong answer that still looks plausible, "
            "because the digit count comes out the same."
        ),
    ]),

    ("Fractions Below the Radix Point", [
        desc(
            "Places to the right of the radix point continue the same rule "
            "downward: they are worth the base to a negative power. In binary "
            "they are one half, one quarter, one eighth, one sixteenth, and "
            "so on. So 0.101(2) is 0.5 + 0 + 0.125 = 0.625."
        ),
        desc(
            "Converting a decimal fraction into binary reverses the integer "
            "procedure: instead of dividing and keeping remainders, multiply "
            "by 2 and keep the integer parts, reading them TOP to bottom -- "
            "the opposite direction from the integer case, which is exactly "
            "why the two get confused."
        ),
        ol([
            "Multiply the fraction by 2.",
            "The integer part of the result (0 or 1) is the next digit.",
            "Keep only the fractional part and repeat.",
            "Stop when the fraction reaches 0, or when you have enough digits.",
            "Read the integer parts from FIRST to last.",
        ]),
        desc(
            "0.625 x 2 = 1.25, so the first digit is 1 and 0.25 remains. "
            "0.25 x 2 = 0.5, so the next digit is 0 and 0.5 remains. "
            "0.5 x 2 = 1.0, so the next digit is 1 and nothing remains. "
            "The answer is 0.101(2), which is what we started from."
        ),
    ]),

    ("Why 0.1 Cannot Be Stored Exactly", [
        desc(
            "Run that same procedure on 0.1 and it never terminates. "
            "0.1 x 2 = 0.2, digit 0. 0.2 x 2 = 0.4, digit 0. 0.4 x 2 = 0.8, "
            "digit 0. 0.8 x 2 = 1.6, digit 1, leaving 0.6. 0.6 x 2 = 1.2, "
            "digit 1, leaving 0.2 -- which we have already seen, so the "
            "sequence 0011 now repeats for ever."
        ),
        desc(
            "A fraction terminates in base n only when its denominator, in "
            "lowest terms, has no prime factor that n lacks. Base 10 has the "
            "factors 2 and 5, so tenths, fifths and halves all terminate in "
            "decimal. Base 2 has only the factor 2, so only fractions whose "
            "denominator is a power of two terminate in binary. One tenth is "
            "not one of them."
        ),
        ul([
            "1/2, 1/4 and 3/8 terminate in binary: their denominators are "
            "powers of two.",
            "1/10, 1/5 and 1/3 do not: each denominator has a prime factor "
            "that base 2 lacks.",
            "1/3 does not terminate in DECIMAL either, for exactly the same "
            "reason -- base 10 has no factor of 3. The phenomenon is not "
            "special to binary; it is only more surprising there because the "
            "offending fractions are ones we write every day.",
        ]),
        desc(
            "The consequence is the most-reported non-bug in software. A "
            "program that adds 0.1 to itself ten times does not arrive at "
            "exactly 1.0, because it never had exactly 0.1 to begin with -- "
            "it had the nearest representable value, and ten small errors "
            "accumulated. This is why money is stored in integer minor units "
            "or in a decimal type, never in a float, and why floating-point "
            "values are compared with a tolerance rather than with equality."
        ),
    ]),

    ("Representing Negative Numbers", [
        desc(
            "A bit pattern carries no minus sign, so a convention is needed. "
            "Three have been used, and the syllabus expects you to know why "
            "the third one won."
        ),
        content_tabs(
            "THREE CONVENTIONS FOR SIGNED INTEGERS",
            "Each reserves the leading bit as a sign, and they differ in what "
            "the remaining bits mean.",
            [("Sign and magnitude", "Sign bit plus an unsigned value",
              "The leading bit is 0 for positive and 1 for negative, and the "
              "rest is the magnitude. It is the easiest to read and the worst "
              "to compute with: there are two representations of zero "
              "(0000 0000 and 1000 0000), and addition needs a comparison of "
              "magnitudes before it can decide whether to add or subtract."),
             ("One's complement", "Negate by inverting every bit",
              "-5 is the bitwise inverse of +5. Addition works, but a carry "
              "out of the top has to be added back in at the bottom -- the "
              "so-called end-around carry -- and there are still two zeros, "
              "0000 0000 and 1111 1111."),
             ("Two's complement", "Invert every bit, then add 1",
              "The convention every modern machine uses. There is exactly one "
              "zero, subtraction is addition of the negation with no special "
              "case, and the same adder circuit handles signed and unsigned "
              "values without knowing which it has. That last point is why it "
              "won: it makes the hardware smaller.")]),
    ]),

    ("Two's Complement, Worked Through", [
        media_text(
            fig("twos-complement"),
            "THE ONE PROCEDURE WORTH MEMORISING",
            "Negating a number in two's complement is two steps, and running "
            "the two steps again gets you back where you started.",
            "Invert, then add one",
            "To form -5 in eight bits: write +5 as 0000 0101, invert every "
            "bit to get 1111 1010, then add 1 to get 1111 1011. To check it, "
            "add 0000 0101 and 1111 1011 -- the result is 1 0000 0000, and "
            "the carry out of the top bit is discarded, leaving zero. A "
            "number plus its negation is zero, which is the whole "
            "requirement."),
        desc(
            "There is a faster hand method for the examination: reading from "
            "the right, copy bits up to and including the first 1, then "
            "invert everything above it. Applied to 0000 0101, copy the "
            "trailing 1, then invert 0000 010 to 1111 101, giving 1111 1011 "
            "-- the same answer in one pass instead of two."
        ),
        desc(
            "Reading a negative value back is the same procedure. Given "
            "1111 0110, the leading 1 says it is negative; negate it to get "
            "0000 1010, which is 10, so the original was -10. The procedure "
            "is its own inverse, which is what makes it usable in both "
            "directions under time pressure."
        ),
    ]),

    ("The Range of an n-Bit Integer", [
        desc(
            "How many values fit in n bits is a counting question with one "
            "answer: 2 to the power n. How they are labelled depends on "
            "whether the pattern is read as unsigned or as two's complement."
        ),
        table(
            ["Width", "Unsigned range", "Two's complement range", "Note"],
            [["8 bits", "0 to 255", "-128 to +127",
              "One more negative than positive"],
             ["16 bits", "0 to 65,535", "-32,768 to +32,767",
              "The classic short integer"],
             ["32 bits", "0 to 4,294,967,295",
              "-2,147,483,648 to +2,147,483,647",
              "Overflows as a second count in 2038"],
             ["n bits", "0 to 2^n - 1", "-2^(n-1) to 2^(n-1) - 1",
              "Asymmetric by exactly one value"]],
            caption="What fits in n bits, read as unsigned and as signed.",
            footer="The asymmetry is why negating the most negative value "
                   "overflows: in eight bits, -(-128) is -128."),
        desc(
            "Notice the asymmetry. Two's complement in eight bits runs from "
            "-128 to +127, not -127 to +127. Zero occupies one of the "
            "patterns that would otherwise be a positive value, so there is "
            "one more negative than positive. A consequence with real teeth: "
            "negating the most negative value has no representable result, so "
            "in eight bits, -(-128) is -128."
        ),
        desc(
            "The general forms are worth memorising because Subject A states "
            "them symbolically. In n bits, unsigned runs from 0 to 2^n - 1, "
            "and two's complement runs from -2^(n-1) to 2^(n-1) - 1."
        ),
    ]),

    ("Overflow: When the Answer Does Not Fit", [
        desc(
            "Overflow is not an error the machine raises; in most languages "
            "it is a wrong answer the machine returns silently. It occurs "
            "when the true result of an operation lies outside the range the "
            "width can represent, and the surplus bits are simply discarded."
        ),
        compare_grid(
            "TWO KINDS OF RANGE FAILURE",
            "The syllabus names both, and they are opposite ends of the same "
            "problem.",
            [("Overflow",
              "The magnitude is too LARGE for the representation. In signed "
              "eight-bit arithmetic, 127 + 1 gives -128: the carry runs into "
              "the sign bit and flips it."),
             ("Underflow",
              "The magnitude is too SMALL to be distinguished from zero. It "
              "is a floating-point condition: a value closer to zero than the "
              "smallest representable non-zero value becomes zero.")]),
        desc(
            "The signed case has a memorable signature: adding two positive "
            "numbers produces a negative one, or adding two negatives "
            "produces a positive. Adding a positive to a negative can never "
            "overflow, because the result lies between the two operands. That "
            "test -- same signs in, different sign out -- is exactly how the "
            "hardware sets its overflow flag, and it is what an examination "
            "item is checking when it gives you two eight-bit values to add."
        ),
    ]),

    ("Fixed Point and Floating Point", [
        desc(
            "Two ways to represent a number with a fractional part, and the "
            "choice between them is a genuine engineering trade-off rather "
            "than one being better."
        ),
        compare_grid(
            "TWO WAYS TO PLACE THE POINT",
            "The names say exactly what they mean: in one the radix point "
            "never moves, in the other it does.",
            [("Fixed point",
              "The point sits at an agreed position, so the value is really "
              "an integer scaled by a constant. Uniform absolute precision "
              "across the whole range, simple and fast arithmetic, but a "
              "narrow range."),
             ("Floating point",
              "The number is stored as a mantissa and an exponent, so the "
              "point floats. Enormous range and uniform RELATIVE precision, "
              "at the cost of more complex arithmetic and rounding at every "
              "step.")]),
        desc(
            "Fixed point is why financial systems store amounts as integer "
            "cents and why embedded controllers without a floating-point unit "
            "still handle fractions. Floating point is why a single format "
            "can hold both the mass of an electron and the mass of a star."
        ),
    ]),

    ("The Structure of a Floating-Point Number", [
        desc(
            "IEEE 754 is the standard every general-purpose processor "
            "implements, and its single-precision format packs three fields "
            "into 32 bits."
        ),
        image(fig("float-layout")),
        ul([
            "The SIGN is one bit: 0 for positive, 1 for negative. Note that "
            "floating point uses sign-and-magnitude, not two's complement, "
            "which is why it has both +0 and -0.",
            "The EXPONENT is eight bits stored with a bias of 127, so a "
            "stored 127 means an exponent of 0 and a stored 130 means 3. The "
            "bias exists so that exponents can be compared as unsigned "
            "integers.",
            "The MANTISSA, also called the fraction or significand, is "
            "twenty-three bits. The number is normalised so its leading digit "
            "is always 1, and since that 1 is then known it is not stored -- "
            "giving twenty-four bits of precision from twenty-three bits of "
            "storage.",
        ]),
        desc(
            "Double precision uses the same three fields at 64 bits: one "
            "sign, eleven exponent bits biased by 1023, and fifty-two "
            "mantissa bits. That buys roughly sixteen decimal digits of "
            "precision against single precision's seven, which is the "
            "practical reason double is the default in most languages."
        ),
    ]),

    ("Precision Errors and How to Recognise Them", [
        desc(
            "Because the mantissa is finite, almost every floating-point "
            "operation rounds. The syllabus names three distinct effects, and "
            "Subject A items are usually asking you to identify which one a "
            "described calculation is suffering from."
        ),
        image(fig("float-errors")),
        content_accordion(
            "THE THREE NAMED EFFECTS",
            "Each has a characteristic cause, so the cause in the question "
            "stem identifies the effect.",
            [("Cancellation of significant digits",
              "Caused by SUBTRACTING two nearly equal values. The agreeing "
              "leading digits cancel to zero and what survives is composed "
              "mostly of the rounding error already present in the operands. "
              "If 1.000001 and 1.000000 each carry seven good digits, their "
              "difference carries one. The fix is algebraic: rearrange the "
              "formula so the subtraction does not happen, as the stable form "
              "of the quadratic formula does."),
             ("Loss of trailing digits",
              "Caused by ADDING values of very different magnitude. Aligning "
              "the exponents shifts the smaller value's bits off the end of "
              "the mantissa, and it contributes nothing at all. Adding "
              "1.0 x 10^8 and 1.0 x 10^-8 in single precision returns "
              "1.0 x 10^8 unchanged. The fix is to sum from smallest to "
              "largest, so small values accumulate into something big enough "
              "to survive."),
             ("Rounding error",
              "Present in every operation whose exact result is not "
              "representable, including the initial conversion of a decimal "
              "literal. Individually negligible, it accumulates over long "
              "computations. The fix is not to eliminate it -- that is "
              "impossible -- but to bound it: use a wider type, reduce the "
              "operation count, and never test two floating-point values for "
              "exact equality."),
             ("Overflow and underflow in floating point",
              "The exponent field is finite too. A result too large for it "
              "becomes infinity; a result too small becomes zero, or a "
              "denormalised value with reduced precision on the way there. "
              "Both are silent by default.")]),
    ]),

    ("Decimal Representations: BCD and Packed Decimal", [
        desc(
            "Some domains cannot tolerate the binary approximation of decimal "
            "fractions at all, so they store decimal digits directly. Binary "
            "Coded Decimal encodes each decimal digit in its own four bits: "
            "the number 59 is stored as 0101 1001 rather than as the binary "
            "111011."
        ),
        desc(
            "Packed decimal is the compact form, fitting two digits into each "
            "byte with the sign held in the final four bits -- typically C "
            "for positive and D for negative. Zoned decimal is the "
            "less-compact form, one digit per byte with a zone value in the "
            "upper half, which makes it directly printable."
        ),
        compare_grid(
            "WHY A FORMAT THAT WASTES SPACE STILL EXISTS",
            "BCD uses four bits to hold ten values, so a sixth of the "
            "capacity is unused, and its arithmetic is slower. It survives "
            "because the trade it makes is the right one in its domain.",
            [("What it buys",
              "Decimal fractions are exact, so 0.1 is really 0.1. "
              "Round-trip conversion to and from printed decimal is lossless, "
              "and results match hand-calculated ones exactly."),
             ("Where it is used",
              "Financial and accounting systems, COBOL business "
              "applications, calculators, and any interface where a "
              "displayed figure must agree to the last digit with an audited "
              "one.")]),
    ]),

    ("Shift Operations", [
        desc(
            "Shifting moves every bit in a word left or right by a stated "
            "number of positions. It is the cheapest operation a processor "
            "offers and it appears constantly in examination items, both as "
            "arithmetic and as bit manipulation."
        ),
        image(fig("shift-operations")),
        desc(
            "The distinction the syllabus insists on is between a LOGICAL "
            "shift, which treats the word as a meaningless pattern of bits "
            "and fills the vacated positions with zeros, and an ARITHMETIC "
            "shift, which treats the word as a signed number and therefore "
            "replicates the sign bit when shifting right. Left shifts are "
            "identical under both, because the vacated positions are at the "
            "bottom and are filled with zero either way."
        ),
        desc(
            "Get this wrong and a negative number becomes a large positive "
            "one. Logically shifting 1011 0000 right by one gives 0101 1000, "
            "turning -80 into +88. Arithmetically shifting it gives "
            "1101 1000, which is -40 -- the correct halving."
        ),
    ]),

    ("Shifts as Multiplication and Division", [
        desc(
            "A left shift by n multiplies by 2^n; an arithmetic right shift "
            "by n divides by 2^n. Compilers use this constantly, replacing a "
            "multiplication by 8 with a shift by 3, because a shift completes "
            "in a single cycle where a multiply may take several."
        ),
        ol([
            "0000 0110 is 6. Shift left by 2: 0001 1000, which is 24, and "
            "6 x 4 = 24.",
            "1111 1000 is -8. Arithmetic shift right by 1: 1111 1100, which "
            "is -4, and -8 / 2 = -4.",
            "0111 1111 is 127. Shift left by 1: 1111 1110, which read as "
            "signed is -2 -- the significant bit was pushed into the sign "
            "position and the answer is simply wrong.",
        ]),
        desc(
            "That third line is the trap. The identity holds only while no "
            "significant bit is pushed off the end, so a left shift is a "
            "multiplication exactly as long as it does not overflow. Right "
            "shifts of negative numbers carry a subtler wrinkle: they round "
            "towards negative infinity rather than towards zero, so -7 shifted "
            "right by 1 gives -4, whereas -7 / 2 truncated in most languages "
            "gives -3."
        ),
    ]),

    ("Sets and the Operations on Them", [
        desc(
            "A set is a collection of distinct elements with no ordering. The "
            "syllabus needs three operations on them, and their real "
            "importance is that they are the same algebra as the logical "
            "operations later in this lesson and as the WHERE clause of a "
            "database query."
        ),
        image(fig("set-operations")),
        ul([
            "The UNION of A and B, written A u B, holds every element that is "
            "in A, in B, or in both.",
            "The INTERSECTION, written A n B, holds only the elements in "
            "both.",
            "The COMPLEMENT of A holds everything in the universal set that "
            "is not in A.",
            "A SUBSET relation, A is a subset of B, holds when every element "
            "of A is also in B.",
        ]),
        desc(
            "The Venn diagram is the tool for reasoning about these, and its "
            "main use in the examination is counting. If 60 candidates study "
            "networks, 45 study databases, and 20 study both, the number "
            "studying at least one is not 105 -- the 20 have been counted "
            "twice, so it is 60 + 45 - 20 = 85. Subtracting the intersection "
            "to correct a double count is the inclusion-exclusion principle, "
            "and it is examined in almost this form."
        ),
    ]),

    ("Propositions and Logical Operations", [
        desc(
            "A proposition is a statement that is definitely true or "
            "definitely false. 'The port number is 443' is a proposition; "
            "'configure the firewall' is not, because it has no truth value. "
            "Propositional logic combines propositions with operators, and a "
            "truth table exhausts every combination of inputs to show what "
            "the combination produces."
        ),
        table(
            ["Operation", "Notation", "0, 0", "0, 1", "1, 0", "1, 1"],
            [["Logical product (AND)", "A . B", "0", "0", "0", "1"],
             ["Logical sum (OR)", "A + B", "0", "1", "1", "1"],
             ["Exclusive logical sum (XOR)", "A (+) B", "0", "1", "1", "0"],
             ["Negative logical product (NAND)", "not (A . B)",
              "1", "1", "1", "0"],
             ["Negative logical sum (NOR)", "not (A + B)",
              "1", "0", "0", "0"]],
            caption="Each row gives the output for the four input "
                    "combinations of A and B.",
            footer="NAND and NOR are each functionally complete: any circuit "
                   "at all can be built from one of them alone."),
        desc(
            "The syllabus names the operations in their formal style, and the "
            "examination uses those names rather than the programming ones. "
            "Logical sum is OR. Logical product is AND. Negation is NOT. "
            "Exclusive logical sum is XOR, true when the inputs differ. "
            "Negative logical sum is NOR, and negative logical product is "
            "NAND."
        ),
        desc(
            "XOR deserves separate attention because it does more work than "
            "its truth table suggests. It is true exactly when the inputs "
            "differ, which makes it a difference detector -- the basis of "
            "parity checking, of simple checksums, and of the property that "
            "applying the same XOR mask twice restores the original value, "
            "which is the whole of the one-time pad and of many simple "
            "encodings."
        ),
    ]),

    ("De Morgan's Laws", [
        desc(
            "The two laws that let a negation be pushed inside a bracket. "
            "They are the most frequently examined single fact in this whole "
            "minor category, and they matter far beyond the examination: they "
            "are how you correctly invert an if-condition."
        ),
        image(fig("de-morgan")),
        desc(
            "The rule in words: to negate a compound expression, negate each "
            "operand AND swap the operator. AND becomes OR; OR becomes AND. "
            "Forgetting to swap the operator is the classic error, and it "
            "produces a condition that is wrong only for some inputs, which "
            "is far worse than one that is wrong for all of them."
        ),
        desc(
            "Concretely: the opposite of 'the account is active and the "
            "balance is positive' is not 'the account is inactive and the "
            "balance is not positive'. It is 'the account is inactive OR the "
            "balance is not positive' -- either failure is enough to break "
            "the conjunction."
        ),
    ]),

    ("The Laws of Logical Algebra", [
        desc(
            "Beyond De Morgan, a handful of laws let a logical expression be "
            "simplified, which is what circuit minimisation and query "
            "optimisation both rest on."
        ),
        content_accordion(
            "THE LAWS THE SYLLABUS EXPECTS",
            "Each holds with AND and OR interchanged, which is the duality "
            "principle: swap the operators and swap 0 with 1 in any true "
            "identity and it stays true.",
            [("Commutative law",
              "A . B = B . A and A + B = B + A. Order of operands does not "
              "matter -- though in a programming language it may, because "
              "short-circuit evaluation makes the left operand a guard for "
              "the right one."),
             ("Associative law",
              "(A . B) . C = A . (B . C). Grouping does not matter, which is "
              "why a chain of ANDs needs no brackets."),
             ("Distributive law",
              "A . (B + C) = (A . B) + (A . C), and also A + (B . C) = "
              "(A + B) . (A + C). The second form has no arithmetic "
              "counterpart -- addition does not distribute over "
              "multiplication -- and that asymmetry is where intuition from "
              "school algebra misleads."),
             ("Identity and null laws",
              "A . 1 = A, A + 0 = A, A . 0 = 0, and A + 1 = 1. Anything ANDed "
              "with false is false; anything ORed with true is true."),
             ("Idempotent and complement laws",
              "A . A = A and A + A = A -- repetition adds nothing. "
              "A . (not A) = 0 and A + (not A) = 1 -- a proposition and its "
              "negation cannot both hold, and one of them must."),
             ("Absorption law",
              "A + (A . B) = A, and A . (A + B) = A. The inner term is "
              "redundant. This one is the workhorse of simplification "
              "questions, because it removes a whole term at a stroke and is "
              "the hardest to spot.")]),
    ]),

    ("Truth Tables as a Method", [
        desc(
            "When a logical identity is not obvious, a truth table settles it "
            "by exhaustion. With n propositional variables there are 2^n rows, "
            "so two variables need four rows and three need eight -- small "
            "enough to do by hand at the sizes the examination uses."
        ),
        ol([
            "List every combination of input values, counting up in binary so "
            "none is missed.",
            "Add a column for each intermediate sub-expression, innermost "
            "bracket first.",
            "Add a final column for each of the two expressions being "
            "compared.",
            "If the two final columns agree on every row, the expressions are "
            "equivalent; a single disagreeing row disproves it.",
        ]),
        desc(
            "This also settles the questions that ask which single gate type "
            "can build any circuit. Working the tables shows that NAND alone "
            "produces NOT (by tying its inputs together), then AND (by "
            "negating a NAND), then OR (by De Morgan) -- so NAND is "
            "functionally complete, and so, by the dual argument, is NOR."
        ),
    ]),

    ("Common Mistakes", [
        desc(
            "These are the errors that actually cost marks on this material, "
            "collected from where the procedures above have a direction or a "
            "boundary that is easy to reverse."
        ),
        ul([
            "Reading division remainders in the order they were produced. "
            "They come out least-significant first, so the answer is the "
            "reverse.",
            "Reading fraction multiplication results in reverse. These come "
            "out most-significant first -- the opposite direction from the "
            "integer case.",
            "Grouping bits from the left when converting to hex or octal. "
            "Always group from the radix point outward.",
            "Assuming the signed range is symmetric. In n bits there is one "
            "more negative value than positive.",
            "Using a logical right shift on a signed value, which turns a "
            "negative number into a large positive one.",
            "Negating a compound condition without swapping AND for OR.",
            "Testing two floating-point values for exact equality.",
            "Adding the sizes of two overlapping sets without subtracting the "
            "intersection.",
        ]),
    ]),

    ("A Worked Subject A Item", [
        desc(
            "A question in the style the examination actually uses, worked "
            "the way you would have to work it with no calculator: "
            "\"An eight-bit signed value holds 1110 1100. It is shifted "
            "arithmetically right by two places. What is the decimal value of "
            "the result?\""
        ),
        ol([
            "Identify the sign. The leading bit is 1, so the value is "
            "negative and the shift must replicate that 1.",
            "Read the original value. Negate 1110 1100: invert to 0001 0011, "
            "add 1 to get 0001 0100, which is 20. So the value is -20.",
            "Shift arithmetically right by two, filling from the left with "
            "the sign bit: 1110 1100 becomes 1111 1011.",
            "Read the result. Negate 1111 1011: invert to 0000 0100, add 1 to "
            "get 0000 0101, which is 5. So the result is -5.",
            "Sanity check the arithmetic meaning: shifting right by two "
            "divides by four, and -20 / 4 = -5. The two routes agree.",
        ]),
        desc(
            "Notice that the check took three seconds and would have caught "
            "any slip in the bit manipulation. Almost every numeric item on "
            "this paper has such a check available, and using it is the "
            "single most valuable examination habit on Subject A."
        ),
    ]),

    ("How This Connects to the Rest of the Syllabus", [
        desc(
            "This lesson is a prerequisite for more of the certification than "
            "any other, which is why it comes first."
        ),
        ul([
            "Logical operations become the AND, OR and NOT gates of the "
            "Hardware lesson, and the laws here are what circuit "
            "minimisation applies.",
            "Two's complement and shifts reappear in the Processor lesson as "
            "the arithmetic-logic unit's actual operations and its condition "
            "flags.",
            "Character codes in the Theory of Information lesson are bit "
            "patterns interpreted by a table, and hexadecimal is how they are "
            "written.",
            "Set operations reappear as SQL's UNION, INTERSECT and EXCEPT, "
            "and De Morgan is what a query optimiser applies to a negated "
            "predicate.",
            "Probability in the Applied Mathematics lesson uses the same "
            "inclusion-exclusion counting the Venn diagram teaches here.",
            "Subject B pseudocode tracing constantly involves integer "
            "division, remainders and boolean conditions -- all of which are "
            "this lesson's mechanics applied under time pressure.",
        ]),
    ]),

    ("Recall Check", [
        desc(
            "Cover the answers and work each one out before turning it over. "
            "These are the facts that have to be automatic rather than "
            "derived, because on Subject A the time to derive them is time "
            "Subject B needs."
        ),
        review_cards(
            "TEST YOURSELF",
            "Six things this lesson expects you to produce without pausing.",
            [("Negate a value in two's complement",
              "Invert every bit, then add 1",
              "The procedure is its own inverse, so the same two steps read "
              "a negative value back. The hand shortcut: copy bits from the "
              "right up to and including the first 1, then invert the rest."),
             ("Range of an n-bit signed integer",
              "-2^(n-1) to 2^(n-1) - 1",
              "Asymmetric by one, because zero occupies a pattern that would "
              "otherwise be positive. Eight bits give -128 to +127."),
             ("Signature of signed overflow",
              "Same signs in, different sign out",
              "Two positives adding to a negative, or two negatives adding "
              "to a positive. Adding a positive to a negative can never "
              "overflow."),
             ("Subtracting two nearly equal values",
              "Cancellation of significant digits",
              "Adding values of very different magnitude is the other "
              "effect, loss of trailing digits. The cause named in the stem "
              "identifies which one is meant."),
             ("Arithmetic versus logical right shift",
              "Arithmetic replicates the sign bit",
              "Logical fills with zero and destroys the sign, turning a "
              "negative value into a large positive one. Left shifts are "
              "identical under both."),
             ("Negate (A AND B)",
              "(NOT A) OR (NOT B)",
              "De Morgan: negate each operand and swap the operator. "
              "Forgetting the swap gives a condition wrong only for some "
              "inputs, which is worse than one wrong for all of them.")]),
    ]),
]

_exam_notes = [
    desc(
        "Subject A asks this material directly, and it is among the most "
        "predictable content on the paper -- which makes it among the "
        "cheapest marks available if the procedures are automatic."
    ),
    ul([
        "Radix conversion in both directions, usually with values small "
        "enough to do in under a minute.",
        "Reading or forming a two's complement value, and stating the range "
        "of an n-bit signed integer.",
        "Predicting the result of a logical or arithmetic shift, often "
        "combined with its meaning as multiplication or division.",
        "Naming which precision effect a described floating-point "
        "calculation suffers from.",
        "Simplifying a logical expression, or selecting the correct negation "
        "of a compound condition.",
        "Counting elements across overlapping sets.",
    ]),
    desc(
        "The examination provides no calculator, so practise every "
        "conversion by hand until it is mechanical. The powers of two up to "
        "2^16, and the hexadecimal digits A to F as 10 to 15, should be "
        "recalled rather than derived -- deriving them costs time you will "
        "need on Subject B."
    ),
]

_key_terms = [
    ("Radix (base)",
     "The number of distinct digits a positional numeral system uses. A "
     "base-n system uses the digits 0 to n-1, and each place is worth n "
     "times the place to its right."),
    ("Bit",
     "A single binary digit, holding 0 or 1. Eight bits form a byte, which "
     "is written as exactly two hexadecimal digits."),
    ("Two's complement",
     "The signed-integer convention every modern processor uses. A value is "
     "negated by inverting every bit and adding 1, which gives a single "
     "representation of zero and lets one adder serve signed and unsigned "
     "arithmetic alike."),
    ("Overflow",
     "A result whose magnitude exceeds what the representation can hold. In "
     "signed integer arithmetic it is silent, and its signature is two "
     "operands of the same sign producing a result of the other sign."),
    ("Underflow",
     "A floating-point result too close to zero to be distinguished from it, "
     "which is therefore stored as zero or as a denormalised value with "
     "reduced precision."),
    ("Fixed-point number",
     "A representation in which the radix point sits at an agreed position, "
     "making the stored value an integer scaled by a constant. Uniform "
     "absolute precision, narrow range."),
    ("Floating-point number",
     "A representation as a sign, a mantissa and an exponent, so the radix "
     "point moves. Enormous range with uniform relative precision, at the "
     "cost of rounding at every operation."),
    ("Mantissa",
     "The significant digits of a floating-point number, normalised so the "
     "leading digit is 1. In IEEE 754 that leading 1 is implied rather than "
     "stored, buying one extra bit of precision."),
    ("Exponent",
     "The power of the base a floating-point mantissa is scaled by, stored "
     "with a bias -- 127 in single precision -- so that exponents compare "
     "correctly as unsigned integers."),
    ("Cancellation of significant digits",
     "The precision loss caused by subtracting two nearly equal values: the "
     "agreeing leading digits cancel and mostly rounding noise remains."),
    ("Loss of trailing digits",
     "The precision loss caused by adding values of very different "
     "magnitude: aligning the exponents shifts the smaller value out of the "
     "mantissa entirely."),
    ("BCD (Binary Coded Decimal)",
     "A representation storing each decimal digit in its own four bits. It "
     "wastes capacity and computes slowly, but keeps decimal fractions "
     "exact, which is why financial systems use it."),
    ("Logical shift",
     "A shift that fills the vacated positions with zeros, treating the word "
     "as an unsigned bit pattern. Applied right to a negative value it "
     "destroys the sign."),
    ("Arithmetic shift",
     "A shift that replicates the sign bit when moving right, preserving the "
     "value's sign. A right shift by n divides by 2^n, rounding towards "
     "negative infinity."),
    ("Proposition",
     "A statement that is definitely true or definitely false, and therefore "
     "can be combined by logical operators and tabulated."),
    ("Exclusive logical sum (XOR)",
     "The operation true exactly when its inputs differ. Applying the same "
     "XOR mask twice restores the original value, which underlies parity, "
     "checksums and simple encodings."),
    ("De Morgan's laws",
     "not (A . B) = (not A) + (not B), and not (A + B) = (not A) . (not B). "
     "Negating a compound expression negates each operand and swaps the "
     "operator."),
    ("Inclusion-exclusion principle",
     "|A u B| = |A| + |B| - |A n B|. Adding two set sizes double-counts the "
     "overlap, so the intersection must be subtracted once."),
]

_summary = (
    "A numeral means nothing until its base is known, and every "
    "representation in a computer is a bit pattern plus a convention for "
    "reading it. Converting between bases is division-and-remainders one way "
    "and place-value summation the other, with the remainders read in "
    "reverse and fraction digits read forward -- the two directions that "
    "cause most errors. Negative integers use two's complement, where "
    "negation is invert-and-add-one, there is a single zero, and the range "
    "is asymmetric by one value. Overflow is a silent wrong answer whose "
    "signature is two same-signed operands producing an oppositely signed "
    "result. Fractions are held either at a fixed point, which is exact and "
    "narrow, or in floating point, which is vast and approximate: its "
    "mantissa is finite, so subtracting near-equal values causes "
    "cancellation, adding wildly unequal ones loses trailing digits, and "
    "rounding accumulates -- which is why 0.1 is not exactly 0.1 and why "
    "money is not stored in a float. Shifts are the cheapest arithmetic "
    "there is, multiplying and dividing by powers of two, provided a logical "
    "shift is never applied to a signed value and no significant bit is "
    "pushed off the top. Sets and propositions are one algebra written "
    "twice: union is OR, intersection is AND, complement is NOT, and De "
    "Morgan's laws -- negate each operand and swap the operator -- are the "
    "single most examined fact here and the correct way to invert any "
    "compound condition."
)

# ------------------------------------------------------------------- quiz

_quiz = [
    mcq("EASY",
        "A memory address is written as 2AF in hexadecimal.\n\n"
        "What is this value in decimal?",
        [("655", False),
         ("687", True),
         ("703", False),
         ("2,415", False)],
        "Expand by place value: 2 x 256 + 10 x 16 + 15 x 1 = 512 + 160 + 15 "
        "= 687. The value 655 comes from treating A as 9 rather than 10; 703 "
        "comes from treating F as 16 rather than 15; and 2,415 comes from "
        "reading the digits as decimal 2, 10 and 15 concatenated rather than "
        "as place values."),

    mcq("EASY",
        "Converting the decimal value 45 to binary by repeated division "
        "produces the remainders 1, 0, 1, 1, 0, 1 in that order.\n\n"
        "What is 45 in binary?",
        [("110101", False),
         ("101011", False),
         ("011011", False),
         ("101101", True)],
        "The first remainder produced is the LEAST significant bit, so the "
        "answer is the remainder sequence reversed: 101101. Check it by "
        "place value -- 32 + 8 + 4 + 1 = 45. Option 110101 is the remainders "
        "read in the order they were produced, which is the most common "
        "error on this conversion."),

    mcq("EASY",
        "Eight bits are used to hold a signed integer in two's complement.\n\n"
        "What is the range of values that can be represented?",
        [("-128 to +127", True),
         ("-127 to +127", False),
         ("-127 to +128", False),
         ("0 to 255", False)],
        "In n bits, two's complement runs from -2^(n-1) to 2^(n-1) - 1, which "
        "for eight bits is -128 to +127. The range is asymmetric because zero "
        "takes one of the patterns that would otherwise be positive, leaving "
        "one more negative value than positive. The symmetric -127 to +127 "
        "would describe sign-and-magnitude or one's complement, both of which "
        "waste a pattern on a second zero, and 0 to 255 is the unsigned "
        "reading of the same eight bits."),

    mcq("AVERAGE",
        "The eight-bit pattern 1111 0110 is interpreted as a two's "
        "complement signed integer.\n\n"
        "What decimal value does it represent?",
        [("246", False),
         ("-9", False),
         ("-10", True),
         ("-118", False)],
        "The leading bit is 1, so the value is negative. Negate the pattern "
        "to find its magnitude: invert 1111 0110 to 0000 1001, then add 1 to "
        "get 0000 1010, which is 10 -- so the original is -10. The value 246 "
        "is the unsigned reading; -9 results from inverting without adding "
        "one, which is the one's complement answer; and -118 comes from "
        "reading the lower seven bits as a magnitude, which is the "
        "sign-and-magnitude answer."),

    mcq("AVERAGE",
        "Two eight-bit signed values, 0110 0100 (100) and 0011 0010 (50), "
        "are added.\n\n"
        "What happens?",
        [("The result is 150, which fits without difficulty.", False),
         ("Overflow occurs, and the stored result is negative.", True),
         ("Underflow occurs, and the stored result becomes zero.", False),
         ("The processor raises an exception before storing anything.", False)],
        "The true sum, 150, exceeds the maximum signed eight-bit value of "
        "127. The addition carries into the sign bit, so the stored pattern "
        "is 1001 0110, which reads as -106. Two positive operands producing a "
        "negative result is the definitive signature of signed overflow. "
        "Underflow is a floating-point condition about values too small to "
        "distinguish from zero, not too large, and integer overflow is "
        "silent in most languages rather than raising anything."),

    mcq("AVERAGE",
        "A program computes the difference between two measured values that "
        "agree to six significant figures, then uses that difference as a "
        "divisor.\n\n"
        "Which precision problem does this calculation risk?",
        [("Loss of trailing digits, because the operands differ in magnitude",
          False),
         ("Underflow, because the difference is smaller than the smallest "
          "representable value", False),
         ("Overflow, because dividing by a small number produces a large "
          "result", False),
         ("Cancellation of significant digits, because the agreeing leading "
          "digits are lost", True)],
        "Subtracting two nearly equal values cancels their agreeing leading "
        "digits, and what survives is composed largely of the rounding error "
        "already present in the operands -- so a difference computed from "
        "six good figures may carry only one. Dividing by that value then "
        "amplifies the error. Loss of trailing digits is the opposite "
        "situation, caused by ADDING values of very different magnitude; "
        "underflow requires the value to approach the format's smallest "
        "magnitude, which agreeing measurements need not; and the risk here "
        "is an inaccurate result, not one too large to store."),

    mcq("AVERAGE",
        "An eight-bit register holds 1011 0000 and the value is treated as a "
        "signed integer.\n\n"
        "Which shift preserves its arithmetic meaning when halving it?",
        [("A logical shift right, which fills the vacated bit with 0", False),
         ("A logical shift left, which fills the vacated bit with 0", False),
         ("An arithmetic shift right, which replicates the sign bit", True),
         ("Either shift right, since both move the bits identically", False)],
        "1011 0000 is -80. An arithmetic shift right replicates the sign bit, "
        "giving 1101 1000, which is -40 -- the correct halving. A logical "
        "shift right fills with 0, giving 0101 1000, which is +88: the sign "
        "is destroyed and the value is meaningless. A left shift doubles "
        "rather than halves. The two right shifts are identical only for "
        "values whose leading bit is already 0."),

    mcq("HARD",
        "A configuration check must fail when an account is not active or its "
        "balance is not positive.\n\n"
        "Its current implementation tests NOT (active AND balancePositive). "
        "Which expression is equivalent?",
        [("(NOT active) OR (NOT balancePositive)", True),
         ("(NOT active) AND (NOT balancePositive)", False),
         ("NOT (active OR balancePositive)", False),
         ("active OR balancePositive", False)],
        "De Morgan's law states that negating a compound expression negates "
        "each operand AND swaps the operator, so NOT (A AND B) becomes "
        "(NOT A) OR (NOT B). The second option keeps AND instead of swapping "
        "it, which is the classic error: it is true only when BOTH conditions "
        "fail, so an active account with a negative balance would wrongly "
        "pass. The third option is the other De Morgan law applied to the "
        "wrong original, and the fourth drops the negation entirely."),

    mcq("HARD",
        "Of 200 candidates surveyed, 120 have studied networking, 90 have "
        "studied databases, and 45 have studied both.\n\n"
        "How many have studied neither subject?",
        [("10", False),
         ("20", False),
         ("45", False),
         ("35", True)],
        "By inclusion-exclusion, the number who studied at least one is "
        "120 + 90 - 45 = 165, because the 45 who studied both were counted "
        "once in each group. Those studying neither are therefore "
        "200 - 165 = 35. Answering 10 comes from adding 120 and 90 without "
        "subtracting the overlap, giving 210, which already exceeds the 200 "
        "surveyed and should signal the error immediately."),

    mcq("HARD",
        "Repeatedly multiplying the decimal fraction 0.1 by 2 and recording "
        "the integer parts produces 0, 0, 0, 1, 1, 0, 0, 1, 1, and the "
        "sequence 0011 then repeats without end.\n\n"
        "What does this demonstrate?",
        [("The conversion procedure has been applied incorrectly, since every "
          "decimal fraction terminates in binary.", False),
         ("One tenth has no finite binary representation, so it can only be "
          "stored as an approximation.", True),
         ("One tenth requires a larger mantissa, and double precision would "
          "represent it exactly.", False),
         ("The value must be held as a fixed-point number, which would make "
          "the binary expansion terminate.", False),
        ],
        "A fraction terminates in base n only when its denominator, in lowest "
        "terms, has no prime factor the base lacks. Base 2 offers only the "
        "factor 2, and one tenth has a factor of 5, so its binary expansion "
        "repeats for ever and any binary floating-point format stores an "
        "approximation. Widening the mantissa moves the error further down "
        "without removing it, so double precision does not help in kind. "
        "Fixed point does not change the base either -- a BINARY fixed-point "
        "value has the same problem; it is DECIMAL representations such as "
        "BCD that keep one tenth exact."),
]

# ----------------------------------------------------------------- lesson

LESSON_DISCRETE_MATHS = lesson(
    MAJOR, MIDDLE,
    "Discrete Mathematics: Radix, Numeric Representation and Precision",
    _quiz,
    lesson_structure(
        "Discrete Mathematics: Radix, Numeric Representation and Precision",
        "Everything a computer stores is a pattern of bits, and every kind of "
        "value is a convention for reading such a pattern. This lesson "
        "establishes those conventions: how numbers are written in any base "
        "and converted between bases by hand, how negative numbers and "
        "fractions are encoded, why finite precision produces errors with "
        "specific names and specific causes, and how sets and propositions "
        "give you the algebra behind every condition you will ever write. It "
        "is the foundation the rest of the certification stands on, and it is "
        "examined more directly than almost anything else on Subject A.",
        [
            "Convert whole numbers and fractions between binary, octal, "
            "decimal and hexadecimal without a calculator",
            "Form and read two's complement values, and state the range of an "
            "n-bit signed integer",
            "Recognise integer overflow from the signs of the operands and "
            "the result",
            "Describe the fields of a floating-point number and identify "
            "which precision error a given calculation risks",
            "Predict the result of logical and arithmetic shifts, and use "
            "them as multiplication and division",
            "Apply set operations and the inclusion-exclusion principle to "
            "counting problems",
            "Simplify logical expressions using De Morgan's laws and the "
            "basic laws of logical algebra",
        ],
        75,
        _sections,
        _key_terms,
        _summary,
        exam_notes=_exam_notes,
    ))

LESSONS = [LESSON_DISCRETE_MATHS]
