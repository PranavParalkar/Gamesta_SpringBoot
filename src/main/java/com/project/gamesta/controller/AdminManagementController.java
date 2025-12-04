package com.project.gamesta.controller;

import com.project.gamesta.model.User;
import com.project.gamesta.model.Role;
import com.project.gamesta.repository.UserRepository;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/admin/manage")
public class AdminManagementController {
    private final UserRepository userRepository;

    @Value("${admin.secret:}")
    private String adminSecret;

    public AdminManagementController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    private boolean isAuthorized(String header) {
        return adminSecret != null && !adminSecret.isBlank() && adminSecret.equals(header);
    }

    @PostMapping("/assign")
    public ResponseEntity<?> assignRole(@RequestHeader(value = "X-Admin-Secret", required = false) String secret,
                                        @RequestBody Map<String, String> body) {
        if (!isAuthorized(secret)) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));

        String email = body.get("email");
        String idStr = body.get("id");
        String roleStr = body.getOrDefault("role", "ADMIN");

        if ((email == null || email.isBlank()) && (idStr == null || idStr.isBlank())) {
            return ResponseEntity.badRequest().body(Map.of("error", "email or id required"));
        }

        var opt = (email != null && !email.isBlank())
                ? userRepository.findByEmail(email)
                : userRepository.findById(Long.valueOf(idStr));

        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error", "user not found"));

        User u = opt.get();
        try {
            Role role = Role.valueOf(roleStr.toUpperCase());
            u.setRole(role);
        } catch (Exception e) {
            return ResponseEntity.badRequest().body(Map.of("error", "invalid role"));
        }
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("status", "updated", "userId", u.getId(), "role", u.getRole().name()));
    }
}
