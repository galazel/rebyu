package com.capstone.rebyu.diagram.service;

import com.capstone.rebyu.diagram.dto.DiagramGradingRequestDto;
import com.capstone.rebyu.diagram.dto.DiagramGradingResultDto;
import org.junit.jupiter.api.Test;

import java.math.BigDecimal;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DiagramGradingServiceTest {

    private final DiagramGradingService service = new DiagramGradingService(new DiagramGraphExtractor());

    private static String twoNodeDiagram(String label1, String label2, String edgeLabel, String source, String target) {
        return """
                <mxGraphModel>
                  <root>
                    <mxCell id="0" />
                    <mxCell id="1" parent="0" />
                    <mxCell id="2" value="%s" style="rounded=0;" vertex="1" parent="1">
                      <mxGeometry x="0" y="0" width="80" height="40" as="geometry" />
                    </mxCell>
                    <mxCell id="3" value="%s" style="rounded=0;" vertex="1" parent="1">
                      <mxGeometry x="200" y="0" width="80" height="40" as="geometry" />
                    </mxCell>
                    <mxCell id="4" value="%s" style="edgeStyle=orthogonalEdgeStyle;" edge="1" parent="1"
                        source="%s" target="%s">
                      <mxGeometry relative="1" as="geometry" />
                    </mxCell>
                  </root>
                </mxGraphModel>
                """.formatted(label1, label2, edgeLabel, source, target);
    }

    private static final String REFERENCE = twoNodeDiagram("Student", "Course", "enrolls in 1..*", "2", "3");

    @Test
    void exactStructuralMatchEarnsFullPoints() {
        String learner = twoNodeDiagram("Student", "Course", "enrolls in 1..*", "2", "3");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(REFERENCE, learner, new BigDecimal("10.00")));

        assertEquals("GRADED", result.status());
        assertEquals(0, new BigDecimal("10.00").compareTo(result.earnedPoints()));
    }

    @Test
    void partialMatchWithReversedEdgeDirectionEarnsPartialCredit() {
        String learner = twoNodeDiagram("Student", "Course", "enrolls in 1..*", "3", "2");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(REFERENCE, learner, new BigDecimal("10.00")));

        assertEquals("GRADED", result.status());
        assertTrue(result.earnedPoints().compareTo(BigDecimal.ZERO) > 0,
                "reversed-direction edge should still earn some credit");
        assertTrue(result.earnedPoints().compareTo(new BigDecimal("10.00")) < 0,
                "reversed-direction edge should not earn full credit");
    }

    @Test
    void completelyUnrelatedDiagramEarnsNearZero() {
        String learner = twoNodeDiagram("Payroll System", "Tax Report", "generates", "2", "3");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(REFERENCE, learner, new BigDecimal("10.00")));

        assertEquals("GRADED", result.status());
        assertTrue(result.earnedPoints().compareTo(new BigDecimal("2.00")) < 0,
                "unrelated labels should not earn meaningful credit: got " + result.earnedPoints());
    }

    @Test
    void emptySubmissionEarnsDefinitiveZero() {
        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(REFERENCE, "", new BigDecimal("10.00")));

        assertEquals("EMPTY_SUBMISSION", result.status());
        assertEquals(0, BigDecimal.ZERO.compareTo(result.earnedPoints()));
    }

    @Test
    void unusableReferenceNeverPenalizesTheLearner() {
        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto("", "<mxGraphModel><root><mxCell id=\"0\"/></root></mxGraphModel>",
                        new BigDecimal("10.00")));

        assertEquals("INVALID_REFERENCE", result.status());
        assertNull(result.earnedPoints());
    }

    @Test
    void cardinalityMismatchDowngradesEdgeCredit() {
        String learner = twoNodeDiagram("Student", "Course", "enrolls in 1..1", "2", "3");

        DiagramGradingResultDto fullMatch = service.grade(
                new DiagramGradingRequestDto(REFERENCE, twoNodeDiagram(
                        "Student", "Course", "enrolls in 1..*", "2", "3"), new BigDecimal("10.00")));
        DiagramGradingResultDto mismatched = service.grade(
                new DiagramGradingRequestDto(REFERENCE, learner, new BigDecimal("10.00")));

        assertTrue(mismatched.earnedPoints().compareTo(fullMatch.earnedPoints()) < 0,
                "wrong cardinality should score lower than an exact cardinality match");
    }


    private static String nodesOnlyDiagram(String... labels) {
        StringBuilder xml = new StringBuilder("<mxGraphModel><root>"
                + "<mxCell id=\"0\" /><mxCell id=\"1\" parent=\"0\" />");
        int id = 2;
        for (String label : labels) {
            xml.append("<mxCell id=\"").append(id++).append("\" value=\"").append(label)
                    .append("\" style=\"rounded=0;\" vertex=\"1\" parent=\"1\">")
                    .append("<mxGeometry x=\"0\" y=\"0\" width=\"80\" height=\"40\" as=\"geometry\" /></mxCell>");
        }
        return xml.append("</root></mxGraphModel>").toString();
    }

    private static String parallelEdgeDiagram(String... edgeLabels) {
        StringBuilder xml = new StringBuilder("<mxGraphModel><root>"
                + "<mxCell id=\"0\" /><mxCell id=\"1\" parent=\"0\" />"
                + "<mxCell id=\"2\" value=\"Customer\" style=\"rounded=0;\" vertex=\"1\" parent=\"1\">"
                + "<mxGeometry x=\"0\" y=\"0\" width=\"80\" height=\"40\" as=\"geometry\" /></mxCell>"
                + "<mxCell id=\"3\" value=\"Order\" style=\"rounded=0;\" vertex=\"1\" parent=\"1\">"
                + "<mxGeometry x=\"200\" y=\"0\" width=\"80\" height=\"40\" as=\"geometry\" /></mxCell>");
        int id = 4;
        for (String label : edgeLabels) {
            xml.append("<mxCell id=\"").append(id++).append("\" value=\"").append(label)
                    .append("\" style=\"edgeStyle=orthogonalEdgeStyle;\" edge=\"1\" parent=\"1\" ")
                    .append("source=\"2\" target=\"3\">")
                    .append("<mxGeometry relative=\"1\" as=\"geometry\" /></mxCell>");
        }
        return xml.append("</root></mxGraphModel>").toString();
    }

    @Test
    void anExactlyDrawnElementIsCreditedToTheElementItMatches() {
        String reference = nodesOnlyDiagram("Student Record", "Student");
        String learner = nodesOnlyDiagram("Student");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(reference, learner, new BigDecimal("10.00")));

        assertEquals(0, new BigDecimal("5.00").compareTo(result.earnedPoints()));
        assertEquals(1, result.elementResults().stream()
                .filter(DiagramGradingResultDto.ElementResultDto::matched).count());
        assertTrue(result.elementResults().stream()
                .anyMatch(element -> "Student".equals(element.expectedDescription())
                        && element.matched()
                        && "STRONG".equals(element.matchQuality())));
    }

    @Test
    void oneDrawnRelationshipCannotSatisfyTwoRequiredOnes() {
        String reference = parallelEdgeDiagram("places", "cancels");
        String learner = parallelEdgeDiagram("places");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(reference, learner, new BigDecimal("12.00")));

        List<DiagramGradingResultDto.ElementResultDto> edges = result.elementResults().stream()
                .filter(element -> "EDGE".equals(element.kind()))
                .toList();
        assertEquals(2, edges.size());
        assertEquals(1, edges.stream()
                .filter(DiagramGradingResultDto.ElementResultDto::matched).count());

        assertEquals(0, new BigDecimal("9.00").compareTo(result.earnedPoints()));
    }

    @Test
    void parallelRelationshipsAreMatchedByLabelNotByDocumentOrder() {
        String reference = parallelEdgeDiagram("places", "cancels");
        String learner = parallelEdgeDiagram("cancels", "places");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(reference, learner, new BigDecimal("12.00")));

        assertEquals(0, new BigDecimal("12.00").compareTo(result.earnedPoints()));
        assertTrue(result.elementResults().stream()
                .allMatch(DiagramGradingResultDto.ElementResultDto::matched));
    }


    @Test
    void aMissingElementSaysItWasNotFound() {
        String learner = nodesOnlyDiagram("Student");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(REFERENCE, learner, new BigDecimal("10.00")));

        DiagramGradingResultDto.ElementResultDto course = result.elementResults().stream()
                .filter(element -> "Course".equals(element.expectedDescription()))
                .findFirst().orElseThrow();
        assertFalse(course.matched());
        assertTrue(course.reason().toLowerCase().contains("nothing in your diagram"));
    }

    @Test
    void aWrongCardinalitySaysWhichCardinalityWasExpected() {
        String learner = twoNodeDiagram("Student", "Course", "enrolls in 0..1", "2", "3");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(REFERENCE, learner, new BigDecimal("9.00")));

        DiagramGradingResultDto.ElementResultDto edge = result.elementResults().stream()
                .filter(element -> "EDGE".equals(element.kind()))
                .findFirst().orElseThrow();
        assertTrue(edge.reason().contains("0..1"), edge.reason());
        assertTrue(edge.reason().contains("1..*"), edge.reason());
    }

    @Test
    void aBackwardsRelationshipSaysItPointsTheWrongWay() {
        String learner = twoNodeDiagram("Student", "Course", "enrolls in 1..*", "3", "2");

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(REFERENCE, learner, new BigDecimal("9.00")));

        DiagramGradingResultDto.ElementResultDto edge = result.elementResults().stream()
                .filter(element -> "EDGE".equals(element.kind()))
                .findFirst().orElseThrow();
        assertTrue(edge.matched());
        assertTrue(edge.reason().toLowerCase().contains("opposite way"), edge.reason());
    }
}
