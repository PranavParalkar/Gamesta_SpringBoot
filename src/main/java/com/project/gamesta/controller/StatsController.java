package com.project.gamesta.controller;

import com.project.gamesta.service.IdeaService;
import com.project.gamesta.repository.UserRepository;
import com.project.gamesta.repository.VoteRepository;
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
    private final VoteRepository voteRepository;

    public StatsController(UserRepository userRepository, IdeaService ideaService, VoteRepository voteRepository) {
        this.userRepository = userRepository;
        this.ideaService = ideaService;
        this.voteRepository = voteRepository;
    }

    @GetMapping
    public ResponseEntity<?> stats() {
        long users = userRepository.count();
        long ideas = ideaService.listIdeas().size();
        long votes = voteRepository.count();
        return ResponseEntity.ok(Map.of("data", Map.of("users", users, "ideas", ideas, "votes", votes)));
    }
}
