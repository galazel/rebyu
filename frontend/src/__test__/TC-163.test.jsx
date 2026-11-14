/** @vitest-environment node */
// TC-163: Verified payment
// Catalog: frontend/REBYU_UNIT_TEST_CASES.txt
// Scope note: Native JUnit assertions; generated fixture overlays remain inside frontend.
import { test } from "vitest"
import { nativeEnabled, runJavaTests } from "./support/native.js"

test("TC-163: Verified payment", async (context) => {
  if (!nativeEnabled) {
    context.skip(
      "Requires Java/Maven dependencies; run npm run test:native. Not executed by frontend tests."
    )
    return
  }
  await runJavaTests("EnrollmentTransactionServiceTest#catalogCase", {
    source: "enrollment/service/EnrollmentTransactionServiceTest.java",
    append:
      'LearnerOrder order = LearnerOrder.builder().orderId(11L).orderNumber("ORD-PAID").learner(learner).orderedAt(LocalDateTime.now()).totalAmount(new BigDecimal("1500")).status(LearnerOrder.Status.pending).build();\nLearnerOrderDetail detail = LearnerOrderDetail.builder().orderDetailId(21L).order(order).certification(certification).price(new BigDecimal("1500")).build();\nwhen(orderRepository.findById(11L)).thenReturn(Optional.of(order));\nwhen(orderDetailRepository.findByOrder_OrderId(11L)).thenReturn(java.util.List.of(detail));\nwhen(paymentVerificationService.verify(order,"VERIFIED")).thenReturn(true);\nwhen(enrollmentRepository.save(any())).thenAnswer(inv->{LearnerCertification row=inv.getArgument(0);row.setLearnerCertificationId(30L);return row;});\nvar result = service.confirmPayment(11L,2L,"VERIFIED");\nassertEquals("completed",result.status());\nassertEquals(30L,result.enrollmentId());\nverify(enrollmentRepository,times(1)).save(any());',
  })
}, 240000)
