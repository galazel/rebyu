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

    @NotNull
    private String lessonName;

    private Long lessonId;

    @Size(max = 6000)
    private String quote;

    @Size(max = 4_000_000)
    @Pattern(regexp = "^data:image/(png|jpeg|webp);base64,[A-Za-z0-9+/=]+$",
            message = "The picture must be a PNG, JPEG or WebP image.")
    private String image;

    private String imageKey;
}
