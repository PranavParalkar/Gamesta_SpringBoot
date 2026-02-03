package com.project.gamesta.service;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.stereotype.Service;

import jakarta.mail.internet.MimeMessage;
import com.google.zxing.BarcodeFormat;
import com.google.zxing.qrcode.QRCodeWriter;
import com.google.zxing.common.BitMatrix;
import com.google.zxing.client.j2se.MatrixToImageWriter;
import javax.imageio.ImageIO;
import java.awt.*;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;

@Service
public class EmailService {
    private final JavaMailSender mailSender;
    private static final Logger log = LoggerFactory.getLogger(EmailService.class);

    @Value("${spring.mail.from:no-reply@gamesta.local}")
    private String fromAddress;

    public EmailService(JavaMailSender mailSender) {
        this.mailSender = mailSender;
    }

    public void sendRegistrationConfirmation(String toEmail, String userName, List<String> events, String orderId, String paymentId, Integer totalAmount) {
        if (toEmail == null || toEmail.isBlank()) return;
        String subject = "Gamesta: Registration Confirmation";
        String plain = buildPlain(userName, events, orderId, paymentId, totalAmount);
        String html = buildHtml(userName, events, orderId, paymentId, totalAmount);
        try {
            MimeMessage mime = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(mime, true, "UTF-8");
            helper.setFrom(fromAddress);
            helper.setTo(toEmail);
            helper.setSubject(subject);
            // Provide both plain and HTML for wide client support
            helper.setText(plain, html);
            // Inline images (best-effort): generated logo + QR for booking/payment
            try {
                byte[] logo = generateLogoPng();
                if (logo != null && logo.length > 0) {
                    helper.addInline("logo", new ByteArrayResource(logo), "image/png");
                }
            } catch (Exception ignore) {}
            try {
                String qrContent = (orderId != null && !orderId.isBlank()) ? orderId : paymentId;
                if (qrContent != null && !qrContent.isBlank()) {
                    byte[] qr = generateQrPng(qrContent, 220);
                    if (qr != null && qr.length > 0) {
                        helper.addInline("qr", new ByteArrayResource(qr), "image/png");
                    }
                }
            } catch (Exception ignore) {}
            mailSender.send(mime);
        } catch (Exception ex) {
            log.warn("Failed to send registration email to {}: {}", toEmail, ex.getMessage());
        }
    }

    private String buildPlain(String userName, List<String> events, String orderId, String paymentId, Integer totalAmount) {
        StringBuilder sb = new StringBuilder();
        sb.append("Hi ").append(safe(userName, "Participant")).append(",\n\n");
        sb.append("Your registration is confirmed.\n\n");
        sb.append("Events:\n");
        for (String ev : events) sb.append(" • ").append(ev).append("\n");
        sb.append("\nOrder ID: ").append(safe(orderId, "-")).append("\n");
        sb.append("Payment ID: ").append(safe(paymentId, "-")).append("\n");
        if (totalAmount != null) sb.append("Total: ₹").append(totalAmount).append("\n");
        sb.append("When: ").append(nowString()).append("\n\n");
        sb.append("Thanks for joining Gamesta!\n");
        sb.append("Gamesta Team");
        return sb.toString();
    }

