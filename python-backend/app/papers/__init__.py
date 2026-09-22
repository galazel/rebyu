"""Importing an official past paper into the question bank.

The modules here were written as one-off scripts for the ITPEC/IPA back
catalogue and then moved in, because the job is not one-off: a new FE and IT
Passport paper is published twice a year, and re-deriving this each time --
including the layout traps that fail silently -- is not work anyone should
repeat.

    subject_a  Subject A / morning papers and IT Passport: four options,
               the common case.
    subject_b  FE Subject B: answer groups up to ten options, program
               listings whose indentation is their meaning.
    figures    Diagrams, tables and picture-options cropped from the page
               and uploaded, because the text layer cannot carry them.
    mapping    Which lesson each question belongs to, by embedding
               similarity against the lessons that already exist.

None of it calls a paid API. The embedding model is the same local MiniLM the
RAG stack runs on CPU.

ATTRIBUTION is not optional and is not a presentation detail. The terms allow
educational reuse without a fee, do not waive copyright, and require the
source shown as (YearSeason, Category, (Subject), Question number) with any
modification stated. `citation()` builds that line and the importer appends it
to the stem itself, so no renderer can drop it by forgetting a field.
"""
