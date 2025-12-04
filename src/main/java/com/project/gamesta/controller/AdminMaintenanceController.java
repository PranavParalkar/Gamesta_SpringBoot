package com.project.gamesta.controller;

import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import jakarta.persistence.EntityManager;
import org.springframework.http.ResponseEntity;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/admin/maintenance")
public class AdminMaintenanceController {
    private final EntityManager entityManager;
    private final AuthTokenRepository tokenRepository;

    public AdminMaintenanceController(EntityManager entityManager, AuthTokenRepository tokenRepository) {
        this.entityManager = entityManager;
        this.tokenRepository = tokenRepository;
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }

    @PostMapping("/clear-db")
    @Transactional
    public ResponseEntity<?> clearDatabase(@RequestHeader(value = "Authorization", required = false) String auth) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        if (user.getRole() == null || !"SUPER_ADMIN".equals(user.getRole().name())) {
            return ResponseEntity.status(403).body(Map.of("error","forbidden"));
        }

        try {
            // MySQL: disable FKs, truncate children -> parents, then re-enable
            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS=0").executeUpdate();

            List<String> tables = List.of(
                    "votes",
                    "comments",
                    "event_registrations",
                    "auth_tokens",
                    "ideas",
                    "events",
                    "login",
                    "users"
            );
            for (String t : tables) {
                entityManager.createNativeQuery("TRUNCATE TABLE " + t).executeUpdate();
            }

            entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS=1").executeUpdate();
            return ResponseEntity.ok(Map.of("status","ok","message","database cleared"));
        } catch (Exception ex) {
            try { entityManager.createNativeQuery("SET FOREIGN_KEY_CHECKS=1").executeUpdate(); } catch (Exception ignored) {}
            return ResponseEntity.internalServerError().body(Map.of("error","clear_failed","message", ex.getMessage()));
        }
    }
}
