package com.capstone.rebyu.reference;

import com.capstone.rebyu.auth.dto.CurrentUserDto;
import com.capstone.rebyu.auth.service.CognitoAuthService;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class ReferenceOptionController {

    private static final Set<String> KINDS = Set.of(
            ReferenceOption.KIND_PROGRAM, ReferenceOption.KIND_INSTITUTION, ReferenceOption.KIND_DEGREE_PROGRAM);

    private final ReferenceOptionRepository options;
    private final CognitoAuthService auth;

    public record OptionDto(Long id, String label, boolean active, String code, String description,
                            String category, List<Long> certificationIds) {}

    public record CreateDto(@NotBlank @Size(max = 150) String label,
                            @Size(max = 40) String code,
                            @Size(max = 500) String description,
                            @Size(max = 150) String category,
                            List<Long> certificationIds) {}

    @GetMapping("/api/public/reference/{kind}")
    public List<String> labels(@PathVariable String kind) {
        return options.findByKindAndActiveTrueOrderBySortOrderAscLabelAsc(kindOf(kind))
                .stream().map(ReferenceOption::getLabel).toList();
    }

    @GetMapping("/api/public/reference/{kind}/details")
    @Transactional(readOnly = true)
    public List<OptionDto> details(@PathVariable String kind) {
        return options.findByKindAndActiveTrueOrderBySortOrderAscLabelAsc(kindOf(kind))
                .stream().map(ReferenceOptionController::toDto).toList();
    }

    @GetMapping("/api/admin/reference/{kind}")
    @Transactional(readOnly = true)
    public List<OptionDto> all(@AuthenticationPrincipal Jwt jwt, @PathVariable String kind) {
        requireAdmin(jwt);
        return options.findByKindOrderBySortOrderAscLabelAsc(kindOf(kind)).stream()
                .map(ReferenceOptionController::toDto).toList();
    }

    @PostMapping("/api/admin/reference/{kind}")
    @Transactional
    public OptionDto add(@AuthenticationPrincipal Jwt jwt, @PathVariable String kind,
                         @Valid @RequestBody CreateDto body) {
        requireAdmin(jwt);
        String k = kindOf(kind);
        String label = body.label().trim();
        ReferenceOption option = options.findByKindAndLabelIgnoreCase(k, label)
                .orElseGet(() -> ReferenceOption.builder()
                        .kind(k).label(label).sortOrder((int) options.countByKind(k) + 1).build());
        option.setActive(true);
        applyDetails(option, body);
        return toDto(options.save(option));
    }

    @PutMapping("/api/admin/reference/{kind}/{id}")
    @Transactional
    public OptionDto update(@AuthenticationPrincipal Jwt jwt, @PathVariable String kind, @PathVariable Long id,
                            @Valid @RequestBody CreateDto body) {
        requireAdmin(jwt);
        String k = kindOf(kind);
        ReferenceOption option = find(k, id);
        String label = body.label().trim();
        options.findByKindAndLabelIgnoreCase(k, label)
                .filter(other -> !other.getReferenceOptionId().equals(id))
                .ifPresent(other -> {
                    throw new IllegalArgumentException("\"" + label + "\" is already on this list.");
                });
        option.setLabel(label);
        applyDetails(option, body);
        return toDto(options.save(option));
    }

    @DeleteMapping("/api/admin/reference/{kind}/{id}")
    @Transactional
    public void retire(@AuthenticationPrincipal Jwt jwt, @PathVariable String kind, @PathVariable Long id) {
        requireAdmin(jwt);
        ReferenceOption option = find(kindOf(kind), id);
        option.setActive(false);
        options.save(option);
    }

    private ReferenceOption find(String kind, Long id) {
        return options.findById(id)
                .filter(o -> o.getKind().equals(kind))
                .orElseThrow(() -> new EntityNotFoundException("Option not found: " + id));
    }

    private static void applyDetails(ReferenceOption option, CreateDto body) {
        if (body.code() != null) option.setCode(blankToNull(body.code()));
        if (body.description() != null) option.setDescription(blankToNull(body.description()));
        if (body.category() != null) option.setCategory(blankToNull(body.category()));
        if (body.certificationIds() != null) {
            option.getCertificationIds().clear();
            option.getCertificationIds().addAll(new LinkedHashSet<>(body.certificationIds()));
        }
    }

    private static String blankToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private static OptionDto toDto(ReferenceOption o) {
        return new OptionDto(o.getReferenceOptionId(), o.getLabel(), o.isActive(), o.getCode(),
                o.getDescription(), o.getCategory(), new ArrayList<>(o.getCertificationIds()));
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
