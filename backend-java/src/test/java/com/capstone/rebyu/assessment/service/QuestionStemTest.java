package com.capstone.rebyu.assessment.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/** Pairs taken from the question bank on 2026-09-20, when its twins were removed. */
class QuestionStemTest {

    @Test
    void exactCopyIsTheSameQuestion() {
        assertTrue(QuestionStem.sameQuestion("What does PDCA stand for?", "What does  PDCA stand for"));
    }

    @Test
    void smallEditIsTheSameQuestion() {
        assertTrue(QuestionStem.sameQuestion(
                "Which type of requirement defines the specific features, functions, and behaviors expected from a system?",
                "Which type of requirement defines the specific features and behaviors expected from a system?"));
    }

    @Test
    void addedPhraseIsTheSameQuestion() {
        assertTrue(QuestionStem.sameQuestion(
                "Which phase of the PDCA cycle involves implementing a solution on a small scale to minimize risk?",
                "Which phase of the PDCA cycle involves implementing a solution or improvement strategy on a small scale to minimize risk?"));
        assertTrue(QuestionStem.sameQuestion(
                "Which statement accurately reflects the nature of changes within the Waterfall development model?",
                "According to the provided context, which statement accurately reflects the nature of changes within the Waterfall development model?"));
    }

    @Test
    void replacedWordIsADifferentQuestion() {
        assertFalse(QuestionStem.sameQuestion(
                "What does CRM stand for in the context of business management systems?",
                "What does ERP stand for in the context of business management systems?"));
        assertFalse(QuestionStem.sameQuestion(
                "Which of the following best describes the 'Act' phase of the PDCA cycle?",
                "Which of the following best describes the 'Check' phase of the PDCA cycle?"));
    }

    @Test
    void negatedTwinIsADifferentQuestion() {
        assertFalse(QuestionStem.sameQuestion(
                "Which of the following is considered one of the three essential pillars of information security?",
                "Which of the following is NOT considered one of the three essential pillars of information security?"));
    }
}
