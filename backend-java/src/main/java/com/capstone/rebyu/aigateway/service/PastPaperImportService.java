package com.capstone.rebyu.aigateway.service;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.MediaType;
import org.springframework.http.client.MultipartBodyBuilder;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.reactive.function.BodyInserters;
import org.springframework.web.reactive.function.client.WebClient;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

import java.io.IOException;
import java.time.Duration;
import java.util.Map;

/**
 * Imports an official past paper into a certification's question bank, by way
 * of the Python service that does the parsing.
 *
 * <p>The parsing lives in Python because that is where the tooling is: the
 * page geometry a diagram has to be cropped from, the S3 upload of those
 * crops, and the embedding model that decides which lesson a question belongs
 * to are all already there. Re-implementing the geometry in PDFBox to keep it
 * in Java would mean maintaining two parsers that have to agree.
 *
 * <p>Parsing is synchronous and slow -- tens of seconds for a hundred-question
 * paper, most of it rendering figures. That is why the read timeout here is
 * its own value rather than the gateway default, and why the operation is
 * split: parse returns drafts, and a second call writes the ones an admin
 * approved. Nothing reaches the bank without that second call.
 */
@Slf4j
@Service
@RequiredArgsConstructor
public class PastPaperImportService {

    /** Parsing a full paper renders every figure at 3x; minutes, not seconds. */
    private static final Duration PARSE_TIMEOUT = Duration.ofMinutes(6);

    private static final long MAX_PDF_BYTES = 40L * 1024 * 1024;

    private final @Qualifier("aiWebClient") WebClient aiWebClient;

