/** @vitest-environment node */
// TC-148: Seat exhaustion
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-148: Seat exhaustion", async (context) => {
  if (!nativeEnabled) {
    context.skip("Requires Java/Maven dependencies; run npm run test:native.")
    return
  }
  await runJavaTests("AiChatServiceTest#catalogCase", {
    source: "aigateway/service/AiChatServiceTest.java",
    append:
      'var certRepo = mock(com.capstone.rebyu.institution.repository.InstitutionCertificateRepository.class);\nvar invites = mock(com.capstone.rebyu.notification.repository.LearnerInvitationRepository.class);\nvar emailClient = mock(com.capstone.rebyu.notification.service.EmailService.class);\nvar tokens = mock(com.capstone.rebyu.notification.service.InvitationTokenService.class);\nvar departments = mock(com.capstone.rebyu.department.repository.DepartmentRepository.class);\nvar leaders = mock(com.capstone.rebyu.department.repository.DepartmentHeadAssignmentRepository.class);\nvar users = mock(com.capstone.rebyu.user.repository.UserRepository.class);\nvar notifications = mock(com.capstone.rebyu.notification.service.NotificationService.class);\nvar sections = mock(com.capstone.rebyu.department.repository.InstitutionSectionRepository.class);\nvar guard = mock(com.capstone.rebyu.institution.service.SchoolMembershipGuard.class);\nvar invitationService = new com.capstone.rebyu.partnership.service.InstitutionInvitationService(certRepo,invites,emailClient,tokens,departments,leaders,users,notifications,sections,guard);\nvar institution = new com.capstone.rebyu.institution.entity.Institution();\ninstitution.setInstitutionId(1L); institution.setInstitutionName("Test School");\nvar certification = new com.capstone.rebyu.certification.entity.Certification();\ncertification.setCertificationId(2L); certification.setTitle("Networking");\nvar allocation = new com.capstone.rebyu.institution.entity.InstitutionCertificate();\nallocation.setInstitutionCertId(3L); allocation.setInstitution(institution); allocation.setCertification(certification);\nallocation.setStatus(com.capstone.rebyu.institution.entity.InstitutionCertificate.Status.active);\nallocation.setTotalSlots(10); allocation.setUsedSlots(0);\nvar group = new com.capstone.rebyu.department.entity.Department();\ngroup.setDepartmentId(4L); group.setDepartmentName("Computing"); group.setInstitution(institution);\ngroup.setInstitutionCerts(new java.util.ArrayList<>(java.util.List.of(allocation))); group.setTotalSlots(10);group.setUsedSlots(0);\nwhen(departments.findById(4L)).thenReturn(java.util.Optional.of(group));\nwhen(leaders.existsByDepartmentAndUserAndStatus(any(),any(),any())).thenReturn(true);\nwhen(guard.otherSchool(anyString(),anyLong())).thenReturn(java.util.Optional.empty());\nvar request = new com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.SendInvitationsRequest(1L,9L,4L,java.util.List.of(new com.capstone.rebyu.partnership.dto.InstitutionInvitationDtos.InvitedLearner("Ivan","Cortes","ivan@example.test")),null,3L);\nallocation.setTotalSlots(0);\nassertThrows(com.capstone.rebyu.common.BusinessRuleException.InvalidPartnershipRequestException.class,()->invitationService.sendInvitations(request));\nverify(invites,never()).save(any());',
  })
}, 240000)
