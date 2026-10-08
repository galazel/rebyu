package com.capstone.rebyu.diagram.service;

import com.capstone.rebyu.diagram.dto.DiagramGraphDto;
import org.springframework.stereotype.Component;
import org.w3c.dom.Document;
import org.w3c.dom.Element;
import org.w3c.dom.Node;
import org.w3c.dom.NodeList;
import org.xml.sax.InputSource;

import javax.xml.parsers.DocumentBuilder;
import javax.xml.parsers.DocumentBuilderFactory;
import java.io.StringReader;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.regex.Pattern;

@Component
public class DiagramGraphExtractor {

    private static final Pattern TAG_PATTERN = Pattern.compile("<[^>]*>");
    private static final Pattern WHITESPACE_PATTERN = Pattern.compile("\\s+");

    public static class DiagramParseException extends RuntimeException {
        public DiagramParseException(String message) {
            super(message);
        }

        public DiagramParseException(String message, Throwable cause) {
            super(message, cause);
        }
    }

    public DiagramGraphDto extract(String xml) {
        if (xml == null || xml.isBlank()) {
            return new DiagramGraphDto(List.of(), List.of());
        }

        Element graphModel = findGraphModel(parse(xml));
        List<Element> cells = findMxCells(graphModel);

        Map<String, Element> cellsById = new LinkedHashMap<>();
        for (Element cell : cells) {
            String id = cell.getAttribute("id");
            if (!id.isBlank()) {
                cellsById.put(id, cell);
            }
        }

        List<DiagramGraphDto.Node> nodes = new ArrayList<>();
        for (Element cell : cells) {
            if (!isVertex(cell)) {
                continue;
            }
            String id = cell.getAttribute("id");
            if (id.equals("0") || id.equals("1") || isTextOnlyCell(cell)) {
                continue;
            }
            String label = getCellLabel(cell);
            nodes.add(new DiagramGraphDto.Node(
                    id, label, normalizeLabel(label), getNodeType(cell.getAttribute("style"))));
        }

        Map<String, DiagramGraphDto.Node> nodesById = new LinkedHashMap<>();
        for (DiagramGraphDto.Node node : nodes) {
            nodesById.put(node.id(), node);
        }

        List<DiagramGraphDto.Edge> edges = new ArrayList<>();
        for (Element cell : cells) {
            if (!"1".equals(cell.getAttribute("edge"))) {
                continue;
            }
            String sourceId = resolveNodeId(cell.getAttribute("source"), cellsById, nodesById);
            String targetId = resolveNodeId(cell.getAttribute("target"), cellsById, nodesById);
            if (sourceId == null || targetId == null) {
                continue;
            }
            String label = getCellLabel(cell);
            edges.add(new DiagramGraphDto.Edge(
                    cell.getAttribute("id"), sourceId, targetId, label, normalizeLabel(label)));
        }

        return new DiagramGraphDto(nodes, edges);
    }

    private boolean isVertex(Element cell) {
        return "1".equals(cell.getAttribute("vertex"));
    }

    private String resolveNodeId(
            String startingId, Map<String, Element> cellsById, Map<String, DiagramGraphDto.Node> nodesById) {
        if (startingId == null || startingId.isBlank()) {
            return null;
        }
        Element current = cellsById.get(startingId);
        Set<String> visited = new HashSet<>();
        while (current != null) {
            String currentId = current.getAttribute("id");
            if (currentId.isBlank() || !visited.add(currentId)) {
                return null;
            }
            if (nodesById.containsKey(currentId)) {
                return currentId;
            }
            String parentId = current.getAttribute("parent");
            if (parentId.isBlank()) {
                return null;
            }
            current = cellsById.get(parentId);
        }
        return null;
    }

    private String getCellLabel(Element cell) {
        String directValue = cell.getAttribute("value");
        if (!directValue.isBlank()) {
            return cleanLabel(directValue);
        }
        Node parent = cell.getParentNode();
        if (parent instanceof Element parentElement) {
            String label = parentElement.getAttribute("label");
            if (!label.isBlank()) {
                return cleanLabel(label);
            }
            return cleanLabel(parentElement.getAttribute("value"));
        }
        return "";
    }

