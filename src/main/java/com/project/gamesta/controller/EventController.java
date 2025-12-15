package com.project.gamesta.controller;

import com.project.gamesta.model.EventCatalog;
import com.project.gamesta.repository.EventCatalogRepository;
import com.project.gamesta.repository.EventRegistrationRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/events")
public class EventController {
    private final EventCatalogRepository eventRepository;
    private final EventRegistrationRepository registrationRepository;
    private final AuthTokenRepository tokenRepository;

    public EventController(EventCatalogRepository eventRepository, EventRegistrationRepository registrationRepository, AuthTokenRepository tokenRepository) {
        this.eventRepository = eventRepository;
        this.registrationRepository = registrationRepository;
        this.tokenRepository = tokenRepository;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        List<EventCatalog> list = eventRepository.findAllByActiveTrueOrderByNameAsc();
        var data = list.stream().map(e -> {
            long sold = registrationRepository.countByEventName(e.getName());
            Integer limit = e.getTicketLimit();
            Long remaining = (limit == null) ? null : Math.max(0, (long)limit - sold);
            java.util.Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", e.getId());
            map.put("name", e.getName());
            map.put("price", e.getPrice());
            map.put("ticketLimit", e.getTicketLimit());
            map.put("ticketsSold", sold);
            map.put("remaining", remaining);
            return map;
        }).toList();
        return ResponseEntity.ok(Map.of("data", data));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @PathVariable Long id) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        boolean isAdmin = user.getRole() != null && (user.getRole().name().equals("ADMIN") || user.getRole().name().equals("SUPER_ADMIN"));
        if (!isAdmin) return ResponseEntity.status(403).body(Map.of("error","forbidden"));
        if (!eventRepository.existsById(id)) return ResponseEntity.status(404).body(Map.of("error","not found"));
        eventRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("data","deleted"));
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }
}
