package com.capstone.rebyu.assessment.service;

import com.capstone.rebyu.assessment.entity.Choice;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.assertj.core.api.Assertions.assertThat;

class ChoiceShuffleTest {

    private static List<Choice> choices(String... texts) {
        return java.util.Arrays.stream(texts).map(t -> Choice.builder().choiceText(t).build()).toList();
    }

    @Test
    void ordinaryChoicesShuffle() {
        assertThat(AssessmentAttemptService.choicesCanShuffle(
                choices("TCP", "UDP", "ICMP", "ARP"))).isTrue();
        assertThat(AssessmentAttemptService.choicesCanShuffle(
                choices("A router forwards packets", "A switch learns MAC addresses",
                        "Both are layer 2 devices", "Only one of them uses IP"))).isTrue();
    }

    @Test
    void choicesNamingOtherChoicesKeepTheirOrder() {
        assertThat(AssessmentAttemptService.choicesCanShuffle(
                choices("TCP", "UDP", "ICMP", "All of the above"))).isFalse();
        assertThat(AssessmentAttemptService.choicesCanShuffle(
                choices("A and B", "B and C", "C and A", "A, B and C"))).isFalse();
        assertThat(AssessmentAttemptService.choicesCanShuffle(
                choices("(a) and (c)", "(a) and (d)", "(b) and (c)", "(b) and (d)"))).isFalse();
        assertThat(AssessmentAttemptService.choicesCanShuffle(
                choices("Option A is wrong", "x", "y", "z"))).isFalse();
    }
}
