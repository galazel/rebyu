/** @vitest-environment node */
// TC-108: Dialogue history limit
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit assertions; generated fixture overlays remain inside frontend.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-108: Dialogue history limit", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not executed by frontend tests."
    )
    return
  }
  await runJavaTests("AiChatServiceTest#catalogCase", {
    source: "aigateway/service/AiChatServiceTest.java",
    append:
      'var authClient = mock(com.capstone.rebyu.auth.service.CognitoAuthService.class);\nvar entitlementClient = mock(com.capstone.rebyu.billing.service.LearnerEntitlementService.class);\nvar dialogueClient = mock(com.capstone.rebyu.aigateway.client.AiServiceClient.class);\nvar sessionRepository = mock(com.capstone.rebyu.aigateway.repository.LessonDialogueSessionRepository.class);\nvar quotaClient = mock(com.capstone.rebyu.billing.service.AiGenerationQuotaService.class);\nvar conductClient = mock(com.capstone.rebyu.aigateway.service.TutorConductService.class);\nvar jwt = mock(org.springframework.security.oauth2.jwt.Jwt.class);\nwhen(jwt.getTokenValue()).thenReturn("test-token");\nwhen(authClient.syncCurrentUser(jwt, "test-token")).thenReturn(new com.capstone.rebyu.auth.dto.CurrentUserDto(1L,"test@example.test","ADMIN",null,null,null,"Ivan","Cortes","Ivan",null));\nvar controller = new com.capstone.rebyu.aigateway.controller.TutorDialogueController(dialogueClient,authClient,entitlementClient,sessionRepository,quotaClient,conductClient);\nwhen(dialogueClient.tutorDialogue(anyMap())).thenReturn(java.util.Map.of("reply","Hello"));\nvar history = new java.util.ArrayList<java.util.Map<String,Object>>();\nfor(int i=0;i<50;i++) history.add(java.util.Map.of("role","learner","content","message-"+i));\ncontroller.turn(jwt,new com.capstone.rebyu.aigateway.controller.TutorDialogueController.TurnRequest("start",7L,"Networking",java.util.List.of(),history,java.util.List.of()));\nverify(dialogueClient).tutorDialogue(argThat(body->((java.util.List<?>)body.get("history")).size()==40 && ((java.util.Map<?,?>)((java.util.List<?>)body.get("history")).get(0)).get("content").equals("message-10")));',
  })
}, 240000)
