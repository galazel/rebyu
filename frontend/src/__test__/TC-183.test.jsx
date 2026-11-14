/** @vitest-environment node */
// TC-183: Moderation authorization
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native service unit-test assertions; opt-in Java execution.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-183: Moderation authorization", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not a frontend pass."
    )
    return
  }
  await runJavaTests("CommunityServiceTest#catalogCase", {
    source: "community/CommunityServiceTest.java",
    append:
      'var authClient = mock(com.capstone.rebyu.auth.service.CognitoAuthService.class);\nvar jwt = mock(org.springframework.security.oauth2.jwt.Jwt.class);\nwhen(jwt.getTokenValue()).thenReturn("token");\nwhen(authClient.syncCurrentUser(jwt,"token")).thenReturn(new com.capstone.rebyu.auth.dto.CurrentUserDto(1L,"test@example.test","LEARNER",1L,null,null,"Ivan","Cortes","Ivan",null));\nvar moderation = new AdminCommunityModerationController(service,authClient);\nassertThrows(IllegalArgumentException.class,()->moderation.reports(null,jwt));\nverify(reportRepository,never()).findAll();',
  })
}, 240000)
