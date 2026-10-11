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
    /** A line dividing a box's name from its rows: "─────", "-----", "=====". */
    private static final Pattern DIVIDER_LINE = Pattern.compile("[\\-\u2500\u2014_=]{3,}");

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

        List<Element> nodeCells = new ArrayList<>();
        for (Element cell : cells) {
            String id = cell.getAttribute("id");
            if (!isVertex(cell) || id.equals("0") || id.equals("1")
                    || isTextOnlyCell(cell) || isTablePart(cell, cellsById)) {
                continue;
            }
            nodeCells.add(cell);
        }
        Set<String> nodeIds = new HashSet<>();
        for (Element cell : nodeCells) {
            nodeIds.add(cell.getAttribute("id"));
        }

        Map<String, List<DiagramGraphDto.Attribute>> attributesByNode = new LinkedHashMap<>();
        for (Element cell : cells) {
            if (!isVertex(cell) || nodeIds.contains(cell.getAttribute("id"))
                    || "partialRectangle".equals(styleShape(cell))) {
                continue;
            }
            String owner = owningNode(cell, cellsById, nodeIds);
            if (owner == null) {
                continue;
            }
            String label = "tableRow".equals(styleShape(cell)) ? rowLabel(cell, cells) : getCellLabel(cell);
            if (label.isBlank()) {
                continue;
            }
            attributesByNode.computeIfAbsent(owner, k -> new ArrayList<>())
                    .add(new DiagramGraphDto.Attribute(label, normalizeLabel(label)));
        }

        List<DiagramGraphDto.Node> nodes = new ArrayList<>();
        for (Element cell : nodeCells) {
            String id = cell.getAttribute("id");
            List<String> lines = labelLines(cell.getAttribute("value"));
            String label = lines.isEmpty() ? getCellLabel(cell) : lines.get(0);
            List<DiagramGraphDto.Attribute> attributes =
                    new ArrayList<>(attributesByNode.getOrDefault(id, List.of()));
            for (String line : lines.subList(Math.min(1, lines.size()), lines.size())) {
                attributes.add(new DiagramGraphDto.Attribute(line, normalizeLabel(line)));
            }
            nodes.add(new DiagramGraphDto.Node(
                    id, label, normalizeLabel(label), nodeKind(cell), List.copyOf(attributes)));
        }

        Map<String, DiagramGraphDto.Node> nodesById = new LinkedHashMap<>();
        for (DiagramGraphDto.Node node : nodes) {
            nodesById.put(node.id(), node);
        }

        Map<String, double[]> bounds = new LinkedHashMap<>();
        for (Element cell : nodeCells) {
            double[] box = absoluteBounds(cell, cellsById);
            if (box != null && !"umlFrame".equals(styleShape(cell))) {
                bounds.put(cell.getAttribute("id"), box);
            }
        }

        List<DiagramGraphDto.Edge> edges = new ArrayList<>();
        for (Element cell : cells) {
            if (!"1".equals(cell.getAttribute("edge"))) {
                continue;
            }
            String sourceId = resolveNodeId(cell.getAttribute("source"), cellsById, nodesById);
            String targetId = resolveNodeId(cell.getAttribute("target"), cellsById, nodesById);
            if (sourceId == null) {
                sourceId = nodeAtPoint(cell, "sourcePoint", bounds);
            }
            if (targetId == null) {
                targetId = nodeAtPoint(cell, "targetPoint", bounds);
            }
            if (sourceId == null || targetId == null) {
                continue;
            }
            edges.add(classifyEdge(cell, sourceId, targetId, bounds));
        }

        return new DiagramGraphDto(nodes, edges);
    }

    private static final double POINT_TOLERANCE = 12;

    /** A cell that is only part of a draw.io table: a row or one of its cells. */
    private boolean isTablePart(Element cell, Map<String, Element> cellsById) {
        String shape = styleShape(cell);
        if ("tableRow".equals(shape) || "partialRectangle".equals(shape)) {
            return true;
        }
        Element parent = cellsById.get(cell.getAttribute("parent"));
        return parent != null && "tableRow".equals(styleShape(parent));
    }

    /** The nearest ancestor that is a node -- the entity or class a row belongs to. */
    private String owningNode(Element cell, Map<String, Element> cellsById, Set<String> nodeIds) {
        Element current = cellsById.get(cell.getAttribute("parent"));
        Set<String> visited = new HashSet<>();
        while (current != null && visited.add(current.getAttribute("id"))) {
            if (nodeIds.contains(current.getAttribute("id"))) {
                return current.getAttribute("id");
            }
            current = cellsById.get(current.getAttribute("parent"));
        }
        return null;
    }

    /** A table row's text: its own value plus its cells', e.g. "PK id". */
    private String rowLabel(Element row, List<Element> cells) {
        StringBuilder label = new StringBuilder(getCellLabel(row));
        for (Element cell : cells) {
            if (row.getAttribute("id").equals(cell.getAttribute("parent"))) {
                String part = getCellLabel(cell);
                if (!part.isBlank()) {
                    label.append(' ').append(part);
                }
            }
        }
        return label.toString().trim();
    }

    /**
     * A box drawn as one label -- its name, a divider (an HTML rule or a line of
     * dashes), then its rows -- split into its name and its rows. Labels without a
     * divider stay one line on purpose: a flowchart step wrapped over two lines is
     * still one step.
     */
    private List<String> labelLines(String rawValue) {
        if (rawValue == null) {
            return List.of();
        }
        String[] parts = rawValue.split("(?i)<hr[^>]*>|<br[^>]*>|</p>|</div>|\\n");
        boolean divided = rawValue.toLowerCase(Locale.ROOT).contains("<hr");
        for (String part : parts) {
            divided |= DIVIDER_LINE.matcher(cleanLabel(part)).matches();
        }
        if (!divided) {
            return List.of();
        }
        List<String> lines = new ArrayList<>();
        for (String part : parts) {
            String line = cleanLabel(part);
            if (!line.isBlank() && !DIVIDER_LINE.matcher(line).matches()) {
                lines.add(line);
            }
        }
        return lines;
    }

    private String styleShape(Element cell) {
        return parseStyle(cell.getAttribute("style")).get("shape");
    }

    /** x, y, width, height on the page, adding the offsets of vertex parents. */
    private double[] absoluteBounds(Element cell, Map<String, Element> cellsById) {
        Element geometry = geometryOf(cell);
        if (geometry == null || "1".equals(geometry.getAttribute("relative"))) {
            return null;
        }
        double x = number(geometry.getAttribute("x"));
        double y = number(geometry.getAttribute("y"));
        Element parent = cellsById.get(cell.getAttribute("parent"));
        Set<String> visited = new HashSet<>();
        while (parent != null && isVertex(parent) && visited.add(parent.getAttribute("id"))) {
            Element parentGeometry = geometryOf(parent);
            if (parentGeometry != null) {
                x += number(parentGeometry.getAttribute("x"));
                y += number(parentGeometry.getAttribute("y"));
            }
            parent = cellsById.get(parent.getAttribute("parent"));
        }
        return new double[] {x, y, number(geometry.getAttribute("width")), number(geometry.getAttribute("height"))};
    }

    /**
     * The node an unattached arrow end touches. Sequence-diagram messages are drawn
     * between lifelines by position, with no source or target, so without this every
     * message would be invisible to grading. The smallest node holding the point wins.
     */
    private String nodeAtPoint(Element edge, String which, Map<String, double[]> bounds) {
        Element geometry = geometryOf(edge);
        if (geometry == null) {
            return null;
        }
        NodeList points = geometry.getElementsByTagName("mxPoint");
        for (int i = 0; i < points.getLength(); i++) {
            if (!(points.item(i) instanceof Element point) || !which.equals(point.getAttribute("as"))) {
                continue;
            }
            double px = number(point.getAttribute("x"));
            double py = number(point.getAttribute("y"));
            String best = null;
            double bestArea = Double.MAX_VALUE;
            for (Map.Entry<String, double[]> entry : bounds.entrySet()) {
                double[] b = entry.getValue();
                if (px >= b[0] - POINT_TOLERANCE && px <= b[0] + b[2] + POINT_TOLERANCE
                        && py >= b[1] - POINT_TOLERANCE && py <= b[1] + b[3] + POINT_TOLERANCE
                        && b[2] * b[3] < bestArea) {
                    best = entry.getKey();
                    bestArea = b[2] * b[3];
                }
            }
            return best;
        }
        return null;
    }

    private Element geometryOf(Element cell) {
        NodeList children = cell.getChildNodes();
        for (int i = 0; i < children.getLength(); i++) {
            if (children.item(i) instanceof Element child && "mxGeometry".equals(child.getTagName())) {
                return child;
            }
        }
        return null;
    }

    private double number(String value) {
        try {
            return value == null || value.isBlank() ? 0 : Double.parseDouble(value);
        } catch (NumberFormatException e) {
            return 0;
        }
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

    /**
     * Free text that is never part of the answer: titles, captions, and notes --
     * which in these diagrams are legends and commentary, not modelled elements.
     */
    private boolean isTextOnlyCell(Element cell) {
        Map<String, String> style = parseStyle(cell.getAttribute("style"));
        String shape = style.get("shape");
        return "1".equals(style.get("text"))
                || "label".equals(shape)
                || "text".equals(shape)
                || "note".equals(shape)
                || "callout".equals(shape);
    }

    /**
     * What a shape IS, so diagrams whose meaning lives in shapes can be checked:
     * a use-case actor is a stick figure, an activity starts at a filled dot, a
     * decision is a diamond, a fork is a bar. Boxes of every style -- rectangle,
     * rounded, swimlane, table -- are one kind, "box".
     */
    private String nodeKind(Element cell) {
        Map<String, String> style = parseStyle(cell.getAttribute("style"));
        String shape = style.getOrDefault("shape", "").toLowerCase(Locale.ROOT);
        Element geometry = geometryOf(cell);
        double width = geometry == null ? 0 : number(geometry.getAttribute("width"));
        double height = geometry == null ? 0 : number(geometry.getAttribute("height"));
        boolean dark = isDark(style.get("fillColor"));

        if (shape.equals("umlactor") || shape.endsWith(".actor")) return "actor";
        if (shape.equals("umllifeline")) return "lifeline";
        if (shape.equals("umlframe")) return "fragment";
        if (shape.contains("component") || shape.equals("module")) return "component";
        if (shape.contains("interface") || shape.equals("lollipop")) return "interface";
        if (shape.equals("endstate") || shape.equals("doubleellipse")) return "final";
        if (shape.equals("startstate")) return "initial";
        if (shape.equals("rhombus") || shape.equals("diamond") || style.containsKey("rhombus")) return "decision";
        if (shape.equals("line") || shape.equals("fork") || shape.equals("join")) return "bar";
        if (dark && width > 0 && height > 0 && Math.max(width, height) / Math.min(width, height) >= 4) {
            return "bar";
        }
        if (shape.startsWith("mxgraph.flowchart.")) {
            String symbol = shape.substring("mxgraph.flowchart.".length());
            if (symbol.equals("decision")) return "decision";
            if (symbol.equals("terminator") || symbol.startsWith("start")) return "terminator";
            if (symbol.contains("data") || symbol.equals("database")) return "datastore";
            return "box";
        }
        if (shape.equals("terminator")) return "terminator";
        if (shape.startsWith("cylinder") || shape.equals("datastore")) return "datastore";
        if (shape.equals("ellipse") || style.containsKey("ellipse")) return dark ? "initial" : "ellipse";
        return "box";
    }

    private boolean isDark(String color) {
        if (color == null) return false;
        String c = color.trim().toLowerCase(Locale.ROOT);
        if (c.equals("black")) return true;
        if (!c.matches("#[0-9a-f]{3}|#[0-9a-f]{6}")) return false;
        if (c.length() == 4) {
            c = "#" + c.charAt(1) + c.charAt(1) + c.charAt(2) + c.charAt(2) + c.charAt(3) + c.charAt(3);
        }
        int r = Integer.parseInt(c.substring(1, 3), 16);
        int g = Integer.parseInt(c.substring(3, 5), 16);
        int b = Integer.parseInt(c.substring(5, 7), 16);
        return 0.299 * r + 0.587 * g + 0.114 * b < 70;
    }

    private enum Marker { NONE, TRIANGLE_HOLLOW, DIAMOND_FILLED, DIAMOND_HOLLOW, ARROW_FILLED, ARROW_OPEN, ER }

    private Marker marker(String arrow, String fill) {
        String a = arrow == null ? "" : arrow.trim();
        if (a.isEmpty() || a.equals("none")) return Marker.NONE;
        if (a.startsWith("ER")) return Marker.ER;
        boolean hollow = "0".equals(fill);
        String lower = a.toLowerCase(Locale.ROOT);
        if (lower.startsWith("diamond")) return hollow ? Marker.DIAMOND_HOLLOW : Marker.DIAMOND_FILLED;
        if (lower.startsWith("block") && hollow) return Marker.TRIANGLE_HOLLOW;
        if (lower.startsWith("open") || lower.contains("async") || hollow) return Marker.ARROW_OPEN;
        return Marker.ARROW_FILLED;
    }

    /**
     * Reads an edge's notation and orients it the way the notation reads (see
     * {@link DiagramGraphDto.Edge}): a hollow triangle at the START means the source
     * is the parent, so the ends are swapped; a diamond marks the whole.
     */
    private DiagramGraphDto.Edge classifyEdge(
            Element cell, String sourceId, String targetId, Map<String, double[]> bounds) {
        Map<String, String> style = parseStyle(cell.getAttribute("style"));
        Marker end = marker(style.getOrDefault("endArrow", "classic"), style.get("endFill"));
        Marker start = marker(style.get("startArrow"), style.get("startFill"));
        boolean dashed = "1".equals(style.get("dashed"));

        String kind;
        boolean swap = false;
        if (end == Marker.TRIANGLE_HOLLOW || start == Marker.TRIANGLE_HOLLOW) {
            kind = dashed ? "REALIZATION" : "INHERITANCE";
            swap = end != Marker.TRIANGLE_HOLLOW;
        } else if (end == Marker.DIAMOND_FILLED || start == Marker.DIAMOND_FILLED) {
            kind = "COMPOSITION";
            swap = end != Marker.DIAMOND_FILLED;
        } else if (end == Marker.DIAMOND_HOLLOW || start == Marker.DIAMOND_HOLLOW) {
            kind = "AGGREGATION";
            swap = end != Marker.DIAMOND_HOLLOW;
        } else if (end == Marker.ER || start == Marker.ER) {
            kind = "LINE";
        } else if (dashed) {
            kind = "DEPENDENCY";
            swap = end == Marker.NONE && start != Marker.NONE;
        } else if (end == Marker.ARROW_FILLED || start == Marker.ARROW_FILLED) {
            kind = "ARROW";
            swap = end != Marker.ARROW_FILLED;
        } else if (end == Marker.ARROW_OPEN || start == Marker.ARROW_OPEN) {
            kind = "OPEN_ARROW";
            swap = end != Marker.ARROW_OPEN;
        } else {
            kind = "LINE";
        }

        String label = getCellLabel(cell);
        String written = writtenCardinality(normalizeLabel(label));
        String atDrawnTarget = firstNonNull(erCardinality(style.get("endArrow")), written);
        String atDrawnSource = erCardinality(style.get("startArrow"));
        String cardinality = swap ? atDrawnSource : atDrawnTarget;
        String sourceCardinality = swap ? atDrawnTarget : atDrawnSource;
        double order = edgeOrder(cell, style, sourceId, bounds);
        return new DiagramGraphDto.Edge(
                cell.getAttribute("id"),
                swap ? targetId : sourceId,
                swap ? sourceId : targetId,
                label, normalizeLabel(label), kind, cardinality, sourceCardinality, order);
    }

    private static final Pattern WRITTEN_CARDINALITY = Pattern.compile(
            "(?:^|\\s)(0\\.\\.1|1\\.\\.1|0\\.\\.\\*|1\\.\\.\\*|0\\.\\.n|1\\.\\.n|1\\.\\.m|0\\.\\.m|\\*|n|m|1)(?=\\s|$)");
    private static final Pattern MESSAGE_NUMBER = Pattern.compile("^\\s*\\d+(\\.\\d+)*\\s*(?:[:)]|\\.(?!\\.))\\s*");

    /** A multiplicity written in a label ("places 0..*"), in canonical form. */
    private String writtenCardinality(String labelKey) {
        if (labelKey == null || labelKey.isBlank()) return null;
        java.util.regex.Matcher matcher =
                WRITTEN_CARDINALITY.matcher(MESSAGE_NUMBER.matcher(labelKey).replaceFirst(""));
        return matcher.find() ? canonicalCardinality(matcher.group(1)) : null;
    }

    /** "*", "n", "0..n" all say zero-or-more; "1..n" and "1..*" one-or-more; "1" is "1..1". */
    static String canonicalCardinality(String raw) {
        return switch (raw) {
            case "*", "n", "m", "0..n", "0..m", "0..*" -> "0..*";
            case "1..n", "1..m", "1..*" -> "1..*";
            case "1", "1..1" -> "1..1";
            default -> raw;
        };
    }

    private static String firstNonNull(String a, String b) {
        return a != null ? a : b;
    }

    /** Crow's-foot line ends, read as the multiplicity they draw. */
    private String erCardinality(String arrow) {
        if (arrow == null) return null;
        return switch (arrow.trim()) {
            case "ERmandOne", "ERone" -> "1..1";
            case "ERzeroToOne" -> "0..1";
            case "ERoneToMany" -> "1..*";
            case "ERzeroToMany", "ERmany" -> "0..*";
            default -> null;
        };
    }

    /**
     * How far down the page an edge sits. Messages between lifelines are placed by
     * height, and that height is their order; an attached message carries it as its
     * end point or as an exit position on its source lifeline.
     */
    private double edgeOrder(Element cell, Map<String, String> style, String sourceId, Map<String, double[]> bounds) {
        Element geometry = geometryOf(cell);
        if (geometry != null) {
            NodeList points = geometry.getElementsByTagName("mxPoint");
            for (String wanted : new String[] {"sourcePoint", "targetPoint", ""}) {
                for (int i = 0; i < points.getLength(); i++) {
                    if (points.item(i) instanceof Element point && wanted.equals(point.getAttribute("as"))) {
                        return number(point.getAttribute("y"));
                    }
                }
            }
        }
        double[] box = bounds.get(sourceId);
        if (box != null && style.containsKey("exitY")) {
            return box[1] + number(style.get("exitY")) * box[3];
        }
        return Double.NaN;
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

    /**
     * Label text without HTML markup. UML stereotypes are written "<<include>>",
     * which looks like a tag, so double angle brackets become guillemets first --
     * before and after decoding, since an HTML label carries them escaped.
     */
    private String cleanLabel(String value) {
        if (value == null) return "";
        String withoutTags = TAG_PATTERN.matcher(guillemets(value)).replaceAll(" ");
        String decoded = guillemets(withoutTags
                .replace("&lt;&lt;", "<<")
                .replace("&gt;&gt;", ">>"));
        decoded = decoded
                .replace("&nbsp;", " ")
                .replace("&amp;", "&")
                .replace("&lt;", "<")
                .replace("&gt;", ">")
                .replace("&quot;", "\"")
                .replace("&#39;", "'");
        return WHITESPACE_PATTERN.matcher(decoded).replaceAll(" ").trim();
    }

    private static String guillemets(String value) {
        return value.replace("<<", "«").replace(">>", "»");
    }

    private static final Pattern CAMEL_LOWER_UPPER = Pattern.compile("(?<=[a-z0-9])(?=[A-Z])");
    private static final Pattern CAMEL_ACRONYM = Pattern.compile("(?<=[A-Z])(?=[A-Z][a-z])");

    /**
     * The comparable form of a label: lower case, with CamelCase split into words
     * ("GlobalLoadBalancer" and "Global Load Balancer" are the same name) and the
     * colon of UML object notation (":OrderService") dropped.
     */
    private String normalizeLabel(String value) {
        String cleaned = cleanLabel(value).replaceFirst("^:\\s*", "");
        cleaned = CAMEL_ACRONYM.matcher(CAMEL_LOWER_UPPER.matcher(cleaned).replaceAll(" ")).replaceAll(" ");
        return WHITESPACE_PATTERN.matcher(cleaned).replaceAll(" ").trim().toLowerCase(Locale.ROOT);
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
