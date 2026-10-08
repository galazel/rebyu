package com.capstone.rebyu.aigateway.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;
import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class ChatRequest {

    @NotBlank
    private String message;

    @NotBlank
    private String sessionId;

    // Boxed so @NotNull applies correctly; @NotBlank is invalid on numeric types.
    @NotNull
    private String lessonName;

    // Nullable: older callers (or a tutor opened outside a lesson) still work,
    // just without the AI grounding its answer in the lesson's content.
    private Long lessonId;

    // Optional: the part of the lesson the question is about -- text the
    // learner selected or snipped -- passed through to the AI service.
    @Size(max = 6000)
    private String quote;

    // Optional: a snipped region of the lesson as a data URL. The browser
    // shrinks it before sending; this bound only stops a runaway body.
    @Size(max = 4_000_000)
    @Pattern(regexp = "^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$",
            message = "The picture must be a PNG, JPEG or WebP image.")
    private String image;

    // Where the snipped picture was stored. Set by the server only (any value
    // the browser sends is discarded), passed on so the conversation keeps it.
    private String imageKey;
}
