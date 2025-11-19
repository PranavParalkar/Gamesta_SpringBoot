package com.project.gamesta.controller;

import com.project.gamesta.service.IdeaService;
import com.project.gamesta.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/stats")
public class StatsController {
    private final UserRepository userRepository;
    private final IdeaService ideaService;

    public StatsController(UserRepository userRepository, IdeaService ideaService) {
        this.userRepository = userRepository;
        this.ideaService = ideaService;
    }

    @GetMapping
    public ResponseEntity<?> stats() {
        long users = userRepository.count();
        long ideas = ideaService.listIdeas().size();
        long votes = 0; // could be implemented later
        return ResponseEntity.ok(Map.of("data", Map.of("users", users, "ideas", ideas, "votes", votes)));
    }
}
