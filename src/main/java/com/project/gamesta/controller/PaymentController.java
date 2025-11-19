package com.project.gamesta.controller;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Map;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;

import com.fasterxml.jackson.databind.ObjectMapper;

@RestController
@RequestMapping("/api/payment")
public class PaymentController {

    @Value("${razorpay.key:}")
    private String razorKey;

    @Value("${razorpay.secret:}")
    private String razorSecret;

    private final HttpClient client = HttpClient.newHttpClient();
    private final ObjectMapper mapper = new ObjectMapper();

    @PostMapping("/create-order")
    public ResponseEntity<?> createOrder(@RequestBody Map<String, Object> body) throws Exception {
        // amount expected in rupees as number
        Number amountNum = (Number) body.getOrDefault("total", 0);
        long amountPaise = Math.round(amountNum.doubleValue() * 100);

        if (razorKey == null || razorKey.isBlank() || razorSecret == null || razorSecret.isBlank()) {
            return ResponseEntity.status(500).body(Map.of("error", "Razorpay keys not configured on server"));
        }

        Map<String, Object> payload = Map.of(
                "amount", amountPaise,
                "currency", "INR",
                "payment_capture", 1
        );

        String json = mapper.writeValueAsString(payload);
        String auth = Base64.getEncoder().encodeToString((razorKey + ":" + razorSecret).getBytes(StandardCharsets.UTF_8));
        HttpRequest req = HttpRequest.newBuilder()
                .uri(URI.create("https://api.razorpay.com/v1/orders"))
                .header("Content-Type", "application/json")
                .header("Authorization", "Basic " + auth)
                .POST(HttpRequest.BodyPublishers.ofString(json))
                .build();

        HttpResponse<String> resp = client.send(req, HttpResponse.BodyHandlers.ofString());
        if (resp.statusCode() != 200 && resp.statusCode() != 201) {
            return ResponseEntity.status(502).body(Map.of("error", "failed to create order", "details", resp.body()));
        }

        Map<?,?> respJson = mapper.readValue(resp.body(), Map.class);
        // return order id and amount and publishable key
        return ResponseEntity.ok(Map.of(
                "orderId", respJson.get("id"),
                "amount", respJson.get("amount"),
                "currency", respJson.get("currency"),
                "key", razorKey
        ));
    }

    @PostMapping("/verify")
    public ResponseEntity<?> verifyPayment(@RequestBody Map<String, String> body) throws Exception {
        String razorpayPaymentId = body.get("razorpay_payment_id");
        String razorpayOrderId = body.get("razorpay_order_id");
        String razorpaySignature = body.get("razorpay_signature");

        if (razorpayPaymentId == null || razorpayOrderId == null || razorpaySignature == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "missing parameters"));
        }

        // compute expected signature
        String payload = razorpayOrderId + "|" + razorpayPaymentId;
        Mac sha256_HMAC = Mac.getInstance("HmacSHA256");
        SecretKeySpec secret_key = new SecretKeySpec(razorSecret.getBytes(StandardCharsets.UTF_8), "HmacSHA256");
        sha256_HMAC.init(secret_key);
        byte[] hash = sha256_HMAC.doFinal(payload.getBytes(StandardCharsets.UTF_8));
        String expected = bytesToHex(hash);

        if (!expected.equals(razorpaySignature)) {
            return ResponseEntity.status(400).body(Map.of("error", "invalid signature"));
        }

        // success - caller can persist payment info as needed
        return ResponseEntity.ok(Map.of("status", "ok", "paymentId", razorpayPaymentId, "orderId", razorpayOrderId));
    }

    private static String bytesToHex(byte[] bytes) {
        StringBuilder sb = new StringBuilder();
        for (byte b : bytes) sb.append(String.format("%02x", b & 0xff));
        return sb.toString();
    }
}