    public Map<String, Object> parse(Long certificationId, String paperName, String kind,
                                     MultipartFile questions, MultipartFile answers) {
        requirePdf(questions, "questions");
        requirePdf(answers, "answers");

        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("certification_id", String.valueOf(certificationId));
        body.part("paper_name", paperName);
        body.part("kind", kind == null || kind.isBlank() ? "subject_a" : kind);
        body.part("questions", asResource(questions)).filename(filenameOf(questions));
        body.part("answers", asResource(answers)).filename(filenameOf(answers));

        try {
            return aiWebClient.post()
                    .uri("/past-papers/parse")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(body.build()))
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(PARSE_TIMEOUT);
        } catch (ResponseStatusException error) {
            throw error;
        } catch (RuntimeException error) {
            log.error("Past-paper parse failed for {}", paperName, error);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The paper could not be parsed: " + error.getMessage());
        }
    }

    /**
     * Every question in a PDF of any layout, read by the AI service's layout
     * reader (Docling plus question profiles, no generative model). A long
     * document takes a minute or more on CPU, hence the long wait.
     */
    public Map<String, Object> readLayout(MultipartFile file) {
        requirePdf(file, "document");
        MultipartBodyBuilder body = new MultipartBodyBuilder();
        body.part("file", asResource(file)).filename(filenameOf(file));
        try {
            return aiWebClient.post()
                    .uri("/past-papers/read-layout")
                    .contentType(MediaType.MULTIPART_FORM_DATA)
                    .body(BodyInserters.fromMultipartData(body.build()))
                    .httpRequest(httpRequest -> {
                        reactor.netty.http.client.HttpClientRequest nettyRequest = httpRequest.getNativeRequest();
                        nettyRequest.responseTimeout(Duration.ofMinutes(8));
                    })
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofMinutes(9));
        } catch (ResponseStatusException error) {
            throw error;
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException error) {
            log.error("Layout reading failed: {}", error.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The document could not be read: " + detailOf(error.getResponseBodyAsString()));
        } catch (RuntimeException error) {
            log.error("Layout reading failed", error);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, "The document could not be read: "
                    + (error.getMessage() == null ? "the AI service did not answer in time" : error.getMessage()));
        }
    }

    public Map<String, Object> suggestLessons(Map<String, Object> request) {
        return forward("/past-papers/suggest-lessons", request, "Lessons could not be suggested");
    }

    /** A JSON POST to the AI service, its reply returned as-is. */
    public Map<String, Object> forward(String path, Map<String, Object> request, String failure) {
        try {
            return aiWebClient.post()
                    .uri(path)
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    // Tagging a paper is several model calls, each of which
                    // may walk the fallback chain; the client-wide read
                    // timeout gave up on it while Python was still working,
                    // and the admin saw "null".
                    .httpRequest(httpRequest -> {
                        reactor.netty.http.client.HttpClientRequest nettyRequest = httpRequest.getNativeRequest();
                        nettyRequest.responseTimeout(Duration.ofMinutes(4));
                    })
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofMinutes(5));
        } catch (ResponseStatusException error) {
            throw error;
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException error) {
            // The AI service's own explanation -- "No model could read this
            // page: ... 402 credits" -- rather than "502 Bad Gateway".
            log.error("{} ({}): {}", failure, path, error.getResponseBodyAsString());
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    failure + ": " + detailOf(error.getResponseBodyAsString()));
        } catch (RuntimeException error) {
            log.error("{} ({})", failure, path, error);
            String message = error.getMessage() == null
                    ? "the AI service did not answer in time"
                    : error.getMessage();
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY, failure + ": " + message);
        }
    }

    /** A GET to the AI service -- a tagging job's progress -- its reply returned as-is. */
    public Map<String, Object> get(String path, String failure) {
        try {
            return aiWebClient.get()
                    .uri(path)
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofSeconds(30));
        } catch (org.springframework.web.reactive.function.client.WebClientResponseException error) {
            log.error("{} ({}): {}", failure, path, error.getResponseBodyAsString());
            throw new ResponseStatusException(
                    error.getStatusCode().value() == 404 ? HttpStatus.NOT_FOUND : HttpStatus.BAD_GATEWAY,
                    failure + ": " + detailOf(error.getResponseBodyAsString()));
        } catch (RuntimeException error) {
            log.error("{} ({})", failure, path, error);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    failure + ": " + (error.getMessage() == null ? "the AI service did not answer" : error.getMessage()));
        }
    }

    /** FastAPI's {"detail": "..."} body, or the body itself. */
    private static String detailOf(String body) {
        if (body == null || body.isBlank()) return "no explanation was given";
        java.util.regex.Matcher matcher = java.util.regex.Pattern
                .compile("\"detail\"\\s*:\\s*\"((?:[^\"\\\\]|\\\\.)*)\"").matcher(body);
        String detail = matcher.find() ? matcher.group(1).replace("\\\"", "\"") : body;
        return detail.length() > 500 ? detail.substring(0, 500) + "..." : detail;
    }

    public Map<String, Object> importApproved(Map<String, Object> request) {
        try {
            return aiWebClient.post()
                    .uri("/past-papers/import")
                    .contentType(MediaType.APPLICATION_JSON)
                    .bodyValue(request)
                    .retrieve()
                    .bodyToMono(new org.springframework.core.ParameterizedTypeReference<Map<String, Object>>() {})
                    .block(Duration.ofMinutes(3));
        } catch (ResponseStatusException error) {
            throw error;
        } catch (RuntimeException error) {
            log.error("Past-paper import failed", error);
            throw new ResponseStatusException(HttpStatus.BAD_GATEWAY,
                    "The import failed and nothing was written: " + error.getMessage());
        }
    }

    private void requirePdf(MultipartFile file, String field) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The " + field + " PDF is required.");
        }
        if (file.getSize() > MAX_PDF_BYTES) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "The " + field + " PDF exceeds 40MB.");
        }
        // Checked on content rather than on the filename or the declared
        // content type, both of which the client chooses.
        byte[] head = new byte[5];
        try (var stream = file.getInputStream()) {
            int read = stream.read(head);
            if (read < 5 || head[0] != '%' || head[1] != 'P' || head[2] != 'D' || head[3] != 'F') {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                        "The " + field + " file is not a PDF.");
            }
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "The " + field + " file could not be read.");
        }
    }

    private ByteArrayResource asResource(MultipartFile file) {
        try {
            return new ByteArrayResource(file.getBytes());
        } catch (IOException error) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                    "Could not read " + filenameOf(file));
        }
    }

    private String filenameOf(MultipartFile file) {
        String name = file.getOriginalFilename();
        return name == null || name.isBlank() ? "upload.pdf" : name;
    }
}
