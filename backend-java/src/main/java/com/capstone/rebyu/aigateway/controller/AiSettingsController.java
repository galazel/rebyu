package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpMethod;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.reactive.function.client.WebClientResponseException;
import org.springframework.web.server.ResponseStatusException;

import java.time.Duration;
import java.util.HashMap;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@RestController
@RequestMapping("/api/ai/settings")
@RequiredArgsConstructor
@Slf4j
public class AiSettingsController {

    private static final ParameterizedTypeReference<Map<String, Object>> JSON_MAP =
            new ParameterizedTypeReference<>() {};

    private final @Qualifier("aiWebClient") WebClient aiWebClient;
    private final CognitoAuthService auth;

    @GetMapping
    public Map<String, Object> read(@AuthenticationPrincipal Jwt jwt) {
        requireAdmin(jwt);
        return call(HttpMethod.GET, "/ai-settings", null);
    }

    @PutMapping(value = "/{task}", consumes = MediaType.APPLICATION_JSON_VALUE)
    public Map<String, Object> choose(
            @AuthenticationPrincipal Jwt jwt,
            @PathVariable String task,
            @RequestBody Map<String, Object> body) {
        CurrentUserDto user = requireAdmin(jwt);
        Map<String, Object> request = new HashMap<>();
        request.put("model", body.get("model"));
        request.put("updatedBy", user.email());
        return call(HttpMethod.PUT, "/ai-settings/" + task, request);
    }

    @DeleteMapping("/{task}")
    public Map<String, Object> reset(@AuthenticationPrincipal Jwt jwt, @PathVariable String task) {
        requireAdmin(jwt);
        return call(HttpMethod.DELETE, "/ai-settings/" + task, null);
    }

    private Map<String, Object> call(HttpMethod method, String path, Object body) {
        try {
            WebClient.RequestBodySpec request = aiWebClient.method(method).uri(path);
            WebClient.RequestHeadersSpec<?> ready = body == null
                    ? request
                    : request.contentType(MediaType.APPLICATION_JSON).bodyValue(body);
            return ready.retrieve().bodyToMono(JSON_MAP).block(Duration.ofSeconds(60));
        } catch (WebClientResponseException error) {
            HttpStatus status = HttpStatus.resolve(error.getStatusCode().value());
            throw new ResponseStatusException(
                    status != null && status.is4xxClientError() ? status : HttpStatus.BAD_GATEWAY,
                    detailOf(error.getResponseBodyAsString()));
        } catch (ResponseStatusException error) {
            throw error;
        } catch (RuntimeException error) {
            log.error("AI settings call failed ({} {})", method, path, error);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The AI service could not be reached: "
                            + (error.getMessage() == null ? "it did not answer in time" : error.getMessage()));
        }
    }

    private static String detailOf(String body) {
        if (body == null || body.isBlank()) return "The AI service gave no explanation.";
        Matcher matcher = Pattern.compile("\"detail\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(body);
        String detail = matcher.find() ? matcher.group(1).replace("\\\"", "\"") : body;
        return detail.length() > 500 ? detail.substring(0, 500) + "..." : detail;
    }

    private CurrentUserDto requireAdmin(Jwt jwt) {
        if (jwt == null) {
            throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Authentication is required.");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        String role = user == null || user.role() == null ? "" : user.role().trim().toUpperCase(Locale.ROOT);
        if (!role.contains("ADMIN")) {
            throw new ResponseStatusException(HttpStatus.FORBIDDEN, "AI settings are restricted to administrators.");
        }
        return user;
    }
}
