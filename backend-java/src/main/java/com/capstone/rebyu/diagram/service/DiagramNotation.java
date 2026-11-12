package com.capstone.rebyu.diagram.service;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * What a diagram type's notation means, for grading. Each UML (and ER) diagram
 * gives its shapes and connectors different meanings, so "the same drawing" is
 * judged differently per type:
 *
 * <ul>
 *   <li>ERD -- a relationship line has no direction; its cardinality may be
 *       written on it or drawn as crow's-foot ends.</li>
 *   <li>Class -- the relationship kind is the point: inheritance, realization,
 *       composition, aggregation, dependency or association. Inheritance points at
 *       the parent and a diamond sits at the whole, so those are directed; a plain
 *       association is not.</li>
 *   <li>Use case -- actors are stick figures and use cases ovals; actor-to-use-case
 *       associations have no direction, include/extend and generalization do.
 *       «include» and «extend» are different relationships, told apart by their
 *       stereotype; use cases sit inside the system boundary and actors outside it.</li>
 *   <li>Sequence -- every message is directed, its kind (call, asynchronous,
 *       return) matters, and so does its order down the page.</li>
 *   <li>Activity / flowchart -- every flow is directed; start, end, decision and
 *       fork/join are told apart by shape, since they usually carry no label.</li>
 *   <li>Component -- components and interfaces are different shapes; dependencies
 *       and realizations are directed, connectors are not.</li>
 * </ul>
 *
 * An unknown or missing type grades structure only: every connector directed,
 * no kind or shape checks -- the behaviour before types were distinguished.
 */
final class DiagramNotation {

    enum Family { ERD, CLASS, USE_CASE, SEQUENCE, FLOW, COMPONENT, GENERIC }

    private static final Map<String, Family> TYPES = Map.ofEntries(
            Map.entry("ERD", Family.ERD), Map.entry("ER", Family.ERD), Map.entry("ER_DIAGRAM", Family.ERD),
            Map.entry("ENTITY_RELATIONSHIP", Family.ERD),
            Map.entry("ENTITY_RELATIONSHIP_DIAGRAM", Family.ERD),
            Map.entry("UML_CLASS", Family.CLASS), Map.entry("CLASS", Family.CLASS),
            Map.entry("CLASS_DIAGRAM", Family.CLASS),
            Map.entry("USE_CASE", Family.USE_CASE), Map.entry("USECASE", Family.USE_CASE),
            Map.entry("USE_CASE_DIAGRAM", Family.USE_CASE),
            Map.entry("SEQUENCE_DIAGRAM", Family.SEQUENCE), Map.entry("UML_SEQUENCE", Family.SEQUENCE),
            Map.entry("SEQUENCE", Family.SEQUENCE),
            Map.entry("ACTIVITY_DIAGRAM", Family.FLOW), Map.entry("ACTIVITY", Family.FLOW),
            Map.entry("FLOWCHART", Family.FLOW), Map.entry("FLOW_CHART", Family.FLOW), Map.entry("DFD", Family.FLOW),
            Map.entry("UML_COMPONENT", Family.COMPONENT), Map.entry("COMPONENT", Family.COMPONENT),
            Map.entry("COMPONENT_DIAGRAM", Family.COMPONENT), Map.entry("NETWORK_DIAGRAM", Family.COMPONENT));

    private final Family family;
    private final boolean activity;

    private DiagramNotation(Family family, boolean activity) {
        this.family = family;
        this.activity = activity;
    }

    static DiagramNotation of(String diagramType) {
        String type = DiagramGradingService.normalizeType(diagramType);
        Family family = TYPES.getOrDefault(type, Family.GENERIC);
        return new DiagramNotation(family, type.startsWith("ACTIVITY"));
    }

    Family family() {
        return family;
    }

    /** Whether message order down the page is part of the answer. */
    boolean ordered() {
        return family == Family.SEQUENCE;
    }

