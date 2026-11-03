package com.capstone.rebyu.enrollment.service;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.springframework.stereotype.Service;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Locale;

/**
 * The emailed certificate of completion. Drawn to match the certificate page in
 * the learner portal: green double frame with corner marks, serif type, a gold
 * rule under the name, the date and number on either side of a seal.
 */
@Service
public class CertificatePdfService {

    private static final Color GREEN = new Color(0x1a, 0x5c, 0x3a);
    private static final Color GOLD = new Color(0xb8, 0x90, 0x2f);
    private static final Color INK = new Color(0x11, 0x18, 0x27);
    private static final Color MUTED = new Color(0x6b, 0x72, 0x80);
    private static final Color FAINT = new Color(0x9c, 0xa3, 0xaf);
    private static final Color PAPER_LINE = new Color(0xc8, 0xd6, 0xcc);
    private static final Color WASH = new Color(0xf4, 0xf9, 0xf5);

    public byte[] render(String learnerName, String certificationTitle, String certificateNumber, LocalDateTime issuedAt) {
        try (PDDocument document = new PDDocument(); ByteArrayOutputStream out = new ByteArrayOutputStream()) {
            PDPage page = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
            document.addPage(page);
            float width = page.getMediaBox().getWidth();
            float height = page.getMediaBox().getHeight();

            try (PDPageContentStream content = new PDPageContentStream(document, page)) {
                drawFrame(content, width, height);

                PDType1Font sansBold = PDType1Font.HELVETICA_BOLD;
                PDType1Font serifBold = PDType1Font.TIMES_BOLD;
                PDType1Font serifItalic = PDType1Font.TIMES_ITALIC;
                PDType1Font serifBoldItalic = PDType1Font.TIMES_BOLD_ITALIC;
                PDType1Font serif = PDType1Font.TIMES_ROMAN;

                spaced(content, sansBold, 9, width, 512, "REBYU LEARNING", 4.2f, GREEN);
                content.setStrokingColor(GREEN);
                content.setLineWidth(0.6f);
                line(content, width / 2 - 62, 497, width / 2 - 10, 497);
                line(content, width / 2 + 10, 497, width / 2 + 62, 497);
                diamond(content, width / 2, 497, 4, GOLD);

                centred(content, serifBold, 40, width, 450, "Certificate of Completion", GREEN);
                centred(content, serifItalic, 13, width, 425, "This certifies that", MUTED);

                centred(content, serifBoldItalic, 34, width, 375, safe(serifBoldItalic, learnerName), INK);
                content.setStrokingColor(GOLD);
                content.setLineWidth(1.4f);
                line(content, width * 0.28f, 362, width * 0.72f, 362);

                centred(content, serifItalic, 13, width, 338, "completed the review for", MUTED);
                spaced(content, serifBold, 20, width, 308, safe(serifBold, certificationTitle).toUpperCase(Locale.ROOT), 1.2f, INK);
                centred(content, serifItalic, 12, width, 286, "and passed its mock exam on REBYU.", MUTED);

                // Date and number either side of the seal.
                String date = issuedAt == null ? "" : issuedAt.toLocalDate().format(DateTimeFormatter.ofPattern("MMMM d, yyyy", Locale.ENGLISH));
                float colWidth = 200;
                float leftX = 120;
                float rightX = width - 120 - colWidth;
                footerColumn(content, serif, sansBold, leftX, colWidth, date, "DATE OF COMPLETION");
                footerColumn(content, serif, sansBold, rightX, colWidth, safe(serif, certificateNumber), "CERTIFICATE NO.");
                seal(content, width / 2, 170, sansBold);

                centred(content, serifItalic, 9.5f, width, 74,
                        "Issued by the REBYU Learning Platform for completing the review above and passing its mock exam.", FAINT);
            }
            document.save(out);
            return out.toByteArray();
        } catch (IOException e) {
            throw new IllegalStateException("Could not render the certificate PDF", e);
        }
    }

    private static void drawFrame(PDPageContentStream content, float width, float height) throws IOException {
        content.setNonStrokingColor(Color.WHITE);
        content.addRect(0, 0, width, height);
        content.fill();

        content.setStrokingColor(PAPER_LINE);
        content.setLineWidth(1);
        content.addRect(14, 14, width - 28, height - 28);
        content.stroke();

        // Double rule, like the page's 4px double border.
        content.setStrokingColor(GREEN);
        content.setLineWidth(2);
        content.addRect(22, 22, width - 44, height - 44);
        content.stroke();
        content.setLineWidth(0.8f);
        content.addRect(27, 27, width - 54, height - 54);
        content.stroke();

        // A faint gold inner rule.
        content.setStrokingColor(new Color(0xdc, 0xc8, 0x97));
        content.setLineWidth(0.6f);
        content.addRect(33, 33, width - 66, height - 66);
        content.stroke();

        corner(content, 40, height - 40, 1, -1);
        corner(content, width - 40, height - 40, -1, -1);
        corner(content, 40, 40, 1, 1);
        corner(content, width - 40, 40, -1, 1);
    }

    private static void corner(PDPageContentStream content, float x, float y, int dx, int dy) throws IOException {
        content.setStrokingColor(GREEN);
        content.setLineWidth(1.8f);
        content.moveTo(x, y + dy * 30);
        content.lineTo(x, y);
        content.lineTo(x + dx * 30, y);
        content.stroke();
        content.setLineWidth(0.6f);
        content.moveTo(x + dx * 5, y + dy * 30);
        content.lineTo(x + dx * 5, y + dy * 5);
        content.lineTo(x + dx * 30, y + dy * 5);
        content.stroke();
        circle(content, x + dx * 5, y + dy * 5, 1.8f, GREEN, true);
    }

