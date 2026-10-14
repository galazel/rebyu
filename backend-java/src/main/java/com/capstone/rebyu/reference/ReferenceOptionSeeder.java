package com.capstone.rebyu.reference;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class ReferenceOptionSeeder implements ApplicationRunner {

    private final ReferenceOptionRepository options;
    private final com.capstone.rebyu.certification.repository.CertificationRepository certifications;


    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        seedDetailedLists();
    }

    private void seedDetailedLists() {
        boolean programsEmpty = options.countByKind(ReferenceOption.KIND_PROGRAM) == 0;
        boolean institutionsEmpty = options.countByKind(ReferenceOption.KIND_INSTITUTION) == 0;
        if (!programsEmpty && !institutionsEmpty) return;

        com.fasterxml.jackson.databind.JsonNode seed;
        try (var in = getClass().getResourceAsStream("/reference/reference-seed.json")) {
            if (in == null) return;
            seed = new com.fasterxml.jackson.databind.ObjectMapper().readTree(in);
        } catch (java.io.IOException e) {
            log.warn("Could not read reference seed: {}", e.getMessage());
            return;
        }

        if (programsEmpty) {
            Map<String, Long> idByTitle = new java.util.HashMap<>();
            certifications.findAll().forEach(c -> idByTitle.put(normalize(c.getTitle()), c.getCertificationId()));
            int order = 0;
            for (var program : seed.path("programs")) {
                java.util.Set<Long> ids = new java.util.LinkedHashSet<>();
                program.path("certificationTitles").forEach(t -> {
                    Long id = idByTitle.get(normalize(t.asText()));
                    if (id != null) ids.add(id);
                });
                options.save(ReferenceOption.builder()
                        .kind(ReferenceOption.KIND_PROGRAM)
                        .label(program.path("name").asText())
                        .code(program.path("code").asText(null))
                        .description(program.path("description").asText(null))
                        .certificationIds(ids)
                        .sortOrder(++order)
                        .active(true)
                        .build());
            }
            log.info("Seeded {} PROGRAM option(s)", order);
        }

        if (institutionsEmpty) {
            int order = 0;
            for (var institution : seed.path("institutions")) {
                options.save(ReferenceOption.builder()
                        .kind(ReferenceOption.KIND_INSTITUTION)
                        .label(institution.path("name").asText())
                        .code(institution.path("shortName").asText(null))
                        .description(institution.path("address").asText(null))
                        .category(institution.path("category").asText(null))
                        .sortOrder(++order)
                        .active(true)
                        .build());
            }
            log.info("Seeded {} INSTITUTION option(s)", order);
        }
    }

    private static String normalize(String title) {
        return title == null ? "" : title.toLowerCase(java.util.Locale.ROOT).replaceAll("[^a-z0-9]", "");
    }
}
