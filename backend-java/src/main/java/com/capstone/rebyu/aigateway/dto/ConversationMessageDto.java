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

    /**
     * Only present on a generated quiz/flashcard turn -- the payload the
     * tutor UI rebuilds its "Take the quiz" card from. Opaque here: this
     * gateway just carries it between the browser and the Python service.
     */
    private Map<String, Object> action;

    /**
     * Related videos and links the tutor found for this answer, when it
     * looked any up: {kind: "video"|"link", title, url, source, thumbnail}.
     * Opaque here, carried between the Python service and the browser.
     */
    private List<Map<String, Object>> resources;
    /**
     * On a learner's question about part of the lesson: {quote, image,
     * imageKey}. imageKey is the stored snip (see AiChatController), viewable
     * only by its owner. Opaque here, carried from the Python service.
     */
    private Map<String, Object> snippet;
}
