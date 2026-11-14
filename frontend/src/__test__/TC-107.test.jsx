/** @vitest-environment node */
// TC-107: Guided dialogue action
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit assertions; generated fixture overlays remain inside frontend.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-107: Guided dialogue action", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not executed by frontend tests."
    )
    return
  }
  await runJavaTests("AiChatServiceTest#catalogCase", {
    source: "aigateway/service/AiChatServiceTest.java",
    append:
      'var authClient = mock(com.capstone.rebyu.auth.service.CognitoAuthService.class);\nvar entitlementClient = mock(com.capstone.rebyu.billing.service.LearnerEntitlementService.class);\nvar dialogueClient = mock(com.capstone.rebyu.aigateway.client.AiServiceClient.class);\nvar sessionRepository = mock(com.capstone.rebyu.aigateway.repository.LessonDialogueSessionRepository.class);\nvar quotaClient = mock(com.capstone.rebyu.billing.service.AiGenerationQuotaService.class);\nvar conductClient = mock(com.capstone.rebyu.aigateway.service.TutorConductService.class);\nvar jwt = mock(org.springframework.security.oauth2.jwt.Jwt.class);\nwhen(jwt.getTokenValue()).thenReturn("test-token");\nwhen(authClient.syncCurrentUser(jwt, "test-token")).thenReturn(new com.capstone.rebyu.auth.dto.CurrentUserDto(1L,"test@example.test","ADMIN",null,null,null,"Ivan","Cortes","Ivan",null));\nvar controller = new com.capstone.rebyu.aigateway.controller.TutorDialogueController(dialogueClient,authClient,entitlementClient,sessionRepository,quotaClient,conductClient);\nassertThrows(IllegalArgumentException.class,()->controller.turn(jwt,new com.capstone.rebyu.aigateway.controller.TutorDialogueController.TurnRequest("invalid",7L,"Networking",java.util.List.of(),java.util.List.of(),java.util.List.of())));\nverifyNoInteractions(dialogueClient);',
  })
}, 240000)
