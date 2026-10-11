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


    private static final String ERD_REFERENCE = """
            <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
              <mxCell id="t" value="Library ERD (model answer)" style="text;html=1;" vertex="1" parent="1">
                <mxGeometry x="0" y="0" width="300" height="20" as="geometry"/></mxCell>
              <mxCell id="2" value="Member" style="swimlane;html=1;" vertex="1" parent="1">
                <mxGeometry x="0" y="40" width="180" height="90" as="geometry"/></mxCell>
              <mxCell id="21" value="PK memberId: int" style="text;html=1;" vertex="1" parent="2">
                <mxGeometry y="26" width="180" height="15" as="geometry"/></mxCell>
              <mxCell id="22" value="name: String" style="text;html=1;" vertex="1" parent="2">
                <mxGeometry y="41" width="180" height="15" as="geometry"/></mxCell>
              <mxCell id="3" value="Loan" style="swimlane;html=1;" vertex="1" parent="1">
                <mxGeometry x="300" y="40" width="180" height="90" as="geometry"/></mxCell>
              <mxCell id="31" value="PK loanId: int" style="text;html=1;" vertex="1" parent="3">
                <mxGeometry y="26" width="180" height="15" as="geometry"/></mxCell>
              <mxCell id="32" value="FK memberId: int" style="text;html=1;" vertex="1" parent="3">
                <mxGeometry y="41" width="180" height="15" as="geometry"/></mxCell>
              <mxCell id="4" value="borrows 1..*" edge="1" parent="1" source="2" target="3">
                <mxGeometry relative="1" as="geometry"/></mxCell>
            </root></mxGraphModel>
            """;

    private static String erdAsTables(String memberAttribute, String loanAttribute, boolean withRelationship) {
        return """
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="a" value="Member" style="shape=table;" vertex="1" parent="1">
                    <mxGeometry x="0" y="0" width="180" height="90" as="geometry"/></mxCell>
                  <mxCell id="ar1" value="" style="shape=tableRow;" vertex="1" parent="a">
                    <mxGeometry y="30" width="180" height="30" as="geometry"/></mxCell>
                  <mxCell id="ar1k" value="PK" style="shape=partialRectangle;" vertex="1" parent="ar1">
                    <mxGeometry width="40" height="30" as="geometry"/></mxCell>
                  <mxCell id="ar1n" value="memberId" style="shape=partialRectangle;" vertex="1" parent="ar1">
                    <mxGeometry x="40" width="140" height="30" as="geometry"/></mxCell>
                  <mxCell id="ar2" value="" style="shape=tableRow;" vertex="1" parent="a">
                    <mxGeometry y="60" width="180" height="30" as="geometry"/></mxCell>
                  <mxCell id="ar2n" value="%s" style="shape=partialRectangle;" vertex="1" parent="ar2">
                    <mxGeometry x="40" width="140" height="30" as="geometry"/></mxCell>
                  <mxCell id="b" value="Loan" style="shape=table;" vertex="1" parent="1">
                    <mxGeometry x="300" y="0" width="180" height="90" as="geometry"/></mxCell>
                  <mxCell id="br1" value="" style="shape=tableRow;" vertex="1" parent="b">
                    <mxGeometry y="30" width="180" height="30" as="geometry"/></mxCell>
                  <mxCell id="br1n" value="loanId (PK)" style="shape=partialRectangle;" vertex="1" parent="br1">
                    <mxGeometry x="40" width="140" height="30" as="geometry"/></mxCell>
                  <mxCell id="br2" value="" style="shape=tableRow;" vertex="1" parent="b">
                    <mxGeometry y="60" width="180" height="30" as="geometry"/></mxCell>
                  <mxCell id="br2n" value="%s" style="shape=partialRectangle;" vertex="1" parent="br2">
                    <mxGeometry x="40" width="140" height="30" as="geometry"/></mxCell>
                  %s
                </root></mxGraphModel>
                """.formatted(memberAttribute, loanAttribute, withRelationship
                ? "<mxCell id=\"e\" value=\"borrows 1..*\" edge=\"1\" parent=\"1\" source=\"a\" target=\"b\">"
                        + "<mxGeometry relative=\"1\" as=\"geometry\"/></mxCell>"
                : "");
    }

    @Test
    void aCorrectErdDrawnAsDrawIoTablesEarnsFullPoints() {
        DiagramGradingResultDto result = service.grade(new DiagramGradingRequestDto(
                ERD_REFERENCE, erdAsTables("name", "FK memberId", true), new BigDecimal("10.00")));

        assertEquals(0, new BigDecimal("10.00").compareTo(result.earnedPoints()), result.feedback());
        assertTrue(result.coversEveryPart());
    }

    @Test
    void theRightEntitiesWithWrongAttributesAreNotCorrect() {
        DiagramGradingResultDto result = service.grade(new DiagramGradingRequestDto(
                ERD_REFERENCE, erdAsTables("favouriteColour", "dueDate", true), new BigDecimal("10.00")));

        assertTrue(result.earnedPoints().compareTo(new BigDecimal("10.00")) < 0);
        assertTrue(result.elementResults().stream()
                .anyMatch(e -> "ATTRIBUTE".equals(e.kind()) && !e.matched()
                        && e.expectedDescription().contains("name")));
    }

    @Test
    void aForeignKeyLeftUnmarkedLosesCredit() {
        DiagramGradingResultDto marked = service.grade(new DiagramGradingRequestDto(
                ERD_REFERENCE, erdAsTables("name", "FK memberId", true), new BigDecimal("10.00")));
        DiagramGradingResultDto unmarked = service.grade(new DiagramGradingRequestDto(
                ERD_REFERENCE, erdAsTables("name", "memberId", true), new BigDecimal("10.00")));

        assertTrue(unmarked.earnedPoints().compareTo(marked.earnedPoints()) < 0);
    }

    @Test
    void anErdWithEveryRelationshipLeftOutDoesNotCoverEveryPart() {
        DiagramGradingResultDto result = service.grade(new DiagramGradingRequestDto(
                ERD_REFERENCE, erdAsTables("name", "FK memberId", false), new BigDecimal("10.00")));

        assertFalse(result.coversEveryPart());
    }

    @Test
    void sequenceMessagesDrawnBetweenLifelinesByPositionAreGraded() {
        String reference = """
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="2" value="Customer" style="shape=umlLifeline;" vertex="1" parent="1">
                    <mxGeometry x="40" y="100" width="140" height="500" as="geometry"/></mxCell>
                  <mxCell id="3" value=":OrderService" style="shape=umlLifeline;" vertex="1" parent="1">
                    <mxGeometry x="240" y="100" width="140" height="500" as="geometry"/></mxCell>
                  <mxCell id="4" value="1: placeOrder()" edge="1" parent="1">
                    <mxGeometry relative="1" as="geometry">
                      <mxPoint x="110" y="200" as="sourcePoint"/><mxPoint x="310" y="200" as="targetPoint"/>
                    </mxGeometry></mxCell>
                </root></mxGraphModel>
                """;
        String noMessages = reference.replaceAll("(?s)<mxCell id=\"4\".*?</mxCell>", "");

        DiagramGradingResultDto full = service.grade(
                new DiagramGradingRequestDto(reference, reference, new BigDecimal("9.00")));
        DiagramGradingResultDto missing = service.grade(
                new DiagramGradingRequestDto(reference, noMessages, new BigDecimal("9.00")));

        assertTrue(full.elementResults().stream().anyMatch(e -> "EDGE".equals(e.kind()) && e.matched()));
        assertEquals(0, new BigDecimal("9.00").compareTo(full.earnedPoints()));
        assertFalse(missing.coversEveryPart());
    }

    @Test
    void aClassDrawnAsOneBoxWithADividerLineIsReadRowByRow() {
        String reference = """
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="2" value="Vehicle" style="swimlane;html=1;" vertex="1" parent="1">
                    <mxGeometry x="0" y="0" width="200" height="80" as="geometry"/></mxCell>
                  <mxCell id="21" value="- registrationNo: String" style="text;html=1;" vertex="1" parent="2">
                    <mxGeometry y="26" width="200" height="15" as="geometry"/></mxCell>
                  <mxCell id="22" value="+ needsMaintenance(): boolean" style="text;html=1;" vertex="1" parent="2">
                    <mxGeometry y="41" width="200" height="15" as="geometry"/></mxCell>
                </root></mxGraphModel>
                """;
        String learner = """
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="9" value="Vehicle&#10;─────&#10;registrationNo&#10;needsMaintenance()"
                      style="rounded=0;" vertex="1" parent="1">
                    <mxGeometry x="0" y="0" width="200" height="80" as="geometry"/></mxCell>
                </root></mxGraphModel>
                """;

        DiagramGradingResultDto result = service.grade(
                new DiagramGradingRequestDto(reference, learner, new BigDecimal("10.00")));

        assertEquals(0, new BigDecimal("10.00").compareTo(result.earnedPoints()), result.feedback());
    }

    private static String pair(String sourceLabel, String sourceStyle, String targetLabel, String targetStyle,
                               String edgeLabel, String edgeStyle, String sourceId, String targetId) {
        return """
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="a" value="%s" style="%s" vertex="1" parent="1">
                    <mxGeometry x="0" y="0" width="120" height="60" as="geometry"/></mxCell>
                  <mxCell id="b" value="%s" style="%s" vertex="1" parent="1">
                    <mxGeometry x="300" y="0" width="120" height="60" as="geometry"/></mxCell>
                  <mxCell id="e" value="%s" style="%s" edge="1" parent="1" source="%s" target="%s">
                    <mxGeometry relative="1" as="geometry"/></mxCell>
                </root></mxGraphModel>
                """.formatted(sourceLabel, sourceStyle, targetLabel, targetStyle, edgeLabel, edgeStyle,
                sourceId, targetId);
    }

    private DiagramGradingResultDto gradeAs(String type, String reference, String learner) {
        return service.grade(new DiagramGradingRequestDto(reference, learner, new BigDecimal("10.00"), type));
    }

    private static DiagramGradingResultDto.ElementResultDto onlyEdge(DiagramGradingResultDto result) {
        return result.elementResults().stream().filter(e -> "EDGE".equals(e.kind())).findFirst().orElseThrow();
    }

    private static final String INHERITS =
            pair("Car", "swimlane;", "Vehicle", "swimlane;", "", "endArrow=block;endFill=0;", "a", "b");

    @Test
    void classDiagramInheritanceDrawnAsAPlainLineIsTheWrongRelationship() {
        String plainLine = pair("Car", "swimlane;", "Vehicle", "swimlane;", "", "endArrow=none;", "a", "b");

        DiagramGradingResultDto result = gradeAs("UML_CLASS", INHERITS, plainLine);

        assertFalse(result.coversEveryPart());
        assertTrue(onlyEdge(result).reason().contains("inheritance"), onlyEdge(result).reason());
    }

    @Test
    void classDiagramInheritanceMayBeDrawnFromEitherEndButMustPointAtTheParent() {
        String triangleAtStart = pair("Vehicle", "swimlane;", "Car", "swimlane;", "",
                "startArrow=block;startFill=0;endArrow=none;", "a", "b");
        String pointsAtChild = pair("Car", "swimlane;", "Vehicle", "swimlane;", "",
                "endArrow=block;endFill=0;", "b", "a");

        assertEquals(0, new BigDecimal("10.00").compareTo(
                gradeAs("UML_CLASS", INHERITS, triangleAtStart).earnedPoints()));
        DiagramGradingResultDto reversed = gradeAs("UML_CLASS", INHERITS, pointsAtChild);
        assertFalse(reversed.coversEveryPart());
        assertTrue(onlyEdge(reversed).reason().contains("opposite way"));
    }

    @Test
    void erdRelationshipsHaveNoDirectionAndAcceptCrowsFootCardinality() {
        String reference = pair("Customer", "swimlane;", "Order", "swimlane;", "places 0..*", "endArrow=none;",
                "a", "b");
        String crowsFootDrawnBackwards = pair("Customer", "swimlane;", "Order", "swimlane;", "places",
                "endArrow=none;startArrow=ERzeroToMany;", "b", "a");

        DiagramGradingResultDto result = gradeAs("ERD", reference, crowsFootDrawnBackwards);

        assertEquals(0, new BigDecimal("10.00").compareTo(result.earnedPoints()), onlyEdge(result).reason());
    }

    @Test
    void useCaseStereotypesMatchHoweverTheyAreBracketedButActorsMustBeActors() {
        String reference = pair("Checkout", "ellipse;", "Validate card", "ellipse;", "«include»",
                "endArrow=open;dashed=1;", "a", "b");
        String angleBrackets = pair("Checkout", "ellipse;", "Validate card", "ellipse;", "&lt;&lt;include&gt;&gt;",
                "endArrow=open;dashed=1;", "a", "b");
        String extend = pair("Checkout", "ellipse;", "Validate card", "ellipse;", "&lt;&lt;extend&gt;&gt;",
                "endArrow=open;dashed=1;", "a", "b");

        assertEquals(0, new BigDecimal("10.00").compareTo(gradeAs("USE_CASE", reference, angleBrackets).earnedPoints()));
        assertTrue(gradeAs("USE_CASE", reference, extend).earnedPoints().compareTo(new BigDecimal("10.00")) < 0);

        String actor = pair("Customer", "shape=umlActor;", "Checkout", "ellipse;", "", "endArrow=none;", "a", "b");
        String actorAsBox = pair("Customer", "rounded=0;", "Checkout", "ellipse;", "", "endArrow=none;", "a", "b");
        DiagramGradingResultDto boxed = gradeAs("USE_CASE", actor, actorAsBox);
        assertTrue(boxed.elementResults().stream().anyMatch(e -> e.reason().contains("actor")));
    }

    private static String sequence(String... messages) {
        StringBuilder xml = new StringBuilder("""
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="c" value="Client" style="shape=umlLifeline;" vertex="1" parent="1">
                    <mxGeometry x="0" y="0" width="100" height="600" as="geometry"/></mxCell>
                  <mxCell id="s" value="Server" style="shape=umlLifeline;" vertex="1" parent="1">
                    <mxGeometry x="300" y="0" width="100" height="600" as="geometry"/></mxCell>
                """);
        int y = 100;
        for (String message : messages) {
            String[] parts = message.split("\\|");
            boolean reply = parts[1].equals("return");
            int from = reply ? 350 : 50;
            int to = reply ? 50 : 350;
            xml.append("<mxCell id=\"m").append(y).append("\" value=\"").append(parts[0]).append("\" style=\"")
                    .append(parts[1].equals("call") || parts[1].equals("return-as-call") ? "endArrow=block;endFill=1;"
                            : "endArrow=open;dashed=1;")
                    .append("\" edge=\"1\" parent=\"1\"><mxGeometry relative=\"1\" as=\"geometry\">")
                    .append("<mxPoint x=\"").append(parts[1].equals("return-as-call") ? 350 : from)
                    .append("\" y=\"").append(y).append("\" as=\"sourcePoint\"/>")
                    .append("<mxPoint x=\"").append(parts[1].equals("return-as-call") ? 50 : to)
                    .append("\" y=\"").append(y).append("\" as=\"targetPoint\"/></mxGeometry></mxCell>");
            y += 60;
        }
        return xml.append("</root></mxGraphModel>").toString();
    }

    @Test
    void sequenceMessagesAreCheckedForOrderAndKind() {
        String reference = sequence("1: login()|call", "2: token|return", "3: fetch()|call", "4: data|return");

        assertEquals(0, new BigDecimal("10.00").compareTo(gradeAs("SEQUENCE_DIAGRAM", reference,
                sequence("login()|call", "token|return", "fetch()|call", "data|return")).earnedPoints()));

        DiagramGradingResultDto shuffled = gradeAs("SEQUENCE_DIAGRAM", reference,
                sequence("4: data|return", "3: fetch()|call", "2: token|return", "1: login()|call"));
        assertTrue(shuffled.elementResults().stream().anyMatch(e -> e.reason().contains("out of order")));
        assertFalse(shuffled.coversEveryPart());

        DiagramGradingResultDto solidReturns = gradeAs("SEQUENCE_DIAGRAM", reference,
                sequence("1: login()|call", "2: token|return-as-call", "3: fetch()|call", "4: data|return-as-call"));
        assertTrue(solidReturns.elementResults().stream().anyMatch(e -> e.reason().contains("return")));
    }

    @Test
    void activityStartAndEndNodesAreToldApartByShapeNotLabel() {
        String reference = """
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="s" value="" style="ellipse;fillColor=#000000;" vertex="1" parent="1">
                    <mxGeometry x="0" y="0" width="30" height="30" as="geometry"/></mxCell>
                  <mxCell id="a" value="Submit claim" style="rounded=1;" vertex="1" parent="1">
                    <mxGeometry x="0" y="80" width="120" height="40" as="geometry"/></mxCell>
                  <mxCell id="f" value="" style="shape=endState;fillColor=#000000;" vertex="1" parent="1">
                    <mxGeometry x="0" y="180" width="30" height="30" as="geometry"/></mxCell>
                  <mxCell id="1e" edge="1" parent="1" source="s" target="a"><mxGeometry relative="1" as="geometry"/></mxCell>
                  <mxCell id="2e" edge="1" parent="1" source="a" target="f"><mxGeometry relative="1" as="geometry"/></mxCell>
                </root></mxGraphModel>
                """;
        String learner = reference.replace("id=\"s\"", "id=\"F\"").replace("id=\"f\"", "id=\"S\"")
                .replace("source=\"s\"", "source=\"F\"").replace("target=\"f\"", "target=\"S\"");
        String reversed = reference.replace("source=\"s\" target=\"a\"", "source=\"a\" target=\"s\"")
                .replace("source=\"a\" target=\"f\"", "source=\"f\" target=\"a\"");

        assertEquals(0, new BigDecimal("10.00").compareTo(gradeAs("ACTIVITY_DIAGRAM", reference, learner).earnedPoints()));
        DiagramGradingResultDto backwards = gradeAs("ACTIVITY_DIAGRAM", reference, reversed);
        assertFalse(backwards.coversEveryPart());
    }

    @Test
    void camelCaseNamesMatchTheSameWordsWrittenWithSpaces() {
        String reference = pair("GlobalLoadBalancer", "shape=component;", ":AvSystem", "shape=component;",
                "IRequestDistribution", "endArrow=open;dashed=1;", "a", "b");
        String learner = pair("Global Load Balancer", "shape=component;", "AV System", "shape=component;",
                "IRequestDistribution", "endArrow=open;dashed=1;", "a", "b");

        assertEquals(0, new BigDecimal("10.00").compareTo(gradeAs("UML_COMPONENT", reference, learner).earnedPoints()));
    }

    @Test
    void drawIoFlowchartLibraryShapesAreRecognised() {
        String reference = pair("Start", "shape=terminator;", "tests pass?", "rhombus;", "", "endArrow=block;", "a", "b");
        String learner = pair("Start", "shape=mxgraph.flowchart.terminator;", "Tests pass?",
                "shape=mxgraph.flowchart.decision;", "", "endArrow=block;", "a", "b");

        assertEquals(0, new BigDecimal("10.00").compareTo(gradeAs("FLOWCHART", reference, learner).earnedPoints()));
    }

    @Test
    void aMultiplicityAloneOnALabelIsNotMistakenForAMessageNumber() {
        String reference = pair("Payment", "swimlane;", "PaymentLine", "swimlane;", "consists of 1..*",
                "startArrow=diamondThin;startFill=1;endArrow=none;", "a", "b");
        String learner = pair("Payment", "swimlane;", "PaymentLine", "swimlane;", "1..*",
                "startArrow=diamondThin;startFill=1;endArrow=open;", "a", "b");

        DiagramGradingResultDto result = gradeAs("UML_CLASS", reference, learner);

        assertTrue(result.coversEveryPart());
        assertFalse(onlyEdge(result).reason().contains("cardinality"), onlyEdge(result).reason());
    }

    @Test
    void aStepWordedDifferentlyButInTheSamePlaceGetsPartialCredit() {
        String flow = """
                <mxGraphModel><root><mxCell id="0"/><mxCell id="1" parent="0"/>
                  <mxCell id="a" value="Submit claim" style="rounded=1;" vertex="1" parent="1">
                    <mxGeometry x="0" y="0" width="120" height="40" as="geometry"/></mxCell>
                  <mxCell id="b" value="%s" style="rounded=1;" vertex="1" parent="1">
                    <mxGeometry x="0" y="80" width="120" height="40" as="geometry"/></mxCell>
                  <mxCell id="c" value="Notify employee" style="rounded=1;" vertex="1" parent="1">
                    <mxGeometry x="0" y="160" width="120" height="40" as="geometry"/></mxCell>
                  <mxCell id="1e" edge="1" parent="1" source="a" target="b"><mxGeometry relative="1" as="geometry"/></mxCell>
                  <mxCell id="2e" edge="1" parent="1" source="b" target="c"><mxGeometry relative="1" as="geometry"/></mxCell>
                </root></mxGraphModel>
                """;
        DiagramGradingResultDto result = gradeAs("ACTIVITY_DIAGRAM",
                flow.formatted("Line manager reviews claim"), flow.formatted("Line manager approval"));

        DiagramGradingResultDto.ElementResultDto step = result.elementResults().stream()
                .filter(e -> e.expectedDescription().equals("Line manager reviews claim")).findFirst().orElseThrow();
        assertTrue(step.matched());
        assertEquals("PARTIAL", step.matchQuality());
        assertTrue(step.reason().contains("place in the diagram"), step.reason());
    }

    @Test
    void anAttributeTheQuestionNeverAskedForCostsNothing() {
        String question = "A member has an ID and a name. A loan records the member who borrowed it.";
        String reference = ERD_REFERENCE.replace(
                "<mxCell id=\"22\" value=\"name: String\"",
                "<mxCell id=\"23\" value=\"favouriteColour: String\" style=\"text;html=1;\" vertex=\"1\" parent=\"2\">"
                        + "<mxGeometry y=\"56\" width=\"180\" height=\"15\" as=\"geometry\"/></mxCell>"
                        + "<mxCell id=\"22\" value=\"name: String\"");

        DiagramGradingResultDto result = service.grade(new DiagramGradingRequestDto(
                reference, erdAsTables("name", "FK memberId", true), new BigDecimal("10.00"), "ERD", question));

        assertEquals(0, new BigDecimal("10.00").compareTo(result.earnedPoints()), result.feedback());
        assertTrue(result.elementResults().stream()
                .anyMatch(e -> "OPTIONAL".equals(e.matchQuality()) && e.expectedDescription().contains("favouriteColour")));
    }

    @Test
    void notesAndLegendsAreNeverRequired() {
        String reference = INHERITS.replace("</root>",
                "<mxCell id=\"n\" value=\"Legend: hollow triangle = inheritance\" style=\"shape=note;\" vertex=\"1\" "
                        + "parent=\"1\"><mxGeometry x=\"0\" y=\"200\" width=\"200\" height=\"60\" as=\"geometry\"/></mxCell></root>");

        assertEquals(0, new BigDecimal("10.00").compareTo(gradeAs("UML_CLASS", reference, INHERITS).earnedPoints()));
    }

    @Test
    void titlesAndCaptionsAreNeverRequired() {
        DiagramGradingResultDto result = service.grade(new DiagramGradingRequestDto(
                ERD_REFERENCE, erdAsTables("name", "FK memberId", true), new BigDecimal("10.00")));

        assertTrue(result.elementResults().stream()
                .noneMatch(e -> e.expectedDescription().contains("model answer")));
    }
}
