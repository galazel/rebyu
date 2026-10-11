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
import java.util.HashMap;
import java.util.HashSet;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;

/**
 * Grades a learner's diagram by comparing it with the question's reference diagram,
 * under the notation rules of its diagram type ({@link DiagramNotation}).
 */
@Service
@RequiredArgsConstructor
public class DiagramGradingService {

    private static final double SIM_STRONG = 0.85;
    private static final double SIM_MODERATE = 0.65;
    private static final double SIM_WEAK = 0.50;

    /**
     * An attribute (ERD column, class member) is worth half a node or an edge: a
     * table's rows matter, but ten columns must not outweigh the relationships.
     */
    private static final double ATTRIBUTE_WEIGHT = 0.5;

    /**
     * Share of each required part -- elements, relationships, attributes -- an answer
     * must get right before it can count as correct. Points stay proportional, but a
     * high total must not hide a whole part left out or drawn in the wrong notation:
     * an ERD with no relationships, or a class diagram whose inheritance is all drawn
     * as plain lines, is not correct. An element counts only in the right kind of
     * shape; a relationship only of the right kind, pointing the right way, and --
     * in a sequence diagram -- in the right order. Labels may still be partly off.
     */
    private static final double PART_MINIMUM = 0.5;

    private static final double WRONG_DIRECTION = 0.6;
    private static final double WRONG_KIND = 0.6;
    private static final double WRONG_LABEL = 0.7;
    private static final double OUT_OF_ORDER = 0.7;
    private static final double WRONG_SHAPE = 0.7;

    private static final Pattern KEY_MARKER = Pattern.compile(
            "\\b(pk|fk)\\d*\\b|primary key|foreign key|\\(pk\\)|\\(fk\\)");
    private static final Pattern CARDINALITY = Pattern.compile(
            "(?:^|\\s)(0\\.\\.1|1\\.\\.1|0\\.\\.\\*|1\\.\\.\\*|0\\.\\.n|1\\.\\.n|1\\.\\.m|0\\.\\.m|\\*|n|m|1)(?=\\s|$)");
    private static final Pattern MESSAGE_NUMBER = Pattern.compile("^\\s*\\d+(\\.\\d+)*\\s*(?:[:)]|\\.(?!\\.))\\s*");
    private static final Pattern TOKEN_SPLIT = Pattern.compile("[^a-z0-9]+");

    private final DiagramGraphExtractor extractor;

    private record NodeScore(
            boolean matched, String quality, double factor, DiagramGraphDto.Node matchedNode,
            String reason, boolean notationRight) {
        NodeScore(boolean matched, String quality, double factor, DiagramGraphDto.Node matchedNode, String reason) {
            this(matched, quality, factor, matchedNode, reason, matched);
        }
    }
    private record EdgeScore(
            boolean matched, String quality, double factor, DiagramGraphDto.Edge matchedEdge,
            String reason, boolean notationRight) {
        EdgeScore(boolean matched, String quality, double factor, DiagramGraphDto.Edge matchedEdge, String reason) {
            this(matched, quality, factor, matchedEdge, reason, matched);
        }
    }

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

        DiagramNotation notation = DiagramNotation.of(request.diagramType());

        double[] matchedSimilarity = new double[reference.nodes().size()];
        boolean[] byPosition = new boolean[reference.nodes().size()];
        DiagramGraphDto.Node[] matchedNode = pairNodes(reference, learner, notation, matchedSimilarity, byPosition);

        Map<String, String> refToLearnerNodeId = new LinkedHashMap<>();
        List<NodeScore> nodeScores = new ArrayList<>();
        for (int i = 0; i < reference.nodes().size(); i++) {
            DiagramGraphDto.Node refNode = reference.nodes().get(i);
            NodeScore score = scoreNodeMatch(refNode, matchedNode[i], matchedSimilarity[i], notation, byPosition[i]);
            nodeScores.add(score);
            if (score.matched()) {
                refToLearnerNodeId.put(refNode.id(), matchedNode[i].id());
            }
        }

        Set<String> usedLearnerEdgeIds = new HashSet<>();
        List<EdgeScore> edgeScores = new ArrayList<>();
        for (DiagramGraphDto.Edge refEdge : reference.edges()) {
            edgeScores.add(scoreEdgeMatch(refEdge, refToLearnerNodeId, learner.edges(), usedLearnerEdgeIds, notation));
        }
        if (notation.ordered()) {
            applyMessageOrder(reference.edges(), edgeScores);
        }

        Set<String> askedWords = isBlank(request.questionText())
                ? null : contentWords(request.questionText().toLowerCase(Locale.ROOT));
        List<List<NodeScore>> attributeScores = new ArrayList<>();
        int attributeCount = 0;
        for (int i = 0; i < reference.nodes().size(); i++) {
            List<NodeScore> scores = scoreAttributes(reference.nodes().get(i), nodeScores.get(i), askedWords);
            attributeScores.add(scores);
            attributeCount += (int) scores.stream().filter(s -> !OPTIONAL.equals(s.quality())).count();
        }

