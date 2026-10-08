package com.capstone.rebyu.dashboard.controller;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import com.capstone.rebyu.dashboard.service.DashboardLayoutService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/dashboard-layout")
@RequiredArgsConstructor
public class DashboardLayoutController {

    private final DashboardLayoutService layoutService;
    private final CognitoAuthService auth;

    public record LayoutRequest(List<DashboardLayoutService.TilePlacement> tiles) {}

    @GetMapping
    public Map<String, List<DashboardLayoutService.TilePlacement>> layout(
            @AuthenticationPrincipal Jwt jwt, @RequestParam String board) {
        return Map.of("tiles", layoutService.layout(me(jwt), board));
    }

    @PutMapping
    public Map<String, List<DashboardLayoutService.TilePlacement>> saveLayout(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam String board,
            @RequestBody LayoutRequest request) {
        return Map.of("tiles", layoutService.saveLayout(me(jwt), board, request.tiles()));
    }

    private Long me(Jwt jwt) {
        if (jwt == null) {
            throw new IllegalArgumentException("Authentication is required");
        }
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (user.userId() == null) {
            throw new IllegalArgumentException("A user account is required");
        }
        return user.userId();
    }
}