    /**
     * The meaning of a connector the extractor classified by its drawing (see
     * DiagramGraphDto.Edge), in this notation's vocabulary.
     */
    String relationKind(String drawnKind) {
        String kind = drawnKind == null ? "LINE" : drawnKind;
        return switch (family) {
            case ERD -> kind.equals("INHERITANCE") || kind.equals("REALIZATION") ? "SUBTYPE" : "RELATIONSHIP";
            case FLOW -> "FLOW";
            case GENERIC -> "CONNECTOR";
            case CLASS -> switch (kind) {
                case "INHERITANCE", "REALIZATION", "COMPOSITION", "AGGREGATION", "DEPENDENCY" -> kind;
                default -> "ASSOCIATION";
            };
            case USE_CASE -> switch (kind) {
                case "DEPENDENCY" -> "INCLUDE_EXTEND";
                case "INHERITANCE", "REALIZATION" -> "GENERALIZATION";
                default -> "ASSOCIATION";
            };
            case SEQUENCE -> switch (kind) {
                case "DEPENDENCY" -> "RETURN";
                case "OPEN_ARROW" -> "ASYNC";
                default -> "SYNC";
            };
            case COMPONENT -> switch (kind) {
                case "DEPENDENCY" -> "DEPENDENCY";
                case "INHERITANCE", "REALIZATION" -> "REALIZATION";
                case "COMPOSITION", "AGGREGATION" -> "CONTAINMENT";
                default -> "CONNECTOR";
            };
        };
    }

    /**
     * The relationship a connector draws, reading its stereotype where the notation gives
     * one meaning: in a use case diagram a dashed arrow is «include» or «extend» -- two
     * different relationships -- and the label is what says which.
     */
    String relationKind(String drawnKind, String labelKey) {
        if (family == Family.USE_CASE && labelKey != null) {
            String label = labelKey.toLowerCase(Locale.ROOT);
            if (label.contains("include")) return "INCLUDE";
            if (label.contains("extend")) return "EXTEND";
        }
        return relationKind(drawnKind);
    }

    boolean directed(String relationKind) {
        return switch (family) {
            case ERD -> relationKind.equals("SUBTYPE");
            case CLASS -> !relationKind.equals("ASSOCIATION");
            case USE_CASE -> !relationKind.equals("ASSOCIATION");
            case COMPONENT -> relationKind.equals("DEPENDENCY") || relationKind.equals("REALIZATION")
                    || relationKind.equals("CONTAINMENT");
            case SEQUENCE, FLOW, GENERIC -> true;
        };
    }

    private static final Map<String, String> RELATION_NAMES = Map.ofEntries(
            Map.entry("INHERITANCE", "an inheritance (hollow triangle)"),
            Map.entry("REALIZATION", "a realization (dashed line, hollow triangle)"),
            Map.entry("COMPOSITION", "a composition (filled diamond)"),
            Map.entry("AGGREGATION", "an aggregation (hollow diamond)"),
            Map.entry("DEPENDENCY", "a dependency (dashed arrow)"),
            Map.entry("ASSOCIATION", "an association (plain line)"),
            Map.entry("INCLUDE_EXTEND", "an include/extend (dashed arrow)"),
            Map.entry("INCLUDE", "an «include» (dashed arrow to the included use case)"),
            Map.entry("EXTEND", "an «extend» (dashed arrow from the extension to the base use case)"),
            Map.entry("GENERALIZATION", "a generalization (hollow triangle)"),
            Map.entry("SYNC", "a call (solid line, filled arrowhead)"),
            Map.entry("ASYNC", "an asynchronous message (solid line, open arrowhead)"),
            Map.entry("RETURN", "a return (dashed line)"),
            Map.entry("CONTAINMENT", "a containment (diamond)"),
            Map.entry("CONNECTOR", "a connector"),
            Map.entry("RELATIONSHIP", "a relationship"),
            Map.entry("SUBTYPE", "a supertype/subtype link (hollow triangle at the supertype)"),
            Map.entry("FLOW", "a flow"));

