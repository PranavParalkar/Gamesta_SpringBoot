package com.project.gamesta.controller;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.EventCatalog;
import com.project.gamesta.model.EventRegistration;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.IdeaRepository;
import com.project.gamesta.repository.EventCatalogRepository;
import com.project.gamesta.repository.EventRegistrationRepository;
import com.project.gamesta.repository.AuthTokenRepository;
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
    private final AuthTokenRepository tokenRepository;
    private final com.project.gamesta.repository.UserRepository userRepository;
    private final com.project.gamesta.repository.CommentRepository commentRepository;
    private final com.project.gamesta.repository.VoteRepository voteRepository;

    @Value("${admin.secret:}")
    private String adminSecret;

    public AdminController(IdeaRepository ideaRepository,
                           EventCatalogRepository eventCatalogRepository,
                           EventRegistrationRepository eventRegistrationRepository,
                           AuthTokenRepository tokenRepository,
                           com.project.gamesta.repository.UserRepository userRepository,
                           com.project.gamesta.repository.CommentRepository commentRepository,
                           com.project.gamesta.repository.VoteRepository voteRepository) {
        this.ideaRepository = ideaRepository;
        this.eventCatalogRepository = eventCatalogRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
        this.tokenRepository = tokenRepository;
        this.userRepository = userRepository;
        this.commentRepository = commentRepository;
        this.voteRepository = voteRepository;
    }

    private boolean isAuthorized(String secret, String authHeader) {
        // 1. Check Legacy Secret
        if (adminSecret != null && !adminSecret.isBlank() && secret != null && secret.equals(adminSecret)) {
            return true;
        }
        // 2. Check JWT
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String token = authHeader.substring(7);
            var optToken = tokenRepository.findByToken(token);
            if (optToken.isPresent()) {
                User u = optToken.get().getUser();
                return u != null && u.getRole() != null && 
                       (u.getRole().name().equals("ADMIN") || u.getRole().name().equals("SUPER_ADMIN"));
            }
        }
        return false;
    }

    @GetMapping("/stats")
    public ResponseEntity<?> stats(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                   @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
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
    public ResponseEntity<?> listIdeas(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                       @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<Idea> list = ideaRepository.findAll();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @DeleteMapping("/ideas/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteIdea(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                        @RequestHeader(value = "Authorization", required = false) String auth,
                                        @PathVariable Long id) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        var opt = ideaRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        
        Idea idea = opt.get();
        
        // 1. Delete associated Votes
        java.util.List<com.project.gamesta.model.Vote> votes = voteRepository.findByIdea(idea);
        voteRepository.deleteAll(votes);
        
        // 2. Delete associated Comments
        java.util.List<com.project.gamesta.model.Comment> comments = commentRepository.findByIdeaOrderByCreatedAtAsc(idea);
        commentRepository.deleteAll(comments);
        
        // 3. Delete Idea
        ideaRepository.delete(idea);
        
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/events")
    public ResponseEntity<?> listEvents(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                        @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<EventCatalog> list = eventCatalogRepository.findAll();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @PostMapping("/events")
    public ResponseEntity<?> createEvent(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                         @RequestHeader(value = "Authorization", required = false) String auth,
                                         @RequestBody Map<String, Object> body) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));

        String name = (String) body.get("name");
        // Handle price as Integer or String safely
        Object priceObj = body.get("price");
        Integer price = null;
        if (priceObj instanceof Number) {
            price = ((Number) priceObj).intValue();
        } else if (priceObj instanceof String) {
            try { price = Integer.parseInt((String) priceObj); } catch (Exception e) {}
        }

        if (name == null || name.isBlank() || price == null) {
            return ResponseEntity.badRequest().body(Map.of("error", "name and price required"));
        }

        // Parse optional ticketLimit
        Object limitObj = body.get("ticketLimit");
        Integer ticketLimit = null;
        if (limitObj instanceof Number) {
            ticketLimit = ((Number) limitObj).intValue();
        } else if (limitObj instanceof String) {
            try { ticketLimit = Integer.parseInt((String) limitObj); } catch (Exception e) { ticketLimit = null; }
        }

        try {
            EventCatalog event = new EventCatalog(name, price, ticketLimit, true);
            eventCatalogRepository.save(event);
            return ResponseEntity.ok(Map.of("status", "created", "data", event));
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "Failed to create event. Name might be duplicate."));
        }
    }

    @DeleteMapping("/events/{id}")
    public ResponseEntity<?> deleteEvent(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                         @RequestHeader(value = "Authorization", required = false) String auth,
                                         @PathVariable Long id) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        if (!eventCatalogRepository.existsById(id)) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        eventCatalogRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/registrations")
    public ResponseEntity<?> listRegistrations(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                               @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<EventRegistration> list = eventRegistrationRepository.findAll();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @DeleteMapping("/registrations/{id}")
    public ResponseEntity<?> deleteRegistration(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                                @RequestHeader(value = "Authorization", required = false) String auth,
                                                @PathVariable Long id) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        if (!eventRegistrationRepository.existsById(id)) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        eventRegistrationRepository.deleteById(id);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }

    @GetMapping("/users")
    public ResponseEntity<?> listUsers(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                       @RequestHeader(value = "Authorization", required = false) String auth) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        List<User> list = userRepository.findAll();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @DeleteMapping("/users/{id}")
    @org.springframework.transaction.annotation.Transactional
    public ResponseEntity<?> deleteUser(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                        @RequestHeader(value = "Authorization", required = false) String auth,
                                        @PathVariable Long id) {
        if (!isAuthorized(secret, auth)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        var opt = userRepository.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "not found"));
        
        var user = opt.get();
        // 1. Delete Tokens
        var tokens = tokenRepository.findByUser(user);
        tokenRepository.deleteAll(tokens);
        
        // 2. Delete Registrations
        var regs = eventRegistrationRepository.findByUser(user);
        eventRegistrationRepository.deleteAll(regs);

        // 3. Delete Votes
        var votes = voteRepository.findByUser(user);
        voteRepository.deleteAll(votes);

        // 4. Delete Comments
        var comments = commentRepository.findByAuthor(user);
        commentRepository.deleteAll(comments);

        // 5. Delete Ideas authored by user (and their related votes/comments)
        var ideas = ideaRepository.findByAuthor(user);
        for (var idea : ideas) {
            voteRepository.deleteAll(voteRepository.findByIdea(idea));
            commentRepository.deleteAll(commentRepository.findByIdeaOrderByCreatedAtAsc(idea));
            ideaRepository.delete(idea);
        }

        userRepository.delete(user);
        return ResponseEntity.ok(Map.of("status", "deleted"));
    }
}

