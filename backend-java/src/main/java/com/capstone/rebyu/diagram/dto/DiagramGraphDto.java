package com.capstone.rebyu.diagram.dto;

import java.util.List;

public record DiagramGraphDto(List<Node> nodes, List<Edge> edges) {

    public record Node(String id, String label, String labelKey, String nodeType) {}

    public record Edge(
            String id,
            String sourceId,
            String targetId,
            String label,
            String labelKey
    ) {}
}
