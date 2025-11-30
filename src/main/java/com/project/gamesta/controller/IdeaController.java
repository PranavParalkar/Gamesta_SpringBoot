package com.project.gamesta.controller;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.model.Vote;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.repository.IdeaRepository;
import com.project.gamesta.repository.UserRepository;
import com.project.gamesta.service.IdeaService;
import com.project.gamesta.service.VoteService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ideas")
public class IdeaController {
    private final IdeaService ideaService;
    private final VoteService voteService;
    private final UserRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    
    @Autowired(required = false)
    private SocketIOController socketIOController;

    public IdeaController(IdeaService ideaService, VoteService voteService, UserRepository userRepository, AuthTokenRepository tokenRepository) {
        this.ideaService = ideaService;
        this.voteService = voteService;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
    }

    @GetMapping
    public ResponseEntity<?> list() {
        List<Idea> list = ideaService.listIdeas();
        return ResponseEntity.ok(Map.of("data", list));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String auth, @RequestBody Map<String,Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        String title = (String) body.get("title");
        String description = (String) body.get("description");
        Idea i = ideaService.createIdea(title, description, user);
        return ResponseEntity.ok(Map.of("data", i));
    }

    @PatchMapping("/{id}")
    public ResponseEntity<?> update(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id, @RequestBody Map<String,String> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        var opt = ideaService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","not found"));
        Idea idea = opt.get();
        if (!idea.getAuthor().getId().equals(user.getId())) return ResponseEntity.status(403).body(Map.of("error","forbidden"));
        idea.setTitle(body.getOrDefault("title", idea.getTitle()));
        idea.setDescription(body.getOrDefault("description", idea.getDescription()));
        ideaService.save(idea);
        return ResponseEntity.ok(Map.of("data", idea));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<?> delete(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        var opt = ideaService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","not found"));
        Idea idea = opt.get();
        if (!idea.getAuthor().getId().equals(user.getId())) return ResponseEntity.status(403).body(Map.of("error","forbidden"));
        ideaService.delete(idea);
        return ResponseEntity.ok(Map.of("data","deleted"));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> vote(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id, @RequestBody Map<String,Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        var opt = ideaService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","not found"));
        Idea idea = opt.get();
        int voteValue = (int) ((Number) body.getOrDefault("vote", 1)).intValue();
        var existing = voteService.findByIdeaAndUser(idea, user);
        if (existing.isPresent()) {
            // remove vote
            voteService.delete(existing.get());
            idea.setUpvoteCount(Math.max(0, idea.getUpvoteCount() - 1));
            idea.setScore(Math.max(0, idea.getScore() - 1));
            ideaService.save(idea);
            
            // Emit real-time vote update
            if (socketIOController != null) {
                socketIOController.emitVoteUpdate(id, idea.getScore(), idea.getUpvoteCount());
            }
            
            return ResponseEntity.ok(Map.of("stats", Map.of("score", idea.getScore())));
        } else {
            voteService.createVote(idea, user, voteValue);
            idea.setUpvoteCount(idea.getUpvoteCount() + 1);
            idea.setScore(idea.getScore() + voteValue);
            ideaService.save(idea);
            
            // Emit real-time vote update
            if (socketIOController != null) {
                socketIOController.emitVoteUpdate(id, idea.getScore(), idea.getUpvoteCount());
            }
            
            return ResponseEntity.ok(Map.of("stats", Map.of("score", idea.getScore())));
        }
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }
}