    String relationName(String relationKind) {
        return RELATION_NAMES.getOrDefault(relationKind, "a connector");
    }

    /** A short tag naming the relationship kind in descriptions, where the kind carries meaning. */
    String relationNote(String relationKind) {
        return switch (relationKind) {
            case "INHERITANCE", "REALIZATION", "COMPOSITION", "AGGREGATION", "DEPENDENCY", "INCLUDE_EXTEND",
                 "GENERALIZATION", "RETURN", "ASYNC", "CONTAINMENT", "INCLUDE", "EXTEND", "SUBTYPE" ->
                    relationName(relationKind).replaceFirst("^an? ", "").replaceFirst(" \\(.*\\)$", "");
            default -> null;
        };
    }

    /**
     * Whether two shape kinds mean the same thing here. Boxes of any style are
     * interchangeable everywhere; beyond that each notation decides which shapes
     * carry meaning.
     */
    boolean sameShape(String expected, String drawn) {
        String want = group(expected);
        String got = group(drawn);
        if (want.equals(got)) return true;
        // Strict only where the model answer is specific. A plain process box in the model
        // answer accepts any process-family symbol (a learner may rightly draw "Read card"
        // as input/output), and an activity final accepts a flow final; but where the model
        // answer draws a parallelogram, a document or a flow final, that symbol is required.
        if (want.equals("box") && PROCESS_FAMILY.contains(got)) return true;
        return want.equals("final") && got.equals("flowfinal");
    }

    private static final Set<String> PROCESS_FAMILY =
            Set.of("io", "document", "predefined", "preparation", "manualop");

    private static final Set<String> BOXES = Set.of("box", "datastore");

    private String group(String kind) {
        String k = kind == null ? "box" : kind;
        return switch (family) {
            case GENERIC, ERD, CLASS -> "any";
            case USE_CASE -> switch (k) {
                case "actor" -> "actor";
                case "ellipse" -> "usecase";
                default -> "box";
            };
            case SEQUENCE -> switch (k) {
                case "fragment" -> "fragment";
                default -> "participant";
            };
            case COMPONENT -> switch (k) {
                case "interface", "ellipse" -> "interface";
                case "actor" -> "actor";
                default -> "component";
            };
            case FLOW -> {
                if (activity) {
                    yield switch (k) {
                        case "initial" -> "initial";
                        case "final" -> "final";
                        case "flowfinal" -> "flowfinal";
                        case "decision" -> "decision";
                        case "bar" -> "bar";
                        case "fragment" -> "box";
                        default -> BOXES.contains(k) || k.equals("terminator") || k.equals("ellipse") ? "box" : k;
                    };
                }
                yield switch (k) {
                    case "terminator", "initial", "final", "flowfinal", "ellipse" -> "terminal";
                    case "decision" -> "decision";
                    case "datastore" -> "datastore";
                    case "io", "document", "predefined", "preparation", "manualop", "connector" -> k;
                    default -> "box";
                };
            }
        };
    }

    private static final Map<String, String> SHAPE_NAMES = Map.ofEntries(
            Map.entry("actor", "an actor (stick figure)"),
            Map.entry("usecase", "a use case (oval)"),
            Map.entry("box", "a box"),
            Map.entry("initial", "a start node (filled dot)"),
            Map.entry("final", "an end node (ringed dot)"),
            Map.entry("flowfinal", "a flow final (circle with a cross)"),
            Map.entry("io", "an input/output (parallelogram)"),
            Map.entry("document", "a document symbol"),
            Map.entry("predefined", "a predefined process (box with double sides)"),
            Map.entry("preparation", "a preparation (hexagon)"),
            Map.entry("manualop", "a manual operation (trapezoid)"),
            Map.entry("connector", "a connector"),
            Map.entry("decision", "a decision (diamond)"),
            Map.entry("bar", "a fork/join bar"),
            Map.entry("terminal", "a start/end terminator"),
            Map.entry("datastore", "a data store"),
            Map.entry("interface", "an interface"),
            Map.entry("component", "a component"),
            Map.entry("participant", "a participant (lifeline)"),
            Map.entry("fragment", "a combined fragment"),
            Map.entry("any", "a box"));

