package com.project.gamesta.controller;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.service.IdeaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestHeader;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/profile")
public class ProfileController {
    private final AuthTokenRepository tokenRepository;
    private final IdeaService ideaService;

    public ProfileController(AuthTokenRepository tokenRepository, IdeaService ideaService) {
        this.tokenRepository = tokenRepository;
        this.ideaService = ideaService;
    }

    @GetMapping
    public ResponseEntity<?> profile(@RequestHeader(value = "Authorization", required = false) String auth) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        return ResponseEntity.ok(Map.of("user", Map.of("id", user.getId(), "name", user.getName(), "email", user.getEmail())));
    }

    @GetMapping("/ideas")
    public ResponseEntity<?> myIdeas(@RequestHeader(value = "Authorization", required = false) String auth) {
        var user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        List<Idea> all = ideaService.listIdeas();
        var filtered = all.stream().filter(i -> i.getAuthor() != null && i.getAuthor().getId().equals(user.getId())).toList();
        return ResponseEntity.ok(Map.of("data", filtered));
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }
}