        double totalWeight = nodeScores.size() + edgeScores.size() + attributeCount * ATTRIBUTE_WEIGHT;
        BigDecimal perElement = totalWeight == 0
                ? BigDecimal.ZERO
                : maxPoints.divide(BigDecimal.valueOf(totalWeight), 6, RoundingMode.HALF_UP);
        BigDecimal perAttribute = perElement.multiply(BigDecimal.valueOf(ATTRIBUTE_WEIGHT));

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
        int attributesMatched = 0;
        int attributesTotal = 0;
        for (int i = 0; i < nodeScores.size(); i++) {
            NodeScore score = nodeScores.get(i);
            DiagramGraphDto.Node refNode = reference.nodes().get(i);
            BigDecimal raw = perElement.multiply(BigDecimal.valueOf(score.factor()));
            earnedRaw = earnedRaw.add(raw);
            if (score.matched()) matchedNodes++;
            elementResults.add(new ElementResultDto(
                    "NODE",
                    describeNode(refNode, notation),
                    score.matched(),
                    score.quality(),
                    score.matchedNode() == null ? null : describeNode(score.matchedNode(), notation),
                    score.reason(),
                    raw.setScale(2, RoundingMode.HALF_UP),
                    perElement.setScale(2, RoundingMode.HALF_UP)));

            List<DiagramGraphDto.Attribute> expected = refNode.attributes();
            List<NodeScore> scores = attributeScores.get(i);
            for (int k = 0; k < scores.size(); k++) {
                NodeScore attribute = scores.get(k);
                boolean optional = OPTIONAL.equals(attribute.quality());
                BigDecimal attributeRaw = optional
                        ? BigDecimal.ZERO : perAttribute.multiply(BigDecimal.valueOf(attribute.factor()));
                earnedRaw = earnedRaw.add(attributeRaw);
                if (!optional) {
                    attributesTotal++;
                    if (attribute.matched()) attributesMatched++;
                }
                elementResults.add(new ElementResultDto(
                        "ATTRIBUTE",
                        plainLabel(refNode) + " . " + expected.get(k).label(),
                        attribute.matched(),
                        attribute.quality(),
                        attribute.matchedNode() == null ? null : attribute.matchedNode().label(),
                        attribute.reason(),
                        attributeRaw.setScale(2, RoundingMode.HALF_UP),
                        (optional ? BigDecimal.ZERO : perAttribute).setScale(2, RoundingMode.HALF_UP)));
            }
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
                    describeEdge(refEdge, referenceNodesById, notation),
                    score.matched(),
                    score.quality(),
                    score.matchedEdge() == null ? null
                            : describeEdge(score.matchedEdge(), learnerNodesById, notation),
                    score.reason(),
                    raw.setScale(2, RoundingMode.HALF_UP),
                    perElement.setScale(2, RoundingMode.HALF_UP)));
        }

        BigDecimal earned = earnedRaw.min(maxPoints).max(BigDecimal.ZERO).setScale(2, RoundingMode.HALF_UP);
        String feedback = buildFeedback(matchedNodes, nodeScores.size(), matchedEdges, edgeScores.size(),
                attributesMatched, attributesTotal);

        int rightNodes = (int) nodeScores.stream().filter(NodeScore::notationRight).count();
        int rightEdges = (int) edgeScores.stream().filter(EdgeScore::notationRight).count();
        boolean coversEveryPart = partCovered(rightNodes, nodeScores.size())
                && partCovered(rightEdges, edgeScores.size())
                && partCovered(attributesMatched, attributesTotal);
        return new DiagramGradingResultDto("GRADED", earned, maxPoints, feedback, elementResults, coversEveryPart);
    }

    /**
     * Pairs every reference node with at most one learner node. Labelled nodes pair
     * by name, best match first. Unlabelled ones -- an activity's start dot, its
     * fork bars, a flowchart's bare decision -- have no name to go by, so they pair
     * by kind, choosing the candidate whose connections agree most with the nodes
     * already paired: the bar that forks after "Validate order" is the one whose
     * learner counterpart also follows "Validate order".
     */
    private DiagramGraphDto.Node[] pairNodes(
            DiagramGraphDto reference, DiagramGraphDto learner, DiagramNotation notation,
            double[] similarityOut, boolean[] byPositionOut) {
        record Pairing(int refIndex, DiagramGraphDto.Node learnerNode, double similarity) {}

        List<DiagramGraphDto.Node> refNodes = reference.nodes();
        DiagramGraphDto.Node[] matched = new DiagramGraphDto.Node[refNodes.size()];
        Set<String> used = new HashSet<>();

        List<Pairing> pairings = new ArrayList<>();
        for (int i = 0; i < refNodes.size(); i++) {
            if (isBlank(refNodes.get(i).labelKey())) continue;
            for (DiagramGraphDto.Node candidate : learner.nodes()) {
                double similarity = nodeSimilarity(refNodes.get(i), candidate, notation);
                if (similarity > 0) {
                    pairings.add(new Pairing(i, candidate, similarity));
                }
            }
        }
        pairings.sort(Comparator.comparingDouble(Pairing::similarity).reversed());
        for (Pairing pairing : pairings) {
            if (matched[pairing.refIndex()] != null || used.contains(pairing.learnerNode().id())) {
                continue;
            }
            if (pairing.similarity() < SIM_WEAK) continue;
            matched[pairing.refIndex()] = pairing.learnerNode();
            similarityOut[pairing.refIndex()] = pairing.similarity();
            used.add(pairing.learnerNode().id());
        }

        Map<String, Integer> refIndexById = new HashMap<>();
        for (int i = 0; i < refNodes.size(); i++) {
            refIndexById.put(refNodes.get(i).id(), i);
        }

        // Then, round by round, the nodes a label cannot place. Labelled steps worded
        // differently pair with a node in the same place -- connected to the same
        // already-paired neighbours. Unlabelled shapes (start dot, fork bar, bare
        // decision) pair by kind and the same neighbour agreement. Each round's pairs
        // give the next round more neighbours to agree with.
        for (int round = 0; round < ROUNDS; round++) {
            for (int i = 0; i < refNodes.size(); i++) {
                DiagramGraphDto.Node refNode = refNodes.get(i);
                if (matched[i] != null || isBlank(refNode.labelKey())) continue;
                Set<String> refWords = contentWords(refNode.labelKey());
                DiagramGraphDto.Node best = null;
                int bestScore = 0;
                double bestSimilarity = 0;
                for (DiagramGraphDto.Node candidate : learner.nodes()) {
                    if (used.contains(candidate.id()) || isBlank(candidate.labelKey())
                            || !notation.sameShape(refNode.nodeType(), candidate.nodeType())
                            || nodeSimilarity(refNode, candidate, notation) == 0.0
                                    && "fragment".equals(refNode.nodeType())) {
                        continue;
                    }
                    int agreement = neighbourAgreement(refNode, candidate, reference, learner, matched, refIndexById);
                    Set<String> shared = new HashSet<>(contentWords(candidate.labelKey()));
                    shared.retainAll(refWords);
                    double similarity;
                    if (agreement >= 2 && !shared.isEmpty()) {
                        similarity = SIM_MODERATE;
                    } else if (agreement >= 4) {
                        similarity = SIM_WEAK;
                    } else {
                        continue;
                    }
                    int score = agreement + 2 * shared.size();
                    if (score > bestScore) {
                        best = candidate;
                        bestScore = score;
                        bestSimilarity = similarity;
                    }
                }
                if (best != null) {
                    matched[i] = best;
                    similarityOut[i] = bestSimilarity;
                    byPositionOut[i] = true;
                    used.add(best.id());
                }
            }
            for (int i = 0; i < refNodes.size(); i++) {
                DiagramGraphDto.Node refNode = refNodes.get(i);
                if (matched[i] != null || !isBlank(refNode.labelKey())) continue;
                DiagramGraphDto.Node best = null;
                int bestAgreement = -1;
                for (DiagramGraphDto.Node candidate : learner.nodes()) {
                    if (used.contains(candidate.id()) || !isBlank(candidate.labelKey())
                            || !notation.sameShape(refNode.nodeType(), candidate.nodeType())) {
                        continue;
                    }
                    int agreement = neighbourAgreement(
                            refNode, candidate, reference, learner, matched, refIndexById);
                    if (agreement > bestAgreement) {
                        best = candidate;
                        bestAgreement = agreement;
                    }
                }
                boolean lastRound = round == ROUNDS - 1;
                if (best != null && (bestAgreement > 0 || lastRound)) {
                    matched[i] = best;
                    similarityOut[i] = 1.0;
                    used.add(best.id());
                }
            }
        }
        return matched;
    }

    private static final int ROUNDS = 4;

    private int neighbourAgreement(
            DiagramGraphDto.Node refNode, DiagramGraphDto.Node candidate,
            DiagramGraphDto reference, DiagramGraphDto learner,
            DiagramGraphDto.Node[] matched, Map<String, Integer> refIndexById) {
        int agreement = 0;
        for (DiagramGraphDto.Edge edge : reference.edges()) {
            String other;
            boolean outgoing;
            if (edge.sourceId().equals(refNode.id())) {
                other = edge.targetId();
                outgoing = true;
            } else if (edge.targetId().equals(refNode.id())) {
                other = edge.sourceId();
                outgoing = false;
            } else {
                continue;
            }
            Integer otherIndex = refIndexById.get(other);
            DiagramGraphDto.Node otherMatch = otherIndex == null ? null : matched[otherIndex];
            if (otherMatch == null) continue;
            for (DiagramGraphDto.Edge drawn : learner.edges()) {
                boolean forward = drawn.sourceId().equals(candidate.id()) && drawn.targetId().equals(otherMatch.id());
                boolean backward = drawn.targetId().equals(candidate.id()) && drawn.sourceId().equals(otherMatch.id());
                if ((outgoing && forward) || (!outgoing && backward)) {
                    agreement += 2;
                    break;
                }
                if (forward || backward) {
                    agreement += 1;
                    break;
                }
            }
        }
        return agreement;
    }

    private double nodeSimilarity(DiagramGraphDto.Node ref, DiagramGraphDto.Node drawn, DiagramNotation notation) {
        boolean refFragment = "fragment".equals(ref.nodeType());
        boolean drawnFragment = "fragment".equals(drawn.nodeType());
        if (notation.family() == DiagramNotation.Family.SEQUENCE && (refFragment || drawnFragment)) {
            if (!(refFragment && drawnFragment)) return 0.0;
            return fragmentOperator(ref.labelKey()).equals(fragmentOperator(drawn.labelKey())) ? 1.0 : 0.3;
        }
        boolean refBlank = isBlank(ref.labelKey());
        boolean drawnBlank = isBlank(drawn.labelKey());
        if (refBlank || drawnBlank) {
            return refBlank && drawnBlank && notation.sameShape(ref.nodeType(), drawn.nodeType()) ? 1.0 : 0.0;
        }
        double similarity = labelSimilarity(withoutStereotype(ref.labelKey()), withoutStereotype(drawn.labelKey()));
        if (similarity > 0 && notation.sameShape(ref.nodeType(), drawn.nodeType())) {
            similarity = Math.min(1.0, similarity + 0.01);
        }
        return similarity;
    }

    /** "«abstract» PaymentGateway" is named PaymentGateway; the stereotype is a separate fact. */
    private static String withoutStereotype(String labelKey) {
        return labelKey == null ? "" : labelKey.replaceAll("\u00ab[^\u00bb]*\u00bb", " ").trim();
    }

    /** A combined fragment's operator -- alt, opt, loop, par -- which is what it means; its guard is text. */
    private static String fragmentOperator(String labelKey) {
        String text = labelKey == null ? "" : labelKey.trim();
        int space = text.indexOf(' ');
        int bracket = text.indexOf('[');
        int cut = text.length();
        if (space >= 0) cut = Math.min(cut, space);
        if (bracket >= 0) cut = Math.min(cut, bracket);
        return text.substring(0, cut);
    }

    private NodeScore scoreNodeMatch(
            DiagramGraphDto.Node refNode, DiagramGraphDto.Node matched, double similarity, DiagramNotation notation,
            boolean byPosition) {
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
            reasons.add(byPosition
                    ? "Matched by its place in the diagram -- it connects to the same elements -- but it is "
                            + "worded differently from the expected \"" + refNode.label() + "\"."
                    : "The label is close to the expected one but not the same.");
        } else {
            base = 0.4;
            quality = "WEAK";
            reasons.add(byPosition
                    ? "Only its place in the diagram matches: it connects to the same elements, but its label "
                            + "shares nothing with the expected \"" + refNode.label() + "\"."
                    : "The label only loosely resembles the expected one.");
        }

        if (hasKeyMarker(refNode.labelKey()) && !hasKeyMarker(matched.labelKey())) {
            base *= 0.6;
            reasons.add("This element should be marked as a key (PK or FK); yours is not.");
        }

        boolean rightShape = notation.sameShape(refNode.nodeType(), matched.nodeType());
        if (!rightShape) {
            base *= WRONG_SHAPE;
            if (quality.equals("STRONG")) quality = "PARTIAL";
            reasons.add("It is drawn as " + notation.shapeName(matched.nodeType()) + " where "
                    + notation.shapeName(refNode.nodeType()) + " was expected.");
        }

        return new NodeScore(true, quality, base, matched,
                reasons.isEmpty() ? "Matched what was expected." : String.join(" ", reasons), rightShape);
    }

    /**
     * One reference connector against the learner's connectors between the same two
     * elements. What counts depends on the notation: an ERD line has no direction,
     * a class diagram's inheritance does; a sequence message's kind (call, return,
     * asynchronous) matters, a flowchart arrow's style does not.
     */
    private EdgeScore scoreEdgeMatch(
            DiagramGraphDto.Edge refEdge,
            Map<String, String> refToLearnerNodeId,
            List<DiagramGraphDto.Edge> learnerEdges,
            Set<String> usedLearnerEdgeIds,
            DiagramNotation notation) {
        String matchedSource = refToLearnerNodeId.get(refEdge.sourceId());
        String matchedTarget = refToLearnerNodeId.get(refEdge.targetId());
        if (matchedSource == null || matchedTarget == null) {
            return new EdgeScore(false, "NONE", 0.0, null,
                    "This relationship could not be checked: one of the elements it connects "
                            + "is missing from your diagram.");
        }

        String expectedKind = notation.relationKind(refEdge.kind());
        boolean directed = notation.directed(expectedKind);

        DiagramGraphDto.Edge best = null;
        boolean bestForward = false;
        double bestFactor = -1;
        for (DiagramGraphDto.Edge edge : learnerEdges) {
            if (usedLearnerEdgeIds.contains(edge.id())) continue;
            boolean forward = edge.sourceId().equals(matchedSource) && edge.targetId().equals(matchedTarget);
            boolean backward = edge.sourceId().equals(matchedTarget) && edge.targetId().equals(matchedSource);
            if (!forward && !backward) continue;
            double factor = 1.0;
            if (directed && !forward) factor *= WRONG_DIRECTION;
            if (!expectedKind.equals(notation.relationKind(edge.kind()))) factor *= WRONG_KIND;
            if (!edgeLabelMatches(refEdge, edge, forward, notation)) {
                factor *= cardinalityMatches(refEdge, edge, forward, notation)
                        ? notation.labelPenalty() : WRONG_LABEL;
            }
            if (factor > bestFactor || (factor == bestFactor && forward && !bestForward)) {
                best = edge;
                bestForward = forward;
                bestFactor = factor;
            }
        }
        if (best == null) {
            return new EdgeScore(false, "NONE", 0.0, null,
                    "You drew both elements but no connection between them.");
        }
        usedLearnerEdgeIds.add(best.id());

        List<String> reasons = new ArrayList<>();
        if (directed && !bestForward) {
            reasons.add("It points the opposite way to the expected relationship.");
        }
        String drawnKind = notation.relationKind(best.kind());
        if (!expectedKind.equals(drawnKind)) {
            reasons.add("It is drawn as " + notation.relationName(drawnKind) + " where "
                    + notation.relationName(expectedKind) + " was expected.");
        }
        if (!edgeLabelMatches(refEdge, best, bestForward, notation)) {
            Optional<String> expectedCardinality = notation.usesCardinality() ? cardinalityOf(refEdge) : Optional.empty();
            Optional<String> drawnCardinality = cardinalityOf(best, bestForward, refEdge);
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

        Optional<String> requiredCardinality = notation.usesCardinality() ? cardinalityOf(refEdge) : Optional.empty();
        boolean rightCardinality = requiredCardinality.isEmpty()
                || requiredCardinality.equals(cardinalityOf(best, bestForward, refEdge));
        boolean rightNotation = (!directed || bestForward) && expectedKind.equals(drawnKind) && rightCardinality;
        String quality = bestFactor >= 1.0 ? "STRONG" : bestFactor >= 0.6 ? "PARTIAL" : "WEAK";
        return new EdgeScore(true, quality, bestFactor, best,
                reasons.isEmpty() ? "Matched what was expected." : String.join(" ", reasons), rightNotation);
    }

    /**
     * A sequence diagram is read top to bottom, so its messages must come in the
     * reference's order. The longest run of matched messages already in order is
     * taken as right; any other matched message loses credit for its position.
     */
    private void applyMessageOrder(List<DiagramGraphDto.Edge> refEdges, List<EdgeScore> scores) {
        List<Integer> placed = new ArrayList<>();
        for (int i = 0; i < refEdges.size(); i++) {
            EdgeScore score = scores.get(i);
            if (score.matched() && !Double.isNaN(score.matchedEdge().order())
                    && !Double.isNaN(refEdges.get(i).order())) {
                placed.add(i);
            }
        }
        if (placed.size() < 2) return;
        placed.sort(Comparator.comparingDouble(i -> refEdges.get(i).order()));

        int n = placed.size();
        int[] length = new int[n];
        int[] previous = new int[n];
        int bestEnd = 0;
        for (int a = 0; a < n; a++) {
            length[a] = 1;
            previous[a] = -1;
            double orderA = scores.get(placed.get(a)).matchedEdge().order();
            for (int b = 0; b < a; b++) {
                if (scores.get(placed.get(b)).matchedEdge().order() < orderA && length[b] + 1 > length[a]) {
                    length[a] = length[b] + 1;
                    previous[a] = b;
                }
            }
            if (length[a] > length[bestEnd]) bestEnd = a;
        }
        Set<Integer> inOrder = new HashSet<>();
        for (int at = bestEnd; at >= 0; at = previous[at]) {
            inOrder.add(placed.get(at));
        }
        for (int index : placed) {
            if (inOrder.contains(index)) continue;
            EdgeScore score = scores.get(index);
            String reason = "It comes out of order: the expected sequence places it elsewhere."
                    + (score.reason().startsWith("Matched") ? "" : " " + score.reason());
            scores.set(index, new EdgeScore(true, "PARTIAL", score.factor() * OUT_OF_ORDER,
                    score.matchedEdge(), reason, false));
        }
    }

    /**
     * Compares connector labels by what they say, not how they are dressed: message
     * numbers ("3: reserveStock()"), stereotype brackets ("<<include>>" vs
     * "«include»") and guard brackets ("[yes]") are ignored; a call matches by
     * operation name; cardinality is compared on its own, written or drawn as a
     * crow's foot. An unlabelled reference connector asks for no label.
     */
    private boolean cardinalityMatches(
            DiagramGraphDto.Edge ref, DiagramGraphDto.Edge drawn, boolean forward, DiagramNotation notation) {
        Optional<String> expected = notation.usesCardinality() ? cardinalityOf(ref) : Optional.empty();
        return expected.isEmpty() || expected.equals(cardinalityOf(drawn, forward, ref));
    }

    private boolean edgeLabelMatches(
            DiagramGraphDto.Edge ref, DiagramGraphDto.Edge drawn, boolean forward, DiagramNotation notation) {
        boolean cardinality = notation.usesCardinality();
        String expected = edgeText(ref.labelKey(), cardinality);
        String given = edgeText(drawn.labelKey(), cardinality);

        Optional<String> expectedCardinality = cardinality ? cardinalityOf(ref) : Optional.empty();
        if (expectedCardinality.isPresent()) {
            Optional<String> drawnCardinality = cardinalityOf(drawn, forward, ref);
            if (drawnCardinality.isEmpty() || !drawnCardinality.get().equals(expectedCardinality.get())) {
                return false;
            }
        }
        if (expected.isEmpty()) return true;
        if (given.isEmpty()) return false;

        int expectedCall = expected.indexOf('(');
        int givenCall = given.indexOf('(');
        if (expectedCall > 0 || givenCall > 0) {
            String expectedName = (expectedCall > 0 ? expected.substring(0, expectedCall) : expected).trim();
            String givenName = (givenCall > 0 ? given.substring(0, givenCall) : given).trim();
            if (!expectedName.isEmpty() && expectedName.equals(givenName)) return true;
        }
        if (labelSimilarity(expected, given) >= SIM_MODERATE) return true;

        // A guard written with commentary -- "[yes: return to architecture]" -- is the
        // guard "yes"; the rest explains it. The bare guard is a full answer.
        int colon = expected.indexOf(':');
        if (colon > 0 && expectedCall < 0) {
            String guard = expected.substring(0, colon).trim();
            return !guard.isEmpty() && labelSimilarity(guard, given) >= SIM_STRONG;
        }
        return false;
    }

    private String edgeText(String labelKey, boolean stripCardinality) {
        if (labelKey == null) return "";
        String text = MESSAGE_NUMBER.matcher(labelKey).replaceFirst("");
        text = text.replaceAll("[«»<>\\[\\]{}]", " ");
        if (stripCardinality) {
            text = CARDINALITY.matcher(" " + text + " ").replaceAll(" ");
        }
        return text.replaceAll("\\s+", " ").trim();
    }

    /** The reference's required multiplicity: at its target end, else at its source end. */
    private Optional<String> cardinalityOf(DiagramGraphDto.Edge edge) {
        return Optional.ofNullable(edge.cardinality() != null ? edge.cardinality() : edge.sourceCardinality());
    }

    /**
     * The learner's multiplicity for the end where the reference requires one. A
     * written one ("places 0..*") is taken as is: which end it describes depends on
     * where it sits on the line, which the file does not say, and learners draw ERD
     * lines from either entity. A crow's foot is read at the matching end -- the
     * source end when the connector was drawn from the other side.
     */
    private Optional<String> cardinalityOf(DiagramGraphDto.Edge drawn, boolean forward, DiagramGraphDto.Edge ref) {
        Optional<String> written = writtenCardinality(drawn.labelKey());
        if (written.isPresent()) return written;
        boolean atRefTarget = ref.cardinality() != null;
        String value = atRefTarget == forward ? drawn.cardinality() : drawn.sourceCardinality();
        return Optional.ofNullable(value);
    }

    private Optional<String> writtenCardinality(String labelKey) {
        if (labelKey == null) return Optional.empty();
        Matcher matcher = CARDINALITY.matcher(MESSAGE_NUMBER.matcher(labelKey).replaceFirst(""));
        return matcher.find()
                ? Optional.of(DiagramGraphExtractor.canonicalCardinality(matcher.group(1)))
                : Optional.empty();
    }

    /**
     * Each attribute of a reference node, matched against the attributes of the
     * learner's node it was paired with. A node the learner never drew scores none
     * of its attributes. Matching is one-to-one, best similarity first.
     */
    private static final String OPTIONAL = "OPTIONAL";

    /** Words that only say a column is an identifier; they never show the question asked for it. */
    private static final Set<String> IDENTIFIER_WORDS = Set.of("id", "no", "num", "number", "code", "key", "ref");

    /**
     * Whether the question asks for this attribute. Keys always count -- every model-
     * building task asks for them. Any other attribute counts when one of its own words
     * (not the identifier words, not its entity's name) appears in the question:
     * "date it was acquired" asks for acquiredOn. An attribute the reference added that
     * the question never mentions -- a publisher's country, a method of the model
     * answer's choosing -- is optional: it neither earns nor costs points.
     */
    private boolean askedFor(DiagramGraphDto.Attribute attribute, DiagramGraphDto.Node owner, Set<String> askedWords) {
        if (askedWords == null || hasKeyMarker(attribute.labelKey())) return true;
        Set<String> words = contentWords(attributeName(attribute.labelKey()));
        words.removeAll(IDENTIFIER_WORDS);
        words.removeAll(contentWords(withoutStereotype(owner.labelKey())));
        if (words.isEmpty()) return true;
        for (String word : words) {
            if (askedWords.contains(word)) return true;
        }
        return false;
    }

    private List<NodeScore> scoreAttributes(DiagramGraphDto.Node refNode, NodeScore nodeScore, Set<String> askedWords) {
        List<DiagramGraphDto.Attribute> expected = refNode.attributes();
        if (expected.isEmpty()) {
            return List.of();
        }
        List<DiagramGraphDto.Attribute> drawn = nodeScore.matched() && nodeScore.matchedNode() != null
                ? nodeScore.matchedNode().attributes() : List.of();

        record Pair(int expectedIndex, int drawnIndex, double similarity) {}
        List<Pair> pairs = new ArrayList<>();
        for (int e = 0; e < expected.size(); e++) {
            for (int d = 0; d < drawn.size(); d++) {
                double similarity = attributeSimilarity(expected.get(e).labelKey(), drawn.get(d).labelKey());
                if (similarity > 0) {
                    pairs.add(new Pair(e, d, similarity));
                }
            }
        }
        pairs.sort(Comparator.comparingDouble(Pair::similarity).reversed());

        DiagramGraphDto.Attribute[] match = new DiagramGraphDto.Attribute[expected.size()];
        double[] similarity = new double[expected.size()];
        Set<Integer> usedDrawn = new HashSet<>();
        for (Pair pair : pairs) {
            if (match[pair.expectedIndex()] != null || usedDrawn.contains(pair.drawnIndex())) {
                continue;
            }
            match[pair.expectedIndex()] = drawn.get(pair.drawnIndex());
            similarity[pair.expectedIndex()] = pair.similarity();
            usedDrawn.add(pair.drawnIndex());
        }

        List<NodeScore> scores = new ArrayList<>();
        for (int e = 0; e < expected.size(); e++) {
            DiagramGraphDto.Attribute attribute = match[e];
            if (!askedFor(expected.get(e), refNode, askedWords)) {
                boolean drawnToo = attribute != null && similarity[e] >= SIM_MODERATE;
                DiagramGraphDto.Node shownOptional = drawnToo
                        ? new DiagramGraphDto.Node(null, attribute.label(), attribute.labelKey(), null) : null;
                scores.add(new NodeScore(drawnToo, OPTIONAL, 0.0, shownOptional,
                        "Not asked for by the question -- the model answer includes it, but it does not affect "
                                + "your score."));
                continue;
            }
            if (attribute == null || similarity[e] < SIM_MODERATE) {
                scores.add(new NodeScore(false, "NONE", 0.0, null, nodeScore.matched()
                        ? "This attribute is missing from your " + plainLabel(refNode) + "."
                        : "Missing because " + plainLabel(refNode) + " is missing."));
                continue;
            }
            double factor = similarity[e] >= SIM_STRONG ? 1.0 : 0.7;
            List<String> reasons = new ArrayList<>();
            if (factor < 1.0) {
                reasons.add("The name is close to the expected one but not the same.");
            }
            if (hasKeyMarker(expected.get(e).labelKey()) && !hasKeyMarker(attribute.labelKey())) {
                factor *= 0.5;
                reasons.add("It should be marked as a key (PK or FK); yours is not.");
            }
            DiagramGraphDto.Node shown = new DiagramGraphDto.Node(null, attribute.label(), attribute.labelKey(), null);
            scores.add(new NodeScore(true, factor >= 1.0 ? "STRONG" : "PARTIAL", factor, shown,
                    reasons.isEmpty() ? "Matched what was expected." : String.join(" ", reasons)));
        }
        return scores;
    }

    /**
     * Compares attribute names, not their decoration: "PK warehouseId: String" and
     * "warehouseId (PK)" name the same column. Key markers and data types are
     * stripped here and the key marker is checked separately.
     */
    private double attributeSimilarity(String expected, String drawn) {
        return labelSimilarity(attributeName(expected), attributeName(drawn));
    }

    /**
     * Words that only say an attribute is a point in time: "borrowedOn",
     * "borrowDate" and "borrowedAt" all name the same column.
     */
    private static final Pattern TEMPORAL_WORDS = Pattern.compile("(?<=\\s)(on|at|date|time|timestamp|dt)(?=\\s)");

    private String attributeName(String labelKey) {
        if (labelKey == null) return "";
        String name = KEY_MARKER.matcher(labelKey).replaceAll(" ");
        name = name.replaceAll("[«»<>]", " ").trim();
        name = name.replaceAll("^[+#~-]\\s*", "");
        int cut = name.length();
        for (char stop : new char[] {'(', ':'}) {
            int at = name.indexOf(stop);
            if (at >= 0) cut = Math.min(cut, at);
        }
        name = name.substring(0, cut).replaceAll("[\\[\\],]", " ");
        name = TEMPORAL_WORDS.matcher(" " + name + " ").replaceAll(" ");
        return name.replaceAll("\\s+", " ").trim();
    }

    private static boolean partCovered(int matched, int total) {
        return total == 0 || (double) matched / total >= PART_MINIMUM;
    }

    private String plainLabel(DiagramGraphDto.Node node) {
        return node.label() == null || node.label().isBlank() ? "(unlabeled node)" : node.label();
    }

    private String describeNode(DiagramGraphDto.Node node, DiagramNotation notation) {
        if (node.label() == null || node.label().isBlank()) {
            String shape = notation.shapeName(node.nodeType());
            return "(" + shape.replaceFirst("^an? ", "") + ")";
        }
        return node.label();
    }

    private String describeEdge(
            DiagramGraphDto.Edge edge, Map<String, DiagramGraphDto.Node> nodesById, DiagramNotation notation) {
        DiagramGraphDto.Node source = nodesById.get(edge.sourceId());
        DiagramGraphDto.Node target = nodesById.get(edge.targetId());
        String sourceLabel = source == null ? "?" : describeNode(source, notation);
        String targetLabel = target == null ? "?" : describeNode(target, notation);
        String base = sourceLabel + " → " + targetLabel;
        List<String> detail = new ArrayList<>();
        String kindNote = notation.relationNote(notation.relationKind(edge.kind()));
        if (kindNote != null) detail.add(kindNote);
        if (edge.label() != null && !edge.label().isBlank()) detail.add(edge.label());
        else if (edge.cardinality() != null) detail.add(edge.cardinality());
        return detail.isEmpty() ? base : base + " (" + String.join(", ", detail) + ")";
    }

    private static final Set<String> STOPWORDS = Set.of(
            "a", "an", "the", "of", "to", "and", "or", "for", "in", "on", "with", "by", "at", "from",
            "as", "is", "be", "its", "it", "into");

    /**
     * How alike two labels are, 0..1. Identical once spacing and punctuation are
     * ignored is 1.0; the same words in another order 0.95; one contained in the
     * other 0.6-0.8; otherwise the share of content words they have in common
     * (filler words dropped, plurals and -ed/-ing endings ignored), scaled to 0.85.
     */
    private double labelSimilarity(String a, String b) {
        String x = a == null ? "" : a.trim();
        String y = b == null ? "" : b.trim();
        if (x.isEmpty() && y.isEmpty()) return 1.0;
        if (x.isEmpty() || y.isEmpty()) return 0.0;
        if (x.equals(y) || compact(x).equals(compact(y))) return 1.0;

        Set<String> wordsX = contentWords(x);
        Set<String> wordsY = contentWords(y);
        if (!wordsX.isEmpty() && wordsX.equals(wordsY)) return 0.95;

        double best = 0.0;
        if (x.contains(y) || y.contains(x)) {
            double ratio = (double) Math.min(x.length(), y.length()) / Math.max(x.length(), y.length());
            best = 0.6 + 0.2 * ratio;
        }
        if (!wordsX.isEmpty() && !wordsY.isEmpty()) {
            Set<String> shared = new HashSet<>(wordsX);
            shared.retainAll(wordsY);
            double dice = 2.0 * shared.size() / (wordsX.size() + wordsY.size());
            best = Math.max(best, dice * 0.85);
        }
        return best;
    }

    private static String compact(String value) {
        return value.replaceAll("[^a-z0-9]", "");
    }

    private Set<String> contentWords(String value) {
        Set<String> words = new HashSet<>();
        for (String token : TOKEN_SPLIT.split(value)) {
            if (token.isBlank() || STOPWORDS.contains(token)) continue;
            words.add(stem(token));
        }
        return words;
    }

    private static final String[] SUFFIXES = {
            "ations", "ation", "ments", "ment", "ings", "ing", "ally", "ates", "ate", "ers", "er",
            "ies", "ed", "es", "al", "s", "e"};

    private static String stem(String word) {
        for (String suffix : SUFFIXES) {
            if (word.length() - suffix.length() >= 4 && word.endsWith(suffix)) {
                String root = word.substring(0, word.length() - suffix.length());
                return suffix.equals("ies") ? root + "y" : root;
            }
        }
        return word;
    }

    private static boolean isBlank(String value) {
        return value == null || value.isBlank();
    }

    private boolean hasKeyMarker(String labelKey) {
        return labelKey != null && KEY_MARKER.matcher(labelKey).find();
    }

    private String buildFeedback(int matchedNodes, int totalNodes, int matchedEdges, int totalEdges,
                                 int matchedAttributes, int totalAttributes) {
        StringBuilder feedback = new StringBuilder();
        feedback.append(matchedNodes).append(" of ").append(totalNodes)
                .append(" required element(s) matched");
        if (totalAttributes > 0) {
            feedback.append(", ").append(matchedAttributes).append(" of ").append(totalAttributes)
                    .append(" required attribute(s)");
        }
        if (totalEdges > 0) {
            feedback.append(", and ").append(matchedEdges).append(" of ").append(totalEdges)
                    .append(" required relationship(s) matched");
        }
        feedback.append(". ");

        double nodeRatio = totalNodes == 0 ? 1 : (double) matchedNodes / totalNodes;
        double edgeRatio = totalEdges == 0 ? 1 : (double) matchedEdges / totalEdges;
        double attributeRatio = totalAttributes == 0 ? 1 : (double) matchedAttributes / totalAttributes;
        edgeRatio = Math.min(edgeRatio, attributeRatio);
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

    static String normalizeType(String diagramType) {
        return diagramType == null ? "" : diagramType.trim().toUpperCase(Locale.ROOT).replaceAll("[^A-Z0-9]+", "_");
    }
}
