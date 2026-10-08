package com.capstone.rebyu.dashboard.service;

import com.capstone.rebyu.dashboard.entity.UserDashboardLayout;
import com.capstone.rebyu.dashboard.repository.UserDashboardLayoutRepository;
import com.capstone.rebyu.user.entity.User;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.persistence.EntityManager;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class DashboardLayoutService {

    private static final Set<String> KNOWN_BOARDS = Set.of("admin", "institution", "department-head");

    private final UserDashboardLayoutRepository layoutRepository;
    private final EntityManager entityManager;
    private final ObjectMapper mapper = new ObjectMapper();

    public record TilePlacement(String id, Integer x, Integer y, Integer w, Integer h) {}

    @Transactional(readOnly = true)
    public List<TilePlacement> layout(Long userId, String board) {
        return layoutRepository.findByUser_UserIdAndBoard(userId, requireKnownBoard(board))
                .map(row -> read(row.getTileOrder()))
                .orElseGet(List::of);
    }

    @Transactional
    public List<TilePlacement> saveLayout(Long userId, String board, List<TilePlacement> tiles) {
        String key = requireKnownBoard(board);

        List<TilePlacement> layout = tiles == null ? List.of() : tiles.stream()
                .filter(tile -> tile != null && tile.id() != null && !tile.id().isBlank())
                .map(tile -> new TilePlacement(
                        tile.id(),
                        tile.x() == null ? 0 : Math.max(0, tile.x()),
                        tile.y() == null ? 0 : Math.max(0, tile.y()),
                        tile.w() == null ? 1 : Math.max(1, tile.w()),
                        tile.h() == null ? 1 : Math.max(1, tile.h())))
                .toList();

        UserDashboardLayout row = layoutRepository.findByUser_UserIdAndBoard(userId, key)
                .orElseGet(() -> UserDashboardLayout.builder()
                        .user(entityManager.getReference(User.class, userId))
                        .board(key)
                        .build());
        row.setTileOrder(write(layout));
        row.setUpdatedAt(OffsetDateTime.now());
        layoutRepository.save(row);
        return layout;
    }

    private String requireKnownBoard(String board) {
        String key = board == null ? "" : board.trim().toLowerCase();
        if (!KNOWN_BOARDS.contains(key)) {
            throw new IllegalArgumentException("Unknown dashboard board: " + board);
        }
        return key;
    }

    private List<TilePlacement> read(String json) {
        try {
            return mapper.readValue(json, new TypeReference<List<TilePlacement>>() {});
        } catch (Exception ignored) {
            return List.of();
        }
    }

    private String write(List<TilePlacement> layout) {
        try {
            return mapper.writeValueAsString(layout);
        } catch (Exception e) {
            throw new IllegalStateException("Could not serialize the dashboard layout", e);
        }
    }
}
