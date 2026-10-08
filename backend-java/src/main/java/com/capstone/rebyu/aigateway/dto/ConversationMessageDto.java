package com.capstone.rebyu.aigateway.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ConversationMessageDto {
    private String role;
    private String content;

    private Map<String, Object> action;

    private List<Map<String, Object>> resources;
    private Map<String, Object> snippet;
}
