package com.capstone.rebyu.common;

import jakarta.persistence.EntityNotFoundException;
import com.capstone.rebyu.aigateway.common.AiProviderRateLimitException;
import com.capstone.rebyu.aigateway.common.InvalidAiGeneratedQuestionException;
import com.capstone.rebyu.aigateway.common.InvalidAiResponseException;
import com.capstone.rebyu.aigateway.client.AiServiceStatusException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.web.context.request.async.AsyncRequestNotUsableException;
import org.springframework.web.multipart.MaxUploadSizeExceededException;
import org.springframework.web.multipart.support.MissingServletRequestPartException;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;

@Slf4j
@RestControllerAdvice
public class GlobalExceptionHandler {

    /**
     * "METHOD /path" of the request being answered, so a warning names the endpoint it came from
     * (an "Admin access is required" line alone cannot be traced to the page that asked).
     * Only the path: query strings can carry ids and search text.
     */
    private static String where() {
        if (org.springframework.web.context.request.RequestContextHolder.getRequestAttributes()
                instanceof org.springframework.web.context.request.ServletRequestAttributes attrs) {
            jakarta.servlet.http.HttpServletRequest request = attrs.getRequest();
            return request.getMethod() + " " + request.getRequestURI();
        }
        return "-";
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<ErrorResponse> handleNotFound(EntityNotFoundException ex) {
        log.warn("[{}] Resource not found: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(HttpStatus.NOT_FOUND.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<ErrorResponse> handleValidation(MethodArgumentNotValidException ex) {
        Map<String, String> fieldErrors = new HashMap<>();
        for (FieldError error : ex.getBindingResult().getFieldErrors()) {
            fieldErrors.put(error.getField(), error.getDefaultMessage());
        }
        log.warn("[{}] Validation failed: {}", where(), fieldErrors);
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), "Validation failed", fieldErrors));
    }

    private static String duplicateValueIn(String cause) {
        int keyAt = cause.indexOf("Key (");
        if (keyAt < 0) return null;

        int valueOpen = cause.indexOf(")=(", keyAt);
        if (valueOpen < 0) return null;

        int valueClose = cause.lastIndexOf(") already exists");
        if (valueClose <= valueOpen) return null;

        return cause.substring(valueOpen + 3, valueClose).trim();
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<ErrorResponse> handleDataIntegrity(DataIntegrityViolationException ex) {
        String cause = ex.getMostSpecificCause().getMessage();
        log.warn("[{}] Data integrity violation: {}", where(), cause);

        String message = "That change conflicts with data that already exists.";

        if (cause != null) {
            String duplicate = duplicateValueIn(cause);
            if (duplicate != null) {
                message = duplicate.isEmpty()
                        ? "That name is already taken. Choose a different one."
                        : "\"" + duplicate + "\" already exists. Choose a different name.";
            } else if (cause.contains("violates foreign key constraint")) {
                message = "That item is still referenced by something else and cannot be changed.";
            } else if (cause.contains("null value in column")) {
                message = "A required field was missing.";
            }
        }

        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(HttpStatus.CONFLICT.value(), message, null));
    }

    @ExceptionHandler(org.springframework.security.access.AccessDeniedException.class)
    public ResponseEntity<ErrorResponse> handleAccessDenied(org.springframework.security.access.AccessDeniedException ex) {
        log.warn("[{}] Access denied: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN)
                .body(new ErrorResponse(HttpStatus.FORBIDDEN.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(IllegalArgumentException.class)
    public ResponseEntity<ErrorResponse> handleIllegalArgument(IllegalArgumentException ex) {
        log.warn("[{}] Illegal argument: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(IllegalStateException.class)
    public ResponseEntity<ErrorResponse> handleIllegalState(IllegalStateException ex) {
        log.warn("[{}] Illegal state: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(HttpStatus.CONFLICT.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(BusinessRuleException.class)
    public ResponseEntity<ErrorResponse> handleBusinessRule(BusinessRuleException ex) {
        log.warn("[{}] Business rule violation: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(HttpStatus.CONFLICT.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(InvitationAcceptanceException.class)
    public ResponseEntity<InvitationErrorResponse> handleInvitationAcceptance(
            InvitationAcceptanceException ex) {
        log.warn("[{}] Invitation acceptance failed [{}]: {}", where(), ex.code(), ex.getMessage());
        return ResponseEntity.status(ex.status())
                .body(new InvitationErrorResponse(
                        ex.status().value(), ex.code().name(), ex.getMessage()));
    }

    @ExceptionHandler(InvalidAiResponseException.class)
    public ResponseEntity<ErrorResponse> handleInvalidAiResponse(InvalidAiResponseException ex) {
        log.warn("[{}] Invalid AI response: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new ErrorResponse(HttpStatus.UNPROCESSABLE_ENTITY.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(InvalidAiGeneratedQuestionException.class)
    public ResponseEntity<ErrorResponse> handleInvalidAiGeneratedQuestion(InvalidAiGeneratedQuestionException ex) {
        log.warn("[{}] Invalid generated question draft: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.UNPROCESSABLE_ENTITY)
                .body(new ErrorResponse(HttpStatus.UNPROCESSABLE_ENTITY.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(AiServiceStatusException.class)
    public ResponseEntity<ErrorResponse> handleAiServiceStatus(AiServiceStatusException ex) {
        log.warn("[{}] AI service refused the request ({}): {}", where(), ex.status(), ex.getMessage());
        return ResponseEntity.status(ex.status())
                .body(new ErrorResponse(ex.status().value(), ex.getMessage(), null));
    }

    @ExceptionHandler(AiProviderRateLimitException.class)
    public ResponseEntity<ErrorResponse> handleAiProviderRateLimit(AiProviderRateLimitException ex) {
        log.warn("[{}] AI provider rate limited generation: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.TOO_MANY_REQUESTS)
                .body(new ErrorResponse(HttpStatus.TOO_MANY_REQUESTS.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(MaxUploadSizeExceededException.class)
    public ResponseEntity<ErrorResponse> handleMaxUploadSize(MaxUploadSizeExceededException ex) {
        log.warn("[{}] Upload too large: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(),
                        "One of the uploaded files exceeds the allowed size limit.",
                        Map.of("files", "One of the uploaded files exceeds the allowed size limit.")));
    }

    @ExceptionHandler({MissingServletRequestParameterException.class, MissingServletRequestPartException.class})
    public ResponseEntity<ErrorResponse> handleMissingRequestPart(Exception ex) {
        log.warn("[{}] Missing request data: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
                .body(new ErrorResponse(HttpStatus.BAD_REQUEST.value(), ex.getMessage(), null));
    }

    @ExceptionHandler(NoSuchKeyException.class)
    public ResponseEntity<ErrorResponse> handleS3NotFound(NoSuchKeyException ex) {
        log.warn("[{}] S3 object not found: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(new ErrorResponse(HttpStatus.NOT_FOUND.value(), "That file could not be found.", null));
    }

    @ExceptionHandler(S3Exception.class)
    public ResponseEntity<ErrorResponse> handleS3Error(S3Exception ex) {
        log.error("[{}] S3 request failed: {}", where(), ex.getMessage(), ex);
        return ResponseEntity.status(HttpStatus.BAD_GATEWAY)
                .body(new ErrorResponse(HttpStatus.BAD_GATEWAY.value(),
                        "The file storage service is unavailable right now.", null));
    }

    @ExceptionHandler(org.springframework.web.server.ResponseStatusException.class)
    public ResponseEntity<ErrorResponse> handleResponseStatus(org.springframework.web.server.ResponseStatusException ex) {
        log.warn("[{}] Request refused ({}): {}", where(), ex.getStatusCode(), ex.getReason());
        return ResponseEntity.status(ex.getStatusCode())
                .body(new ErrorResponse(ex.getStatusCode().value(), ex.getReason(), null));
    }

    @ExceptionHandler(AsyncRequestNotUsableException.class)
    public void handleClientDisconnect(AsyncRequestNotUsableException ex) {
        log.debug("Client disconnected before response was complete");
    }

    /**
     * Written straight to the response, not returned for content negotiation: the lock is usually
     * hit on the streaming tutor endpoint, whose request may accept only text/event-stream, and a
     * negotiated JSON body then fails with HttpMediaTypeNotAcceptableException -- the learner got a
     * bodiless 406 instead of the lock screen.
     */
    @ExceptionHandler(com.capstone.rebyu.aigateway.common.TutorLockedException.class)
    public void handleTutorLocked(
            com.capstone.rebyu.aigateway.common.TutorLockedException ex,
            jakarta.servlet.http.HttpServletResponse response) throws java.io.IOException {
        String json = "{\"status\":" + HttpStatus.LOCKED.value()
                + ",\"code\":\"" + jsonEscape(com.capstone.rebyu.aigateway.common.TutorLockedException.CODE) + "\""
                + ",\"message\":\"" + jsonEscape(ex.getMessage()) + "\""
                + ",\"lockedUntil\":\"" + jsonEscape(ex.getLockedUntil().toString()) + "\"}";
        response.setStatus(HttpStatus.LOCKED.value());
        response.setContentType("application/json");
        response.setCharacterEncoding("UTF-8");
        response.getWriter().write(json);
    }

    private static String jsonEscape(String value) {
        if (value == null) return "";
        StringBuilder out = new StringBuilder(value.length() + 8);
        for (char c : value.toCharArray()) {
            switch (c) {
                case '"' -> out.append("\\\"");
                case '\\' -> out.append("\\\\");
                case '\n' -> out.append("\\n");
                case '\r' -> out.append("\\r");
                case '\t' -> out.append("\\t");
                default -> {
                    if (c < 0x20) out.append(String.format("\\u%04x", (int) c));
                    else out.append(c);
                }
            }
        }
        return out.toString();
    }

    @ExceptionHandler(com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException.class)
    public ResponseEntity<java.util.Map<String, Object>> handlePremiumAccess(
            com.capstone.rebyu.billing.entitlement.PremiumAccessRequiredException ex) {
        log.debug("Premium access required for feature {}", ex.getFeature());
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("code", ex.getCode());
        body.put("feature", ex.getFeature());
        body.put("message", ex.getMessage());
        body.put("eligiblePlan", ex.getEligiblePlan());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(com.capstone.rebyu.billing.entitlement.InstitutionalEntitlementRequiredException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleInstitutionalEntitlement(
            com.capstone.rebyu.billing.entitlement.InstitutionalEntitlementRequiredException ex) {
        log.debug("Institutional entitlement required for feature {}", ex.getFeature());
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("status", HttpStatus.FORBIDDEN.value());
        body.put("code", ex.getCode());
        body.put("feature", ex.getFeature());
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.FORBIDDEN).body(body);
    }

    @ExceptionHandler(com.capstone.rebyu.billing.entitlement.CapacityLimitReachedException.class)
    public ResponseEntity<java.util.Map<String, Object>> handleCapacityLimit(
            com.capstone.rebyu.billing.entitlement.CapacityLimitReachedException ex) {
        log.debug("Capacity limit reached: {} ({}/{})", ex.getCode(), ex.getUsed(), ex.getLimit());
        java.util.Map<String, Object> body = new java.util.LinkedHashMap<>();
        body.put("status", HttpStatus.CONFLICT.value());
        body.put("code", ex.getCode());
        body.put("limit", ex.getLimit());
        body.put("used", ex.getUsed());
        body.put("message", ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT).body(body);
    }

    /**
     * Two requests changed the same row at once (e.g. a pause racing a submit) and the @Version
     * check rejected the later one. Nothing was half-saved: ask the user to retry, in words.
     */
    @ExceptionHandler(org.springframework.orm.ObjectOptimisticLockingFailureException.class)
    public ResponseEntity<ErrorResponse> handleConcurrentUpdate(
            org.springframework.orm.ObjectOptimisticLockingFailureException ex) {
        log.warn("[{}] Concurrent update rejected: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(new ErrorResponse(HttpStatus.CONFLICT.value(),
                        "This was changed by another action at the same moment. Please try again.", null));
    }

    /**
     * The AI service could not be reached at all -- typically while its container restarts.
     * A short, expected outage: one warning line and a 503, not a stack trace per poll.
     */
    @ExceptionHandler(com.capstone.rebyu.aigateway.client.AiServiceException.class)
    public ResponseEntity<ErrorResponse> handleAiService(com.capstone.rebyu.aigateway.client.AiServiceException ex) {
        if (!isUnreachable(ex)) {
            return handleGeneric(ex);
        }
        log.warn("[{}] AI service unreachable: {}", where(), ex.getMessage());
        return ResponseEntity.status(HttpStatus.SERVICE_UNAVAILABLE)
                .body(new ErrorResponse(HttpStatus.SERVICE_UNAVAILABLE.value(),
                        "The AI service is starting up or unreachable. Please try again in a minute.", null));
    }

    private static boolean isUnreachable(Throwable error) {
        for (Throwable cause = error; cause != null && cause.getCause() != cause; cause = cause.getCause()) {
            if (cause instanceof java.net.ConnectException
                    || cause instanceof java.net.UnknownHostException
                    || cause instanceof java.nio.channels.UnresolvedAddressException) {
                return true;
            }
        }
        return false;
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<ErrorResponse> handleGeneric(Exception ex) {
        log.error("[{}] Unexpected error: {}", where(), ex.getMessage(), ex);
        // Never the exception's own text: it carried SQL, table and column names to the browser.
        // The full detail is in the server log above.
        return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                .body(new ErrorResponse(HttpStatus.INTERNAL_SERVER_ERROR.value(),
                        "Something went wrong on our side. Please try again.", null));
    }

    public record ErrorResponse(int status, String message, Map<String, String> fieldErrors) {
        private static final LocalDateTime timestamp = LocalDateTime.now();
    }

    public record InvitationErrorResponse(int status, String errorCode, String message) {
    }
}
