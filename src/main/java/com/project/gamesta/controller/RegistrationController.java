package com.project.gamesta.controller;

import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.repository.EventRegistrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/registrations")
public class RegistrationController {
    private final EventRegistrationRepository registrationRepository;
    private final AuthTokenRepository tokenRepository;

    public RegistrationController(EventRegistrationRepository registrationRepository, AuthTokenRepository tokenRepository) {
        this.registrationRepository = registrationRepository;
        this.tokenRepository = tokenRepository;
    }

    @GetMapping
    public ResponseEntity<?> listAll(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean isAdmin = user.getRole() != null && (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("SUPER_ADMIN"));
        if (!isAdmin) return ResponseEntity.status(403).body(Map.of("error","forbidden"));
        var list = registrationRepository.findAllWithUser();
        var data = list.stream().map(r -> Map.of(
            "id", r.getId(),
            "eventName", r.getEventName(),
            "price", r.getPrice(),
            "paymentId", r.getPaymentId(),
            "orderId", r.getOrderId(),
            "createdAt", r.getCreatedAt() == null ? null : r.getCreatedAt().toString(),
            "user", r.getUser() == null ? null : Map.of(
                "id", r.getUser().getId(),
                "email", r.getUser().getEmail(),
                "name", r.getUser().getName()
            )
        )).toList();
        return ResponseEntity.ok(Map.of("data", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @PathVariable Long id) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean isAdmin = user.getRole() != null && (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("SUPER_ADMIN"));
        if (!isAdmin) return ResponseEntity.status(403).body(Map.of("error","forbidden"));
        if (!registrationRepository.existsById(id)) return ResponseEntity.status(404).body(Map.of("error","not found"));
        registrationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("data","deleted"));
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }
}