        private String buildHtml(String userName, List<String> events, String orderId, String paymentId, Integer totalAmount) {
        int eventCount = events == null ? 0 : events.size();
        StringBuilder eventRows = new StringBuilder();
        for (String ev : events) {
            eventRows.append("<tr>" +
                "<td style=\"padding:10px 12px;vertical-align:top;\">" +
                "  <div style=\"display:flex;gap:12px;align-items:center;\">" +
                "    <div style=\"width:40px;height:40px;border-radius:8px;background:linear-gradient(135deg,#f0abfc,#7c3aed);\"></div>" +
                "    <div style=\"font-weight:600;color:#0b1020;\">" + escape(ev) + "</div>" +
                "  </div>" +
                "</td>" +
                "<td style=\"padding:10px 12px;text-align:right;color:#475569;\">1 ticket</td>" +
                "</tr>");
        }

        String totalPaidRow = totalAmount == null ? "" : (
            "<tr style=\"border-top:1px solid #e9eef7;\">" +
            "  <td style=\"padding:10px 12px;font-weight:700;color:#0b1020;\">Total Paid</td>" +
            "  <td style=\"padding:10px 12px;text-align:right;font-weight:800;color:#0b1020;\">₹" + totalAmount + "</td>" +
            "</tr>"
        );

        String html = "" +
            "<div style='background:#f6f8fc;padding:24px;'>" +
            "  <div style='max-width:640px;margin:0 auto;background:#ffffff;border-radius:16px;border:1px solid #e6ecf6;overflow:hidden;'>" +
            "    <div style='padding:24px 24px 12px 24px;'>" +
            "      <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='border-collapse:collapse;'>" +
            "        <tr>" +
            "          <td style='padding:0;vertical-align:middle;'>" +
            "            <img src='cid:logo' alt='Gamesta' width='120' height='36' style='display:block;border:0;outline:none;text-decoration:none;'>" +
            "          </td>" +
            "          <td style='padding:0;vertical-align:middle;text-align:right;'>" +
            "            <img src='cid:qr' alt='QR' width='96' height='96' style='display:inline-block;border:0;outline:none;text-decoration:none;border-radius:8px;'>" +
            "          </td>" +
            "        </tr>" +
            "      </table>" +
            "      <div style='text-align:center;margin:10px 0 14px 0;'>" +
            "        <div style='margin-top:4px;color:#10b981;font:700 16px Segoe UI,Arial,sans-serif;'>Your booking is confirmed!</div>" +
            "        <div style='margin-top:6px;color:#6b7280;font:500 12px Segoe UI,Arial,sans-serif;'>Booking ID</div>" +
            "        <div style='margin-top:2px;color:#111827;font:700 14px Segoe UI,Arial,sans-serif;'>" + escape(safe(orderId, "-")) + "</div>" +
            "      </div>" +
            "      <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='border-collapse:separate;border-spacing:0 10px;'>" +
            "        <tr>" +
            "          <td style='padding:0;'>" +
            "            <div style='border:1px solid #e6ecf6;border-radius:12px;padding:14px;'>" +
            "              <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='border-collapse:collapse;'>" +
            "                <tr>" +
            "                  <td style='padding:6px 6px 10px 6px;'>" +
            "                    <div style='font:700 16px Segoe UI,Arial,sans-serif;color:#111827;'>" + escape(safe(userName, "Participant")) + "</div>" +
            "                    <div style='margin-top:2px;color:#6b7280;font:500 12px Segoe UI,Arial,sans-serif;'>" + eventCount + " event" + (eventCount==1?"":"s") + " registered • " + nowString() + "</div>" +
            "                  </td>" +
            "                  <td style='padding:6px;text-align:right;vertical-align:top;'>" +
            "                    <span style='display:inline-block;border:2px solid #10b981;color:#10b981;padding:6px 10px;border-radius:999px;font:700 12px Segoe UI,Arial,sans-serif;'>CONFIRMED</span>" +
            "                  </td>" +
            "                </tr>" +
            "              </table>" +
            "              <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='border-collapse:collapse;margin-top:6px;'>" +
            eventRows +
            "              </table>" +
            "            </div>" +
            "          </td>" +
            "        </tr>" +
            "      </table>" +
            "      <div style='margin-top:12px;border:1px dashed #d9e3f2;border-radius:12px;padding:12px;'>" +
            "        <table role='presentation' width='100%' cellspacing='0' cellpadding='0' style='border-collapse:collapse;'>" +
            "          <tr>" +
            "            <td style='padding:8px 12px;color:#6b7280;'>Payment ID</td>" +
            "            <td style='padding:8px 12px;text-align:right;color:#111827;font-weight:600;'>" + escape(safe(paymentId, "-")) + "</td>" +
            "          </tr>" +
            totalPaidRow +
            "        </table>" +
            "      </div>" +
            "      <div style='margin-top:14px;color:#6b7280;font:500 12px Segoe UI,Arial,sans-serif;'>Show this booking ID at the desk on event day.</div>" +
            "    </div>" +
            "    <div style='padding:14px 24px;background:#f3f6fb;color:#6b7280;font:500 12px Segoe UI,Arial,sans-serif;'>This is an automated email from <strong style=\"color:#111827\">Gamesta</strong>. Please do not reply.</div>" +
            "  </div>" +
            "</div>";
        return html;
        }

    private static byte[] generateQrPng(String text, int size) throws Exception {
        QRCodeWriter writer = new QRCodeWriter();
        BitMatrix matrix = writer.encode(text, BarcodeFormat.QR_CODE, size, size);
        BufferedImage img = MatrixToImageWriter.toBufferedImage(matrix);
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", baos);
            return baos.toByteArray();
        }
    }

    private static byte[] generateLogoPng() throws Exception {
        int w = 180, h = 40;
        BufferedImage img = new BufferedImage(w, h, BufferedImage.TYPE_INT_ARGB);
        Graphics2D g = img.createGraphics();
        try {
            g.setRenderingHint(RenderingHints.KEY_ANTIALIASING, RenderingHints.VALUE_ANTIALIAS_ON);
            GradientPaint gp = new GradientPaint(0, 0, new Color(124, 58, 237), w, h, new Color(6, 182, 212));
            g.setPaint(gp);
            g.fillRoundRect(0, 0, w, h, 10, 10);
            g.setColor(Color.WHITE);
            g.setFont(new Font("Segoe UI", Font.BOLD, 22));
            FontMetrics fm = g.getFontMetrics();
            String text = "Gamesta";
            int tx = 12;
            int ty = (h - fm.getHeight()) / 2 + fm.getAscent();
            g.drawString(text, tx, ty);
        } finally {
            g.dispose();
        }
        try (ByteArrayOutputStream baos = new ByteArrayOutputStream()) {
            ImageIO.write(img, "png", baos);
            return baos.toByteArray();
        }
    }

    private static String safe(String v, String d) {
        return (v == null || v.isBlank()) ? d : v;
    }

    private static String nowString() {
        return DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm z").format(ZonedDateTime.now());
    }

    private static String escape(String s) {
        if (s == null) return "";
        return s
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }
}
