package com.project.gamesta.controller;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.EventCatalog;
import com.project.gamesta.model.EventRegistration;
import com.project.gamesta.repository.IdeaRepository;
import com.project.gamesta.repository.EventCatalogRepository;
import com.project.gamesta.repository.EventRegistrationRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin")
public class AdminController {
    private final IdeaRepository ideaRepository;
    private final EventCatalogRepository eventCatalogRepository;
    private final EventRegistrationRepository eventRegistrationRepository;

    @Value("${admin.secret:}")
    private String adminSecret;

    public AdminController(IdeaRepository ideaRepository,
                           EventCatalogRepository eventCatalogRepository,
                           EventRegistrationRepository eventRegistrationRepository) {
        this.ideaRepository = ideaRepository;
        this.eventCatalogRepository = eventCatalogRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
    }

    private boolean isAuthorized(String header) {
        if (adminSecret == null || adminSecret.isBlank()) return false;
        return header != null && header.equals(adminSecret);
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        long ideas = ideaRepository.count();
        long events = eventCatalogRepository.count();
        long registrations = eventRegistrationRepository.count();
        return ResponseEntity.ok(Map.of(
                "ideas", ideas,
                "events", events,
                "registrations", registrations
        ));
    }

    @GetMapping("/ideas")
    public ResponseEntity<?> listIdeas(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<Idea> list = ideaRepository.findAll();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @DeleteMapping("/ideas/{id}")
    public ResponseEntity<?> deleteIdea(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                        @PathVariable Long id) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        if (!ideaRepository.existsById(id)) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        ideaRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/events")
    public ResponseEntity<?> listEvents(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<EventCatalog> list = eventCatalogRepository.findAll();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                         @PathVariable Long id) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        if (!eventCatalogRepository.existsById(id)) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        eventCatalogRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/registrations")
    public ResponseEntity<?> listRegistrations(@RequestHeader(value = "X-Admin-Secret", required = false) String secret) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<EventRegistration> list = eventRegistrationRepository.findAll();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @DeleteMapping("/registrations/{id}")
    public ResponseEntity<?> deleteRegistration(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                                @PathVariable Long id) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        if (!eventRegistrationRepository.existsById(id)) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        eventRegistrationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}
