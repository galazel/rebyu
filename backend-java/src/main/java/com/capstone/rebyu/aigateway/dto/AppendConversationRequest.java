package com.capstone.rebyu.aigateway.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class AppendConversationRequest {

    @NotBlank
    private String sessionId;

    private List<ConversationMessageDto> messages;
}