    private static void footerColumn(PDPageContentStream content, PDType1Font valueFont, PDType1Font labelFont,
                                     float x, float colWidth, String value, String label) throws IOException {
        float valueSize = 13;
        float valueWidth = valueFont.getStringWidth(value) / 1000f * valueSize;
        text(content, valueFont, valueSize, x + (colWidth - valueWidth) / 2, 176, value, INK);
        content.setStrokingColor(new Color(0x9a, 0xa0, 0xa8));
        content.setLineWidth(0.6f);
        line(content, x, 168, x + colWidth, 168);
        float labelSize = 7.5f;
        float labelWidth = labelFont.getStringWidth(label) / 1000f * labelSize + (label.length() - 1) * 1.2f;
        content.beginText();
        content.setFont(labelFont, labelSize);
        content.setNonStrokingColor(MUTED);
        content.setCharacterSpacing(1.2f);
        content.newLineAtOffset(x + (colWidth - labelWidth) / 2, 154);
        content.showText(label);
        content.setCharacterSpacing(0);
        content.endText();
    }

    private static void seal(PDPageContentStream content, float cx, float cy, PDType1Font font) throws IOException {
        circle(content, cx, cy, 50, WASH, true);
        content.setStrokingColor(GREEN);
        content.setLineWidth(0.8f);
        content.setLineDashPattern(new float[]{4, 3}, 0);
        circle(content, cx, cy, 50, GREEN, false);
        content.setLineDashPattern(new float[]{}, 0);
        circle(content, cx, cy, 40, GREEN, true);
        content.setStrokingColor(Color.WHITE);
        content.setLineWidth(1);
        circle(content, cx, cy, 34, Color.WHITE, false);
        // Check mark.
        content.setStrokingColor(Color.WHITE);
        content.setLineWidth(4);
        content.moveTo(cx - 13, cy + 4);
        content.lineTo(cx - 4, cy - 5);
        content.lineTo(cx + 14, cy + 13);
        content.stroke();
        float size = 7;
        String word = "CERTIFIED";
        float w = font.getStringWidth(word) / 1000f * size + (word.length() - 1);
        content.beginText();
        content.setFont(font, size);
        content.setNonStrokingColor(Color.WHITE);
        content.setCharacterSpacing(1);
        content.newLineAtOffset(cx - w / 2, cy - 22);
        content.showText(word);
        content.setCharacterSpacing(0);
        content.endText();
    }

    private static void circle(PDPageContentStream content, float cx, float cy, float r, Color color, boolean fill) throws IOException {
        float k = 0.552284749831f * r;
        content.moveTo(cx + r, cy);
        content.curveTo(cx + r, cy + k, cx + k, cy + r, cx, cy + r);
        content.curveTo(cx - k, cy + r, cx - r, cy + k, cx - r, cy);
        content.curveTo(cx - r, cy - k, cx - k, cy - r, cx, cy - r);
        content.curveTo(cx + k, cy - r, cx + r, cy - k, cx + r, cy);
        content.closePath();
        if (fill) {
            content.setNonStrokingColor(color);
            content.fill();
        } else {
            content.setStrokingColor(color);
            content.stroke();
        }
    }

    private static void diamond(PDPageContentStream content, float cx, float cy, float r, Color color) throws IOException {
        content.moveTo(cx, cy + r);
        content.lineTo(cx + r, cy);
        content.lineTo(cx, cy - r);
        content.lineTo(cx - r, cy);
        content.closePath();
        content.setNonStrokingColor(color);
        content.fill();
    }

    private static void line(PDPageContentStream content, float x1, float y1, float x2, float y2) throws IOException {
        content.moveTo(x1, y1);
        content.lineTo(x2, y2);
        content.stroke();
    }

    private static void text(PDPageContentStream content, PDType1Font font, float size, float x, float y,
                             String value, Color color) throws IOException {
        content.beginText();
        content.setFont(font, size);
        content.setNonStrokingColor(color);
        content.newLineAtOffset(x, y);
        content.showText(value);
        content.endText();
    }

    private static void centred(PDPageContentStream content, PDType1Font font, float size,
                                float pageWidth, float y, String value, Color color) throws IOException {
        float textWidth = font.getStringWidth(value) / 1000f * size;
        text(content, font, size, (pageWidth - textWidth) / 2f, y, value, color);
    }

    private static void spaced(PDPageContentStream content, PDType1Font font, float size, float pageWidth,
                               float y, String value, float spacing, Color color) throws IOException {
        float textWidth = font.getStringWidth(value) / 1000f * size + Math.max(0, value.length() - 1) * spacing;
        content.beginText();
        content.setFont(font, size);
        content.setNonStrokingColor(color);
        content.setCharacterSpacing(spacing);
        content.newLineAtOffset((pageWidth - textWidth) / 2f, y);
        content.showText(value);
        content.setCharacterSpacing(0);
        content.endText();
    }

    /** The standard 14 fonts only cover WinAnsi; anything else would throw, so it is replaced. */
    private static String safe(PDType1Font font, String value) {
        if (value == null) return "";
        StringBuilder out = new StringBuilder();
        for (int i = 0; i < value.length(); ) {
            int cp = value.codePointAt(i);
            String ch = new String(Character.toChars(cp));
            try {
                font.encode(ch);
                out.append(ch);
            } catch (IllegalArgumentException | IOException e) {
                out.append('?');
            }
            i += Character.charCount(cp);
        }
        return out.toString();
    }
}
