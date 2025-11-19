package com.project.gamesta.controller;

import com.project.gamesta.model.AuthToken;
import com.project.gamesta.model.User;
import com.project.gamesta.service.AuthService;
import com.project.gamesta.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;

    public AuthController(AuthService authService, UserRepository userRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
    }

    @PostMapping("/signup")
    public ResponseEntity<?> signup(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String name = body.getOrDefault("name", email != null ? email.split("@")[0] : "");
        String password = body.get("password");
        if (email == null || password == null) return ResponseEntity.badRequest().body(Map.of("error","email and password required"));
        if (userRepository.findByEmail(email).isPresent()) return ResponseEntity.badRequest().body(Map.of("error","email already exists"));
        User u = authService.register(email, name, password);
        AuthToken t = authService.createTokenForUser(u);
        return ResponseEntity.ok(Map.of("token", t.getToken(), "user", Map.of("id", u.getId(), "name", u.getName(), "email", u.getEmail())));
    }

    @PostMapping("/signin")
    public ResponseEntity<?> signin(@RequestBody Map<String, String> body) {
        String email = body.get("email");
        String password = body.get("password");
        if (email == null || password == null) return ResponseEntity.badRequest().body(Map.of("error","email and password required"));
        var opt = authService.authenticate(email, password);
        if (opt.isEmpty()) return ResponseEntity.status(401).body(Map.of("error","invalid credentials"));
        User u = opt.get();
        AuthToken t = authService.createTokenForUser(u);
        return ResponseEntity.ok(Map.of("token", t.getToken(), "user", Map.of("id", u.getId(), "name", u.getName(), "email", u.getEmail())));
    }

    // Simple stub for OAuth token exchange used by frontend
    @GetMapping("/oauth-token")
    public ResponseEntity<?> oauthToken() {
        return ResponseEntity.badRequest().body(Map.of("error","not implemented"));
    }
}
