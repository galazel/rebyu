package com.capstone.rebyu.reference;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Set;

/**
 * The stored pick-lists. Reading is public (a select on a public form needs
 * them); adding and retiring entries is for admins.
 */
@RestController
@RequiredArgsConstructor
public class ReferenceOptionController {

    private static final Set<String> KINDS = Set.of(ReferenceOption.KIND_INDUSTRY, ReferenceOption.KIND_DEPARTMENT);

    private final ReferenceOptionRepository options;
    private final CognitoAuthService auth;

    public record OptionDto(Long id, String label, boolean active) {}
    public record CreateDto(@NotBlank String label) {}

    @GetMapping("/api/public/reference/{kind}")
    public List<String> labels(@PathVariable String kind) {
        return options.findByKindAndActiveTrueOrderBySortOrderAscLabelAsc(kindOf(kind))
                .stream().map(ReferenceOption::getLabel).toList();
    }

    @GetMapping("/api/admin/reference/{kind}")
    public List<OptionDto> all(@AuthenticationPrincipal Jwt jwt, @PathVariable String kind) {
        requireAdmin(jwt);
        return options.findByKindOrderBySortOrderAscLabelAsc(kindOf(kind)).stream()
                .map(o -> new OptionDto(o.getReferenceOptionId(), o.getLabel(), o.isActive())).toList();
    }

    /** Adds an entry, or re-activates one retired earlier under the same label. */
    @PostMapping("/api/admin/reference/{kind}")
    public OptionDto add(@AuthenticationPrincipal Jwt jwt, @PathVariable String kind, @RequestBody CreateDto body) {
        requireAdmin(jwt);
        String k = kindOf(kind);
        String label = body.label().trim();
        ReferenceOption option = options.findByKindAndLabelIgnoreCase(k, label)
                .orElseGet(() -> ReferenceOption.builder()
                        .kind(k).label(label).sortOrder((int) options.countByKind(k) + 1).build());
        option.setActive(true);
        option = options.save(option);
        return new OptionDto(option.getReferenceOptionId(), option.getLabel(), true);
    }

    /** Retires an entry: hidden from the selects, kept so existing rows that name it still read. */
    @DeleteMapping("/api/admin/reference/{kind}/{id}")
    public void retire(@AuthenticationPrincipal Jwt jwt, @PathVariable String kind, @PathVariable Long id) {
        requireAdmin(jwt);
        ReferenceOption option = options.findById(id)
                .filter(o -> o.getKind().equals(kindOf(kind)))
                .orElseThrow(() -> new EntityNotFoundException("Option not found: " + id));
        option.setActive(false);
        options.save(option);
    }

    private static String kindOf(String raw) {
        String kind = raw == null ? "" : raw.trim().toUpperCase();
        if (!KINDS.contains(kind)) throw new IllegalArgumentException("Unknown reference list: " + raw);
        return kind;
    }

    private CurrentUserDto requireAdmin(Jwt jwt) {
        if (jwt == null) throw new IllegalArgumentException("Authentication is required");
        CurrentUserDto user = auth.syncCurrentUser(jwt, jwt.getTokenValue());
        if (!"ADMIN".equalsIgnoreCase(user.role())) throw new IllegalArgumentException("Admin access is required");
        return user;
    }
}
