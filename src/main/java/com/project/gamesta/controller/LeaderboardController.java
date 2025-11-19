package com.project.gamesta.controller;

import com.project.gamesta.model.Idea;
import com.project.gamesta.service.IdeaService;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/leaderboard")
public class LeaderboardController {
    private final IdeaService ideaService;

    public LeaderboardController(IdeaService ideaService) {
        this.ideaService = ideaService;
    }

    @GetMapping
    public ResponseEntity<?> leaderboard() {
        List<Idea> list = ideaService.listIdeas().stream()
                .sorted((a,b) -> Integer.compare(b.getScore(), a.getScore()))
                .toList();
        var mapped = list.stream().map(i -> Map.of(
                "id", i.getId(),
                "title", i.getTitle(),
                "author_name", i.getAuthor() != null ? i.getAuthor().getName() : "",
                "score", i.getScore()
        )).toList();
        return ResponseEntity.ok(Map.of("data", mapped));
    }
}
