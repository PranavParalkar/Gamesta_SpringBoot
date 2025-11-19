package com.project.gamesta.controller;

import com.project.gamesta.model.AuthToken;
import com.project.gamesta.model.User;
import com.project.gamesta.service.AuthService;
import com.project.gamesta.repository.UserRepository;
import com.project.gamesta.repository.LoginRepository;
import com.project.gamesta.model.LoginRecord;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {
    private final AuthService authService;
    private final UserRepository userRepository;
    private final LoginRepository loginRepository;

    public AuthController(AuthService authService, UserRepository userRepository, LoginRepository loginRepository) {
        this.authService = authService;
        this.userRepository = userRepository;
        this.loginRepository = loginRepository;
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

    // Lookup student info by PRN from the `login` table
    @GetMapping("/lookup")
    public ResponseEntity<?> lookupByPrn(@RequestParam(name = "prn") String prn) {
        if (prn == null || prn.isBlank()) return ResponseEntity.badRequest().body(Map.of("error","prn required"));

        // First try to find an existing registered user whose email local-part is the PRN
        String candidateEmail = prn + "@mitaoe.ac.in";
        var userOpt = userRepository.findByEmail(candidateEmail);
        if (userOpt.isPresent()) {
            var u = userOpt.get();
            return ResponseEntity.ok(Map.of("data", Map.of("prn", prn, "name", u.getName(), "email", u.getEmail())));
        }

        // Fallback to reading the external `login` table if present
        var opt = loginRepository.findByPrn(prn);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","not found"));
        LoginRecord r = opt.get();
        return ResponseEntity.ok(Map.of("data", Map.of("prn", r.getPrn(), "name", r.getName(), "email", r.getEmail())));
    }
}
