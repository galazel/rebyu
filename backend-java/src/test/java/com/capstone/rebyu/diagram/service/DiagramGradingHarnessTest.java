package com.capstone.rebyu.diagram.service;

import com.capstone.rebyu.diagram.dto.DiagramGradingRequestDto;
import com.capstone.rebyu.diagram.dto.DiagramGradingResultDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.condition.EnabledIfEnvironmentVariable;

import java.io.File;
import java.math.BigDecimal;

/**
 * Offline harness, off unless DIAGRAM_HARNESS_IN is set: grades every case in that JSON
 * array ({name, type, question, ref, learner}) with the real grader and writes the results
 * to DIAGRAM_HARNESS_OUT. Used to check the grader against genuine, partial and wrong
 * answers; it never touches the database.
 */
class DiagramGradingHarnessTest {

    @Test
    @EnabledIfEnvironmentVariable(named = "DIAGRAM_HARNESS_IN", matches = ".+")
    void gradeCases() throws Exception {
        ObjectMapper json = new ObjectMapper();
        DiagramGraphExtractor extractor = new DiagramGraphExtractor();
        DiagramGradingService grader = new DiagramGradingService(extractor);
        JsonNode cases = json.readTree(new File(System.getenv("DIAGRAM_HARNESS_IN")));
        ArrayNode out = json.createArrayNode();
        for (JsonNode c : cases) {
            ObjectNode row = out.addObject();
            row.put("name", c.path("name").asText());
            try {
                DiagramGradingResultDto result = grader.grade(new DiagramGradingRequestDto(
                        c.path("ref").asText(), c.path("learner").asText(), BigDecimal.TEN,
                        c.path("type").asText(null), c.path("question").asText(null)));
                row.set("result", json.valueToTree(result));
                if (c.path("extract").asBoolean(false)) {
                    row.set("refGraph", json.valueToTree(extractor.extract(c.path("ref").asText())));
                    row.set("learnerGraph", json.valueToTree(extractor.extract(c.path("learner").asText())));
                }
            } catch (Exception e) {
                row.put("error", e.toString());
            }
        }
        json.writerWithDefaultPrettyPrinter().writeValue(new File(System.getenv("DIAGRAM_HARNESS_OUT")), out);
    }
}