    private boolean isTextOnlyCell(Element cell) {
        Map<String, String> style = parseStyle(cell.getAttribute("style"));
        return "1".equals(style.get("text"))
                || "label".equals(style.get("shape"))
                || "text".equals(style.get("shape"));
    }

    private String getNodeType(String styleText) {
        Map<String, String> style = parseStyle(styleText);
        String shape = style.getOrDefault("shape", "1".equals(style.get("rounded")) ? "rounded" : "rectangle")
                .toLowerCase(Locale.ROOT);

        if (shape.equals("rhombus") || shape.equals("diamond")) return "diamond";
        if (shape.equals("ellipse") || shape.equals("doubleellipse")) return "ellipse";
        if (shape.equals("cylinder")) return "data-store";
        if (shape.equals("process") || shape.contains("process")) return "process";
        if (shape.equals("swimlane") || "1".equals(style.get("swimlane"))) return "container";
        return "shape";
    }

    private Map<String, String> parseStyle(String styleText) {
        Map<String, String> result = new LinkedHashMap<>();
        if (styleText == null || styleText.isBlank()) {
            return result;
        }
        for (String part : styleText.split(";")) {
            if (part.isBlank()) continue;
            int eq = part.indexOf('=');
            if (eq < 0) {
                result.put(part.trim(), "1");
            } else {
                String key = part.substring(0, eq).trim();
                String value = part.substring(eq + 1);
                if (!key.isEmpty()) {
                    result.put(key, value.isEmpty() ? "1" : value);
                }
            }
        }
        return result;
    }

    private String cleanLabel(String value) {
        if (value == null) return "";
        String withoutTags = TAG_PATTERN.matcher(value).replaceAll(" ");
        String decoded = withoutTags
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'");
        return WHITESPACE_PATTERN.matcher(decoded).replaceAll(" ").trim();
    }

    private String normalizeLabel(String value) {
        return cleanLabel(value).toLowerCase(Locale.ROOT);
    }

    private List<Element> findMxCells(Element graphModel) {
        List<Element> cells = new ArrayList<>();
        NodeList nodeList = graphModel.getElementsByTagName("mxCell");
        for (int i = 0; i < nodeList.getLength(); i++) {
            if (nodeList.item(i) instanceof Element element) {
                cells.add(element);
            }
        }
        return cells;
    }

    private Element findGraphModel(Document document) {
        NodeList direct = document.getElementsByTagName("mxGraphModel");
        if (direct.getLength() > 0 && direct.item(0) instanceof Element element) {
            return element;
        }

        NodeList diagrams = document.getElementsByTagName("diagram");
        if (diagrams.getLength() > 0) {
            String nested = diagrams.item(0).getTextContent();
            if (nested != null && nested.trim().contains("<mxGraphModel")) {
                Document nestedDocument = parse(nested.trim());
                NodeList nestedGraphModel = nestedDocument.getElementsByTagName("mxGraphModel");
                if (nestedGraphModel.getLength() > 0 && nestedGraphModel.item(0) instanceof Element element) {
                    return element;
                }
            }
        }

        throw new DiagramParseException(
                "No readable mxGraphModel was found. Ensure Draw.io returns uncompressed XML.");
    }

    /** Parses untrusted XML with DOCTYPE/external-entity processing disabled (XXE hardening). */
    private Document parse(String xml) {
        try {
            DocumentBuilderFactory factory = DocumentBuilderFactory.newInstance();
            factory.setFeature("http://apache.org/xml/features/disallow-doctype-decl", true);
            factory.setFeature("http://xml.org/sax/features/external-general-entities", false);
            factory.setFeature("http://xml.org/sax/features/external-parameter-entities", false);
            factory.setXIncludeAware(false);
            factory.setExpandEntityReferences(false);
            DocumentBuilder builder = factory.newDocumentBuilder();
            return builder.parse(new InputSource(new StringReader(xml)));
        } catch (Exception e) {
            throw new DiagramParseException("Diagram XML could not be parsed.", e);
        }
    }
}
