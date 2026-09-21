package com.capstone.rebyu.enrollment.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

/**
 * The certificate of completion as a PDF, attached to the certificate email.
 *
 * PLACEHOLDER: a single landscape page carrying the certificate number and
 * the learner's name in plain type, so the attachment exists and can be
 * opened while the real design is pending. Swap the body of {@link #render}
 * for the designed template when it is ready; the email and the award flow
 * do not need to change.
 */
@Service
public class CertificatePdfService {

    public byte[] render(String learnerName, String certificationTitle, String certificateNumber, LocalDateTime issuedAt) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
            document.addPage(page);
            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                PDType1Font bold = PDType1Font.HELVETICA_BOLD;
                PDType1Font regular = PDType1Font.HELVETICA;
                float width = page.getMediaBox().getWidth();

                centred(content, bold, 11, width, 470, "CERTIFICATE OF COMPLETION");
                centred(content, regular, 10, width, 450, "(placeholder - final design pending)");
                centred(content, regular, 12, width, 380, "This certifies that");
                centred(content, bold, 26, width, 340, learnerName == null ? "" : learnerName);
                centred(content, regular, 12, width, 300, "completed the review for");
                centred(content, bold, 18, width, 270, certificationTitle == null ? "" : certificationTitle);
                centred(content, regular, 12, width, 230, "and passed its mock exam on REBYU.");
                centred(content, regular, 10, width, 160, "Certificate no. " + (certificateNumber == null ? "" : certificateNumber));
                centred(content, regular, 10, width, 144, "Issued "
                        + (issuedAt == null ? "" : issuedAt.toLocalDate().format(DateTimeFormatter.ofPattern("MMMM d, yyyy"))));
            }
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Could not render the certificate PDF", e);
        }
    }

    private static void centred(PDPageContentStream content, PDType1Font font, float size,
                                float pageWidth, float y, String text) throws IOException {
        float textWidth = font.getStringWidth(text) / 1000f * size;
        content.beginText();
        content.setFont(font, size);
        content.newLineAtOffset((pageWidth - textWidth) / 2f, y);
        content.showText(text);
        content.endText();
    }
}
