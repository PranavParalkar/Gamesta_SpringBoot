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
    private final com.project.gamesta.repository.IdeaRepository ideaRepository;
    private final com.project.gamesta.repository.EventRegistrationRepository eventRegistrationRepository;

    public StatsController(UserRepository userRepository, IdeaService ideaService, VoteRepository voteRepository,
                           com.project.gamesta.repository.IdeaRepository ideaRepository,
                           com.project.gamesta.repository.EventRegistrationRepository eventRegistrationRepository) {
        this.userRepository = userRepository;
        this.ideaService = ideaService;
        this.voteRepository = voteRepository;
        this.ideaRepository = ideaRepository;
        this.eventRegistrationRepository = eventRegistrationRepository;
    }

    @GetMapping
    public ResponseEntity<?> stats() {
        long users = userRepository.count();
        long ideas = ideaService.listIdeas().size();
        long votes = voteRepository.count();
        return ResponseEntity.ok(Map.of("data", Map.of("users", users, "ideas", ideas, "votes", votes)));
    }
    
    @GetMapping("/trending")
    public ResponseEntity<?> trending() {
        // Trending Ideas (Most Discussed)
        var discussed = ideaRepository.findTopByDiscussed();
        // Popular Ideas (Most Voted)
        var popular = ideaRepository.findTopByScore();
        
        // Count registrations
        long regs = eventRegistrationRepository.count();

        // Top Event
        String topEventName = eventRegistrationRepository.findTopEvent();
        long topEventCount = topEventName != null ? eventRegistrationRepository.countByEventName(topEventName) : 0;
        
        return ResponseEntity.ok(Map.of(
            "discussed", discussed.stream().limit(5).toList(),
            "popular", popular.stream().limit(5).toList(),
            "stats", Map.of(
                "registrations", regs,
                "topEventName", topEventName != null ? topEventName : "None",
                "topEventCount", topEventCount
            )
        ));
    }
}
