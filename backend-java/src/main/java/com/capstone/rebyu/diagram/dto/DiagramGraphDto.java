package com.capstone.rebyu.diagram.dto;

import java.util.List;

public record DiagramGraphDto(List<Node> nodes, List<Edge> edges) {

    /**
     * A shape. {@code nodeType} is its kind -- box, actor, usecase, initial, final,
     * decision, bar, terminator, component, interface, lifeline, fragment, datastore.
     */
    public record Node(String id, String label, String labelKey, String nodeType, List<Attribute> attributes) {
        public Node(String id, String label, String labelKey, String nodeType) {
            this(id, label, labelKey, nodeType, List.of());
        }
    }

    /** A row inside a node -- an ERD column, a class field or operation. */
    public record Attribute(String label, String labelKey) {}

    /**
     * A connector, oriented the way its notation reads: for inheritance and
     * realization the source is the child and the target the parent; for
     * composition and aggregation the source is the part and the target the whole.
     *
     * {@code kind} is INHERITANCE, REALIZATION, COMPOSITION, AGGREGATION,
     * DEPENDENCY (dashed), ARROW (solid, filled head), OPEN_ARROW (solid, open head)
     * or LINE (no head). {@code cardinality} and {@code sourceCardinality} are the
     * multiplicities at the target and source ends -- drawn as crow's feet, or
     * written in the label, which by convention gives the end the line was drawn
     * towards. Either may be null.
     * {@code order} is how far down the page it sits -- message order in a sequence
     * diagram -- or NaN when unknown.
     */
    public record Edge(
            String id,
            String sourceId,
            String targetId,
            String label,
            String labelKey,
            String kind,
            String cardinality,
            String sourceCardinality,
            double order
    ) {
        public Edge(String id, String sourceId, String targetId, String label, String labelKey) {
            this(id, sourceId, targetId, label, labelKey, "LINE", null, null, Double.NaN);
        }
    }
}
