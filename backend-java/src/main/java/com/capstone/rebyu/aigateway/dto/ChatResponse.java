package com.capstone.rebyu.aigateway.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatResponse {
    private String reply;
    private String sessionId;

    /**
     * Related videos and links the tutor found for this answer, when it
     * looked any up: {kind: "video"|"link", title, url, source, thumbnail}.
     * Opaque here, carried between the Python service and the browser.
     */
    private List<Map<String, Object>> resources;
}
