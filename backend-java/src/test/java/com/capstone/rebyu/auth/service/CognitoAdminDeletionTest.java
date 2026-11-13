package com.capstone.rebyu.auth.service;

import com.capstone.rebyu.notification.service.EmailService;
import com.sun.net.httpserver.HttpServer;
import org.junit.jupiter.api.Test;
import java.net.InetSocketAddress;
import java.util.concurrent.atomic.AtomicInteger;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.mock;

class CognitoAdminDeletionTest {
    @Test void providerFailureIsRetryableAndAlreadyDeletedIsSuccessful() throws Exception {
        var status = new AtomicInteger(503);
        var server = HttpServer.create(new InetSocketAddress("127.0.0.1", 0), 0);
        server.createContext("/auth/v1/admin/users/subject", exchange -> {
            assertEquals("DELETE", exchange.getRequestMethod());
            exchange.sendResponseHeaders(status.get(), -1);
            exchange.close();
        });
        server.start();
        try {
            var service = new CognitoAdminService("http://127.0.0.1:" + server.getAddress().getPort(),
                    "test-only-key", "http://localhost", mock(EmailService.class));
            assertThrows(IllegalStateException.class, () -> service.deleteAccount("subject"));
            status.set(404);
            assertDoesNotThrow(() -> service.deleteAccount("subject"));
            status.set(204);
            assertDoesNotThrow(() -> service.deleteAccount("subject"));
        } finally { server.stop(0); }
    }
}
