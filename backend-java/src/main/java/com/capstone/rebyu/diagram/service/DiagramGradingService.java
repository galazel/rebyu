package com.capstone.rebyu.diagram.service;

import com.capstone.rebyu.diagram.dto.DiagramGraphDto;
import com.capstone.rebyu.diagram.dto.DiagramGradingRequestDto;
import com.capstone.rebyu.diagram.dto.DiagramGradingResultDto;
import com.capstone.rebyu.diagram.dto.DiagramGradingResultDto.ElementResultDto;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.Comparator;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class DiagramGradingService {

    private static final double SIM_STRONG = 0.85;
    private static final double SIM_MODERATE = 0.65;
    private static final double SIM_WEAK = 0.50;

    private static final Pattern KEY_MARKER = Pattern.compile(
            "\\b(pk|fk)\\b|primary key|foreign key|\\(pk\\)|\\(fk\\)");
    private static final Pattern CARDINALITY = Pattern.compile(
            "(?:^|\\s)(0\\.\\.1|1\\.\\.1|0\\.\\.\\*|1\\.\\.\\*|0\\.\\.n|1\\.\\.n|1\\.\\.m|\\*|n|m)(?:\\s|$)");
    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^a-z0-9]+");

    private final DiagramGraphExtractor extractor;

    private record NodeScore(
            boolean matched, String quality, double factor, DiagramGraphDto.Node matchedNode,
            String reason) {}
    private record EdgeScore(
            boolean matched, String quality, double factor, DiagramGraphDto.Edge matchedEdge,
            String reason) {}

    public DiagramGradingResultDto grade(DiagramGradingRequestDto request) {
        DiagramGraphDto reference;
        try {
            reference = extractor.extract(request.referenceXml());
        } catch (DiagramGraphExtractor.DiagramParseException e) {
            return invalidReference();
        }
        if (reference.nodes().isEmpty()) {
            return invalidReference();
        }

        DiagramGraphDto learner;
        try {
            learner = extractor.extract(request.learnerXml());
        } catch (DiagramGraphExtractor.DiagramParseException e) {
            learner = new DiagramGraphDto(List.of(), List.of());
        }

        BigDecimal maxPoints = request.maxPoints() == null ? BigDecimal.ZERO : request.maxPoints();

        if (learner.nodes().isEmpty() && learner.edges().isEmpty()) {
            return new DiagramGradingResultDto(
                    "EMPTY_SUBMISSION", BigDecimal.ZERO, maxPoints,
                    "No diagram content was submitted.", List.of());
        }

        record Pairing(int refIndex, DiagramGraphDto.Node learnerNode, double similarity) {}

        List<Pairing> pairings = new ArrayList<>();
        for (int i = 0; i < reference.nodes().size(); i++) {
            DiagramGraphDto.Node refNode = reference.nodes().get(i);
            for (DiagramGraphDto.Node candidate : learner.nodes()) {
                double similarity = labelSimilarity(refNode.labelKey(), candidate.labelKey());
                if (similarity > 0) {
                    pairings.add(new Pairing(i, candidate, similarity));
                }
            }
        }
        pairings.sort(Comparator.comparingDouble(Pairing::similarity).reversed());

        DiagramGraphDto.Node[] matchedNode = new DiagramGraphDto.Node[reference.nodes().size()];
        double[] matchedSimilarity = new double[reference.nodes().size()];
        Set<String> usedLearnerNodeIds = new HashSet<>();
        Set<Integer> assignedReferenceNodes = new HashSet<>();
        for (Pairing pairing : pairings) {
            if (assignedReferenceNodes.contains(pairing.refIndex())
                    || usedLearnerNodeIds.contains(pairing.learnerNode().id())) {
                continue;
            }
            matchedNode[pairing.refIndex()] = pairing.learnerNode();
            matchedSimilarity[pairing.refIndex()] = pairing.similarity();
            assignedReferenceNodes.add(pairing.refIndex());
            usedLearnerNodeIds.add(pairing.learnerNode().id());
        }

        Map<String, String> refToLearnerNodeId = new LinkedHashMap<>();
        List<NodeScore> nodeScores = new ArrayList<>();
        for (int i = 0; i < reference.nodes().size(); i++) {
            DiagramGraphDto.Node refNode = reference.nodes().get(i);
            NodeScore score = scoreNodeMatch(refNode, matchedNode[i], matchedSimilarity[i]);
            nodeScores.add(score);
            if (score.matched()) {
                refToLearnerNodeId.put(refNode.id(), matchedNode[i].id());
            }
        }

        Set<String> usedLearnerEdgeIds = new HashSet<>();
        List<EdgeScore> edgeScores = new ArrayList<>();
        for (DiagramGraphDto.Edge refEdge : reference.edges()) {
            edgeScores.add(scoreEdgeMatch(refEdge, refToLearnerNodeId, learner.edges(), usedLearnerEdgeIds));
        }

        int totalElements = nodeScores.size() + edgeScores.size();
        BigDecimal perElement = totalElements == 0
                ? BigDecimal.ZERO
                : maxPoints.divide(BigDecimal.valueOf(totalElements), 6, RoundingMode.HALF_UP);

        Map<String, DiagramGraphDto.Node> referenceNodesById = new LinkedHashMap<>();
        for (DiagramGraphDto.Node node : reference.nodes()) {
            referenceNodesById.put(node.id(), node);
        }
        Map<String, DiagramGraphDto.Node> learnerNodesById = new LinkedHashMap<>();
        for (DiagramGraphDto.Node node : learner.nodes()) {
            learnerNodesById.put(node.id(), node);
        }

        BigDecimal earnedRaw = BigDecimal.ZERO;
        List<ElementResultDto> elementResults = new ArrayList<>();
        int matchedNodes = 0;
        for (int i = 0; i < nodeScores.size(); i++) {
            NodeScore score = nodeScores.get(i);
            DiagramGraphDto.Node refNode = reference.nodes().get(i);
            BigDecimal raw = perElement.multiply(BigDecimal.valueOf(score.factor()));
            earnedRaw = earnedRaw.add(raw);
            if (score.matched()) matchedNodes++;
            elementResults.add(new ElementResultDto(
                    "NODE",
                    describeNode(refNode),
                    score.matched(),
                    score.quality(),
                    score.matchedNode() == null ? null : describeNode(score.matchedNode()),
                    score.reason(),
                    raw.setScale(2, RoundingMode.HALF_UP),
                    perElement.setScale(2, RoundingMode.HALF_UP)));
        }
        int matchedEdges = 0;
        for (int i = 0; i < edgeScores.size(); i++) {
            EdgeScore score = edgeScores.get(i);
            DiagramGraphDto.Edge refEdge = reference.edges().get(i);
            BigDecimal raw = perElement.multiply(BigDecimal.valueOf(score.factor()));
            earnedRaw = earnedRaw.add(raw);
            if (score.matched()) matchedEdges++;
            elementResults.add(new ElementResultDto(
                    "EDGE",
                    describeEdge(refEdge, referenceNodesById),
                    score.matched(),
                    score.quality(),
                    score.matchedEdge() == null ? null : describeEdge(score.matchedEdge(), learnerNodesById),
                    score.reason(),
                    raw.setScale(2, RoundingMode.HALF_UP),
                    perElement.setScale(2, RoundingMode.HALF_UP)));
        }

        BigDecimal earned = earnedRaw.min(maxPoints).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        String feedback = buildFeedback(matchedNodes, nodeScores.size(), matchedEdges, edgeScores.size());

        return new DiagramGradingResultDto("GRADED", earned, maxPoints, feedback, elementResults);
    }

    private NodeScore scoreNodeMatch(DiagramGraphDto.Node refNode, DiagramGraphDto.Node matched, double similarity) {
        if (matched == null || similarity < SIM_WEAK) {
            return new NodeScore(false, "NONE", 0.0, null,
                    "Nothing in your diagram matches this required element.");
        }

        List<String> reasons = new ArrayList<>();

        double base;
        String quality;
        if (similarity >= SIM_STRONG) {
            base = 1.0;
            quality = "STRONG";
        } else if (similarity >= SIM_MODERATE) {
            base = 0.7;
            quality = "PARTIAL";
            reasons.add("The label is close to the expected one but not the same.");
        } else {
            base = 0.4;
            quality = "WEAK";
            reasons.add("The label only loosely resembles the expected one.");
        }

        if (hasKeyMarker(refNode.labelKey()) && !hasKeyMarker(matched.labelKey())) {
            base *= 0.6;
            reasons.add("This element should be marked as a key (PK or FK); yours is not.");
        }

        String refType = refNode.nodeType();
        String matchedType = matched.nodeType();
        if (refType != null && matchedType != null
                && !"shape".equals(refType) && !"shape".equals(matchedType)
                && !refType.equals(matchedType)) {
            base *= 0.85;
            reasons.add("It is drawn as a " + matchedType + " where a " + refType + " was expected.");
        }

        return new NodeScore(true, quality, base, matched,
                reasons.isEmpty() ? "Matched what was expected." : String.join(" ", reasons));
    }

    private EdgeScore scoreEdgeMatch(
            DiagramGraphDto.Edge refEdge,
            Map<String, String> refToLearnerNodeId,
            List<DiagramGraphDto.Edge> learnerEdges,
            Set<String> usedLearnerEdgeIds) {
        String matchedSource = refToLearnerNodeId.get(refEdge.sourceId());
        String matchedTarget = refToLearnerNodeId.get(refEdge.targetId());
        if (matchedSource == null || matchedTarget == null) {
            return new EdgeScore(false, "NONE", 0.0, null,
                    "This relationship could not be checked: one of the elements it connects "
                            + "is missing from your diagram.");
        }

        DiagramGraphDto.Edge forward =
                bestEdge(learnerEdges, matchedSource, matchedTarget, refEdge, usedLearnerEdgeIds);
        DiagramGraphDto.Edge reversed = forward == null
                ? bestEdge(learnerEdges, matchedTarget, matchedSource, refEdge, usedLearnerEdgeIds) : null;
        DiagramGraphDto.Edge found = forward != null ? forward : reversed;
        if (found == null) {
            return new EdgeScore(false, "NONE", 0.0, null,
                    "You drew both elements but no connection between them.");
        }
        usedLearnerEdgeIds.add(found.id());

        boolean correctDirection = forward != null;
        boolean labelGood = labelMatchesWithCardinality(refEdge.labelKey(), found.labelKey());

        List<String> reasons = new ArrayList<>();
        if (!correctDirection) {
            reasons.add("It points the opposite way to the expected relationship.");
        }
        if (!labelGood) {
            Optional<String> expectedCardinality = cardinalityToken(refEdge.labelKey());
            Optional<String> drawnCardinality = cardinalityToken(found.labelKey());
            if (expectedCardinality.isPresent() && !expectedCardinality.equals(drawnCardinality)) {
                reasons.add(drawnCardinality
                        .map(drawn -> "The cardinality reads " + drawn + " where "
                                + expectedCardinality.get() + " was expected.")
                        .orElse("It is missing the expected cardinality ("
                                + expectedCardinality.get() + ")."));
            } else {
                reasons.add("Its label does not match the expected one.");
            }
        }

        double factor;
        String quality;
        if (correctDirection && labelGood) {
            factor = 1.0;
            quality = "STRONG";
        } else if (correctDirection) {
            factor = 0.7;
            quality = "PARTIAL";
        } else if (labelGood) {
            factor = 0.6;
            quality = "PARTIAL";
        } else {
            factor = 0.4;
            quality = "WEAK";
        }

        return new EdgeScore(true, quality, factor, found,
                reasons.isEmpty() ? "Matched what was expected." : String.join(" ", reasons));
    }

    private String describeNode(DiagramGraphDto.Node node) {
        return node.label() == null || node.label().isBlank() ? "(unlabeled node)" : node.label();
    }

    private String describeEdge(DiagramGraphDto.Edge edge, Map<String, DiagramGraphDto.Node> nodesById) {
        DiagramGraphDto.Node source = nodesById.get(edge.sourceId());
        DiagramGraphDto.Node target = nodesById.get(edge.targetId());
        String sourceLabel = source == null ? "?" : describeNode(source);
        String targetLabel = target == null ? "?" : describeNode(target);
        String base = sourceLabel + " → " + targetLabel;
        return edge.label() == null || edge.label().isBlank() ? base : base + " (" + edge.label() + ")";
    }

    private DiagramGraphDto.Edge bestEdge(
            List<DiagramGraphDto.Edge> edges,
            String sourceId,
            String targetId,
            DiagramGraphDto.Edge refEdge,
            Set<String> usedLearnerEdgeIds) {
        DiagramGraphDto.Edge fallback = null;
        for (DiagramGraphDto.Edge edge : edges) {
            if (usedLearnerEdgeIds.contains(edge.id())
                    || !edge.sourceId().equals(sourceId)
                    || !edge.targetId().equals(targetId)) {
                continue;
            }
            if (labelMatchesWithCardinality(refEdge.labelKey(), edge.labelKey())) {
                return edge;
            }
            if (fallback == null) {
                fallback = edge;
            }
        }
        return fallback;
    }

    private boolean labelMatchesWithCardinality(String refLabelKey, String learnerLabelKey) {
        boolean textGood = labelSimilarity(refLabelKey, learnerLabelKey) >= SIM_MODERATE;
        Optional<String> refCardinality = cardinalityToken(refLabelKey);
        if (refCardinality.isPresent()) {
            Optional<String> learnerCardinality = cardinalityToken(learnerLabelKey);
            return textGood && learnerCardinality.isPresent()
                    && learnerCardinality.get().equals(refCardinality.get());
        }
        return textGood;
    }

    private double labelSimilarity(String a, String b) {
        String x = a == null ? "" : a.trim();
        String y = b == null ? "" : b.trim();
        if (x.isEmpty() && y.isEmpty()) return 1.0;
        if (x.isEmpty() || y.isEmpty()) return 0.0;
        if (x.equals(y)) return 1.0;
        if (x.contains(y) || y.contains(x)) {
            double ratio = (double) Math.min(x.length(), y.length()) / Math.max(x.length(), y.length());
            return 0.6 + 0.2 * ratio;
        }
        Set<String> tokensX = tokenize(x);
        Set<String> tokensY = tokenize(y);
        if (tokensX.isEmpty() || tokensY.isEmpty()) return 0.0;
        Set<String> intersection = new HashSet<>(tokensX);
        intersection.retainAll(tokensY);
        Set<String> union = new HashSet<>(tokensX);
        union.addAll(tokensY);
        return union.isEmpty() ? 0.0 : ((double) intersection.size() / union.size()) * 0.7;
    }

    private Set<String> tokenize(String value) {
        return Arrays.stream(TOKEN_SPLIT.split(value))
                .filter(token -> !token.isBlank())
                .collect(Collectors.toSet());
    }

    private boolean hasKeyMarker(String labelKey) {
        return labelKey != null && KEY_MARKER.matcher(labelKey).find();
    }

    private Optional<String> cardinalityToken(String labelKey) {
        if (labelKey == null) return Optional.empty();
        Matcher matcher = CARDINALITY.matcher(labelKey);
        return matcher.find() ? Optional.of(matcher.group(1)) : Optional.empty();
    }

    private String buildFeedback(int matchedNodes, int totalNodes, int matchedEdges, int totalEdges) {
        StringBuilder feedback = new StringBuilder();
        feedback.append(matchedNodes).append(" of ").append(totalNodes)
                .append(" required element(s) matched");
        if (totalEdges > 0) {
            feedback.append(", and ").append(matchedEdges).append(" of ").append(totalEdges)
                    .append(" required relationship(s) matched");
        }
        feedback.append(". ");

        double nodeRatio = totalNodes == 0 ? 1 : (double) matchedNodes / totalNodes;
        double edgeRatio = totalEdges == 0 ? 1 : (double) matchedEdges / totalEdges;
        if (nodeRatio >= 0.9 && edgeRatio >= 0.9) {
            feedback.append("Your diagram closely matches the expected structure.");
        } else if (nodeRatio < 0.5 || edgeRatio < 0.5) {
            feedback.append("Several required elements or relationships are missing or do not match "
                    + "— review the instructions and make sure every required part is included.");
        } else {
            feedback.append("Some required elements or relationships are missing, mislabeled, "
                    + "or point in the wrong direction.");
        }
        return feedback.toString();
    }

    private DiagramGradingResultDto invalidReference() {
        return new DiagramGradingResultDto(
                "INVALID_REFERENCE", null, null,
                "This item's reference diagram is not gradeable yet.", List.of());
    }
}
