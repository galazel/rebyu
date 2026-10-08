package com.capstone.rebyu.bkt.client;

public class BktServiceException extends RuntimeException {

    public BktServiceException(String message, Throwable cause) {
        super(message, cause);
    }

    public BktServiceException(String message) {
        super(message);
    }
}
