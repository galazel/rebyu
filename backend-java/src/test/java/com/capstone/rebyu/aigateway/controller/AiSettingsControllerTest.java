package com.capstone.rebyu.aigateway.controller;

import com.capstone.rebyu.aigateway.service.ElevenLabsSettingsService;
import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import org.junit.jupiter.api.Test;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.server.ResponseStatusException;
import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

class AiSettingsControllerTest {
    private final CognitoAuthService auth = mock(CognitoAuthService.class);
    private final ElevenLabsSettingsService provider = mock(ElevenLabsSettingsService.class);
    private final AiSettingsController controller = new AiSettingsController(null, auth, provider);
    @Test void unauthenticatedCannotReadAccountBalance() {
        assertEquals(401, assertThrows(ResponseStatusException.class, () -> controller.liveTutor(null)).getStatusCode().value()); verifyNoInteractions(provider);
    }
    @Test void learnersAndInstitutionAdminsCannotChangeGlobalSettings() {
        var jwt = Jwt.withTokenValue("test").header("alg", "none").subject("user").build();
        for (String role : new String[]{"LEARNER", "INSTITUTION_ADMIN"}) {
            when(auth.syncCurrentUser(jwt, "test")).thenReturn(new CurrentUserDto(1L, "", role, 9L, null, null, "", "", "", ""));
            assertEquals(403, assertThrows(ResponseStatusException.class, () -> controller.updateLiveTutor(jwt, null)).getStatusCode().value());
        }
        verifyNoInteractions(provider);
    }
}
