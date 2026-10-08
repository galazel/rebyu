package com.capstone.rebyu.notification.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

class InvitationTokenServiceTest {

    private final InvitationTokenService service = new InvitationTokenService();

    @Test
    void rawTokensAreUniqueAndUrlSafe() {
        String a = service.generateRawToken();
        String b = service.generateRawToken();
        assertNotEquals(a, b);
        assertTrue(a.matches("[A-Za-z0-9_-]+"), "token must be URL-safe: " + a);
        assertFalse(a.contains("="), "token must not contain padding");
    }

    @Test
    void hashIsDeterministicAndSixtyFourHexChars() {
        String raw = service.generateRawToken();
        String h1 = service.hashToken(raw);
        String h2 = service.hashToken(raw);
        assertEquals(h1, h2, "same input must hash to the same value");
        assertEquals(64, h1.length(), "SHA-256 hex must be 64 chars");
        assertTrue(h1.matches("[0-9a-f]{64}"));
    }

    @Test
    void differentTokensHashDifferently() {
        assertNotEquals(
                service.hashToken(service.generateRawToken()),
                service.hashToken(service.generateRawToken()));
    }

    @Test
    void knownVectorMatchesSha256() {
        assertEquals(
                "2cf24dba5fb0a30e26e83b2ac5b9e29e1b161e5c1fa7425e73043362938b9824",
                service.hashToken("hello"));
    }

    @Test
    void fingerprintIsEightHexCharsAndNotTheRawToken() {
        String raw = service.generateRawToken();
        String fp = service.fingerprint(raw);
        assertEquals(8, fp.length());
        assertFalse(raw.contains(fp) && raw.length() == fp.length());
        assertTrue(fp.matches("[0-9a-f]{8}"));
    }

    @Test
    void blankTokenRejected() {
        assertThrows(IllegalArgumentException.class, () -> service.hashToken(""));
        assertThrows(IllegalArgumentException.class, () -> service.hashToken(null));
    }
}
