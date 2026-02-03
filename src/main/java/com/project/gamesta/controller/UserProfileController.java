package com.project.gamesta.controller;

import com.project.gamesta.model.EventRegistration;
import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.repository.EventCatalogRepository;
import com.project.gamesta.repository.EventRegistrationRepository;
import com.project.gamesta.service.EmailService;
import com.project.gamesta.service.IdeaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.*;

@RestController
@RequestMapping("/api/profile")
public class UserProfileController {
    
    private final AuthTokenRepository tokenRepository;
    private final IdeaService ideaService;
    private final EventRegistrationRepository eventRepo;
    private final EventCatalogRepository eventCatalogRepo;
    private final EmailService emailService;

    public UserProfileController(AuthTokenRepository tokenRepository,
                                 IdeaService ideaService,
                                 EventRegistrationRepository eventRepo,
                                 EventCatalogRepository eventCatalogRepo,
                                 EmailService emailService) {
        this.tokenRepository = tokenRepository;
        this.ideaService = ideaService;
        this.eventRepo = eventRepo;
        this.eventCatalogRepo = eventCatalogRepo;
        this.emailService = emailService;
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }

    // --- Profile Metadata ---
    @GetMapping
    public ResponseEntity<?> profile(@RequestHeader(value = "Authorization", required = false) String auth) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean isAdmin = user.getRole() != null && (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("SUPER_ADMIN"));
        return ResponseEntity.ok(Map.of(
                "user", Map.of(
                        "id", user.getId(),
                        "name", user.getName(),
                        "email", user.getEmail(),
                        "role", user.getRole() == null ? "USER" : user.getRole().name(),
                        "isAdmin", isAdmin
                )
        ));
    }

    // --- My Ideas ---
    @GetMapping("/ideas")
    public ResponseEntity<?> myIdeas(@RequestHeader(value = "Authorization", required = false) String auth) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<Idea> all = ideaService.listIdeas();
        var filtered = all.stream().filter(i -> i.getAuthor() != null && i.getAuthor().getId().equals(user.getId())).toList();
        return ResponseEntity.ok(Map.of("data", filtered));
    }

    // --- My Events (Registration History) ---
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

    // --- Register for Events ---
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
            Integer price = eventCatalogRepo.findByName(name).map(p -> p.getPrice()).orElse(null);
            saved.add(eventRepo.save(new EventRegistration(user, name, price, paymentId, orderId)));
        }
        
        try {
            Integer totalAmount = saved.stream().map(EventRegistration::getPrice).filter(Objects::nonNull).reduce(0, Integer::sum);
            List<String> evNames = saved.stream().map(EventRegistration::getEventName).toList();
            emailService.sendRegistrationConfirmation(user.getEmail(), user.getName(), evNames, orderId, paymentId, totalAmount);
        } catch (Exception ignored) {}
        
        return ResponseEntity.ok(Map.of("status","ok","count", saved.size()));
    }

    // --- Test Email ---
    @GetMapping("/email/test")
    public ResponseEntity<?> testEmail(@RequestHeader(value = "Authorization", required = false) String auth) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        try {
            emailService.sendRegistrationConfirmation(
                    user.getEmail(),
                    user.getName(),
                    List.of("Test Event"),
                    "TEST-ORDER",
                    "TEST-PAY",
                    0
            );
        } catch (Exception ignored) {}
        return ResponseEntity.ok(Map.of("status","triggered"));
    }
}
