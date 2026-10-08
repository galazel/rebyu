const DIAGRAM_TOOL_PRESETS = {
    ACTIVITY_DIAGRAM: {
        label: "Activity Diagram",
        libs: "uml;flowchart",
    },
    UML_CLASS: {
        label: "Class Diagram",
        libs: "uml",
    },
    UML_COMPONENT: {
        label: "Component Diagram",
        libs: "uml",
    },
    ERD: {
        label: "ER Diagram",
        libs: "er",
    },
    FLOWCHART: {
        label: "Flowchart",
        libs: "flowchart",
    },
    SEQUENCE_DIAGRAM: {
        label: "Sequence Diagram",
        libs: "uml",
    },
    USE_CASE: {
        label: "Use Case Diagram",
        libs: "uml",
    },
    UI_DESIGN: {
        label: "UI Design",
        libs: "mockups;android;ios;bootstrap",
    },
}

const DIAGRAM_TYPE_ALIASES = {
    UML_SEQUENCE: "SEQUENCE_DIAGRAM",
    SEQUENCE: "SEQUENCE_DIAGRAM",
    CLASS_DIAGRAM: "UML_CLASS",
    CLASS: "UML_CLASS",
    COMPONENT_DIAGRAM: "UML_COMPONENT",
    COMPONENT: "UML_COMPONENT",
    ACTIVITY: "ACTIVITY_DIAGRAM",
    USE_CASE_DIAGRAM: "USE_CASE",
    USECASE: "USE_CASE",
    ER: "ERD",
    ER_DIAGRAM: "ERD",
    ENTITY_RELATIONSHIP: "ERD",
    ENTITY_RELATIONSHIP_DIAGRAM: "ERD",
    FLOW_CHART: "FLOWCHART",
    DFD: "FLOWCHART",
    MIND_MAP: "FLOWCHART",
    NETWORK_DIAGRAM: "UML_COMPONENT",
}

export function getDiagramToolPreset(diagramType) {
    const key = String(diagramType ?? "")
        .trim()
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, "_")
        .replace(/^_+|_+$/g, "")

    const resolved = DIAGRAM_TYPE_ALIASES[key] ?? key
    return DIAGRAM_TOOL_PRESETS[resolved] ?? DIAGRAM_TOOL_PRESETS.ERD
}

