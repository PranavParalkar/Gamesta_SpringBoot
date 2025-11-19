package com.project.gamesta.controller;

import com.project.gamesta.model.EventRegistration;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.repository.EventRegistrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/profile")
public class EventRegistrationController {
    private final AuthTokenRepository tokenRepository;
    private final EventRegistrationRepository eventRepo;

    private static final Map<String, Integer> PRICE_MAP = Map.ofEntries(
            Map.entry("BGMI Tournament", 200),
            Map.entry("Chess Tournament", 150),
            Map.entry("Debate Contest", 100),
            Map.entry("Drone Race Competition", 300),
            Map.entry("VR Experience", 250),
            Map.entry("Photography Scavenger Hunt", 120),
            Map.entry("Dance Face-off", 180),
            Map.entry("Flying Simulator", 350),
            Map.entry("Ramp Walk", 100),
            Map.entry("GSQ (Google Squid Games)", 280),
            Map.entry("Drone Simulator Competition", 320),
            Map.entry("AeroCAD Face-Off", 200),
            Map.entry("Poster Design Competition", 80),
            Map.entry("Mobile Robocar Racing", 400),
            Map.entry("Strongest on Campus", 150),
            Map.entry("Valorant Tournament", 220)
    );

    public EventRegistrationController(AuthTokenRepository tokenRepository, EventRegistrationRepository eventRepo) {
        this.tokenRepository = tokenRepository;
        this.eventRepo = eventRepo;
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }

    @GetMapping("/events")
    public ResponseEntity<?> listEvents(@RequestHeader(value = "Authorization", required = false) String auth) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        var regs = eventRepo.findByUser(user);
        // aggregate by eventName
        Map<String, List<EventRegistration>> grouped = new LinkedHashMap<>();
        for (var r : regs) {
            grouped.computeIfAbsent(r.getEventName(), k -> new ArrayList<>()).add(r);
        }
        var data = grouped.entrySet().stream().map(e -> {
            List<EventRegistration> list = e.getValue();
            int count = list.size();
            Integer pricePerTicket = list.get(0).getPrice();
            int totalPrice = pricePerTicket == null ? 0 : pricePerTicket * count;
            // collect payment/order ids (distinct)
            var paymentIds = list.stream().map(EventRegistration::getPaymentId).filter(Objects::nonNull).distinct().toList();
            var orderIds = list.stream().map(EventRegistration::getOrderId).filter(Objects::nonNull).distinct().toList();
            var firstCreated = list.stream().map(EventRegistration::getCreatedAt).min(Comparator.naturalOrder()).map(Object::toString).orElse(null);
            return Map.of(
                    "name", e.getKey(),
                    "count", count,
                    "price", pricePerTicket,
                    "totalPrice", totalPrice,
                    "paymentIds", paymentIds,
                    "orderIds", orderIds,
                    "createdAt", firstCreated,
                    "status", "registered"
            );
        }).toList();
        return ResponseEntity.ok(Map.of("data", data));
    }

    @PostMapping("/events/register")
    public ResponseEntity<?> registerEvents(@RequestHeader(value = "Authorization", required = false) String auth,
                                            @RequestBody Map<String, Object> body) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));

        Object evObj = body.get("events");
        if (!(evObj instanceof List<?> list) || list.isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error","events list required"));
        }
        String paymentId = (String) body.getOrDefault("paymentId", "");
        String orderId = (String) body.getOrDefault("orderId", "");
        List<EventRegistration> saved = new ArrayList<>();
        for (Object o : list) {
            if (o == null) continue;
            String name = o.toString();
            Integer price = PRICE_MAP.getOrDefault(name, null);
            saved.add(eventRepo.save(new EventRegistration(user, name, price, paymentId, orderId)));
        }
        return ResponseEntity.ok(Map.of("status","ok","count", saved.size()));
    }
}
