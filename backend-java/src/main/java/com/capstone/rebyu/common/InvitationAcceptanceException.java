package com.capstone.rebyu.common;

import org.springframework.http.HttpStatus;

public class InvitationAcceptanceException extends RuntimeException {

    public enum Code {
        INVALID_TOKEN(HttpStatus.NOT_FOUND),
        INVITATION_EXPIRED(HttpStatus.GONE),
        INVITATION_REVOKED(HttpStatus.GONE),
        ALREADY_ACCEPTED(HttpStatus.CONFLICT),
        EMAIL_MISMATCH(HttpStatus.FORBIDDEN),
        ALREADY_ENROLLED(HttpStatus.CONFLICT),
        NOT_AUTHENTICATED(HttpStatus.UNAUTHORIZED);

        private final HttpStatus status;

        Code(HttpStatus status) {
            this.status = status;
        }

        public HttpStatus status() {
            return status;
        }
    }

    private final Code code;

    public InvitationAcceptanceException(Code code, String message) {
        super(message);
        this.code = code;
    }

    public Code code() {
        return code;
    }

    public HttpStatus status() {
        return code.status();
    }
}
