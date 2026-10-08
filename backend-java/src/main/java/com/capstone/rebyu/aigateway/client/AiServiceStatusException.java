package com.capstone.rebyu.aigateway.client;

import org.springframework.http.HttpStatus;

public class AiServiceStatusException extends RuntimeException {

    private final HttpStatus status;

    public AiServiceStatusException(HttpStatus status, String message) {
        super(message);
        this.status = status;
    }

    public HttpStatus status() {
        return status;
    }
}