    String shapeName(String kind) {
        return SHAPE_NAMES.getOrDefault(group(kind), "a shape");
    }

    /**
     * Credit kept when a connector's label differs from the reference. In an ERD or
     * class diagram the label is a relationship's name ("borrows", "places") --
     * wording, lightly penalised; its cardinality is checked separately. Elsewhere
     * the label is the content: a message, a guard, a stereotype, an interface.
     */
    double labelPenalty() {
        return family == Family.ERD || family == Family.CLASS ? 0.9 : 0.7;
    }

    /** Whether each interface must be provided by the right component (a lollipop on it). */
    boolean usesInterfaceProviders() {
        return family == Family.COMPONENT;
    }

    /** Whether use cases must sit inside a system boundary and actors outside it. */
    boolean usesSystemBoundary() {
        return family == Family.USE_CASE;
    }

    /** The diagram type's own name for a kind of element, as the result page groups them. */
    String nodeCategory(String nodeType) {
        String shape = group(nodeType);
        return switch (family) {
            case ERD -> "Entities";
            case CLASS -> "Classes";
            case USE_CASE -> switch (shape) {
                case "actor" -> "Actors";
                case "usecase" -> "Use cases";
                default -> "System boundary";
            };
            case SEQUENCE -> shape.equals("fragment") ? "Combined fragments" : "Participants";
            case COMPONENT -> switch (shape) {
                case "interface" -> "Interfaces";
                case "actor" -> "Actors";
                default -> "Components";
            };
            case FLOW -> switch (shape) {
                case "initial", "final", "flowfinal", "terminal" -> "Start and end";
                case "io" -> "Input / output";
                case "document" -> "Documents";
                case "predefined" -> "Predefined processes";
                case "preparation" -> "Preparations";
                case "manualop" -> "Manual operations";
                case "connector" -> "Connectors";
                case "decision" -> "Decisions";
                case "bar" -> "Fork and join bars";
                case "datastore" -> "Data stores";
                default -> activity ? "Actions" : "Process steps";
            };
            case GENERIC -> "Elements";
        };
    }

    /** The name for a node's rows: a class's attributes and operations, an entity's attributes. */
    String attributeCategory(String labelKey) {
        if (family == Family.CLASS) {
            return labelKey != null && labelKey.contains("(") ? "Operations" : "Attributes";
        }
        return "Attributes";
    }

    /** The name for a kind of relationship; {@code guarded} is a flow leaving a decision. */
    String edgeCategory(String relationKind, boolean guarded) {
        return switch (relationKind) {
            case "INHERITANCE" -> "Inheritance";
            case "REALIZATION" -> "Realizations";
            case "COMPOSITION" -> "Compositions";
            case "AGGREGATION" -> "Aggregations";
            case "DEPENDENCY" -> "Dependencies";
            case "ASSOCIATION" -> family == Family.USE_CASE ? "Actor associations" : "Associations";
            case "INCLUDE" -> "«include»";
            case "EXTEND" -> "«extend»";
            case "INCLUDE_EXTEND" -> "«include» / «extend»";
            case "GENERALIZATION" -> "Generalizations";
            case "SYNC" -> "Calls";
            case "ASYNC" -> "Asynchronous messages";
            case "RETURN" -> "Returns";
            case "CONTAINMENT" -> "Containment";
            case "RELATIONSHIP" -> "Relationships";
            case "SUBTYPE" -> "Supertypes / subtypes";
            case "FLOW" -> guarded ? "Decision branches" : "Flows";
            default -> "Connections";
        };
    }

    /** Whether a connector's cardinality is part of this notation. */
    boolean usesCardinality() {
        return family == Family.ERD || family == Family.CLASS || family == Family.COMPONENT
                || family == Family.GENERIC;
    }
}
