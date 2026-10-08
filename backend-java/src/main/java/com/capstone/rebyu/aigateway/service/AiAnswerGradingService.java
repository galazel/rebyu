package com.capstone.rebyu.aigateway.service;

import com.capstone.rebyu.aigateway.client.AiServiceClient;
import com.capstone.rebyu.aigateway.dto.AnswerGradingRequestDto;
import com.capstone.rebyu.aigateway.dto.AnswerGradingResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
@RequiredArgsConstructor
public class AiAnswerGradingService {

    private final AiServiceClient aiServiceClient;

    public Optional<AnswerGradingResultDto> grade(AnswerGradingRequestDto request) {
        return aiServiceClient.gradeAnswer(request);
    }
}
