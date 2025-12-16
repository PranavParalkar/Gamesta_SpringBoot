package com.project.gamesta.controller;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.model.Vote;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.repository.IdeaRepository;
import com.project.gamesta.repository.UserRepository;
import com.project.gamesta.service.IdeaService;
import com.project.gamesta.service.VoteService;
import com.project.gamesta.service.ReactionService;
import com.project.gamesta.model.Reaction;
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
    
    private final ReactionService reactionService;
    
    @Autowired(required = false)
    private SocketIOController socketIOController;

    public IdeaController(IdeaService ideaService, VoteService voteService, UserRepository userRepository, AuthTokenRepository tokenRepository, ReactionService reactionService) {
        this.ideaService = ideaService;
        this.voteService = voteService;
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.reactionService = reactionService;
    }

    @GetMapping
    public ResponseEntity<?> list(@RequestHeader(value = "Authorization", required = false) String auth) {
        User user = resolveUser(auth);
        List<Idea> list = ideaService.listIdeas();
        
        // Enrich with reaction data
        List<Map<String, Object>> enrichedList = list.stream().map(idea -> {
            Map<String, Object> map = new java.util.HashMap<>();
            map.put("id", idea.getId());
            map.put("title", idea.getTitle());
            map.put("description", idea.getDescription());
            map.put("score", idea.getScore());
            map.put("upvoteCount", idea.getUpvoteCount());
            map.put("createdAt", idea.getCreatedAt());
            map.put("author_name", idea.getAuthorName());
            
            // Vote status
            if (user != null) {
                map.put("voted_by_you", voteService.findByIdeaAndUser(idea, user).isPresent());
                var reaction = reactionService.findByIdeaAndUser(idea, user);
                if (reaction.isPresent()) {
                    map.put("user_reaction", reaction.get().getType().name());
                }
            }
            
            // Reaction counts
            map.put("reaction_counts", reactionService.getReactionCounts(idea));
            
            return map;
        }).collect(java.util.stream.Collectors.toList());
        
        return ResponseEntity.ok(Map.of("data", enrichedList));
    }

    @PostMapping
    public ResponseEntity<?> create(@RequestHeader(value = "Authorization", required = false) String auth,
                                    @RequestBody Map<String, Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));

        String title = (String) body.get("title");
        String description = (String) body.getOrDefault("description", "");
        if (title == null || title.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "title is required"));
        }

        Idea created = ideaService.createIdea(title.trim(), description, user);

        Map<String, Object> result = new java.util.HashMap<>();
        result.put("id", created.getId());
        result.put("title", created.getTitle());
        result.put("description", created.getDescription());
        result.put("score", created.getScore());
        result.put("upvoteCount", created.getUpvoteCount());
        result.put("createdAt", created.getCreatedAt());
        result.put("author_name", created.getAuthorName());
        result.put("reaction_counts", Map.of());

        return ResponseEntity.ok(Map.of("data", result));
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
            
            if (socketIOController != null) {
                socketIOController.emitVoteUpdate(id, idea.getScore(), idea.getUpvoteCount());
            }
            return ResponseEntity.ok(Map.of("stats", Map.of("score", idea.getScore())));
        } else {
            voteService.createVote(idea, user, voteValue);
            idea.setUpvoteCount(idea.getUpvoteCount() + 1);
            idea.setScore(idea.getScore() + voteValue);
            ideaService.save(idea);
            
            if (socketIOController != null) {
                socketIOController.emitVoteUpdate(id, idea.getScore(), idea.getUpvoteCount());
            }
            return ResponseEntity.ok(Map.of("stats", Map.of("score", idea.getScore())));
        }
    }

    @PostMapping("/{id}/react")
    public ResponseEntity<?> react(@RequestHeader(value = "Authorization", required = false) String auth, @PathVariable Long id, @RequestBody Map<String,Object> body) {
        User user = resolveUser(auth);
        if (user == null) return ResponseEntity.status(401).body(Map.of("error","unauthorized"));
        var opt = ideaService.findById(id);
        if (opt.isEmpty()) return ResponseEntity.status(404).body(Map.of("error","not found"));
        Idea idea = opt.get();
        
        String reactionStr = (String) body.getOrDefault("reaction", "LIKE");
        Reaction.ReactionType reactionType;
        try {
            reactionType = Reaction.ReactionType.valueOf(reactionStr.toUpperCase());
        } catch (IllegalArgumentException e) {
            reactionType = Reaction.ReactionType.LIKE;
        }

        var existing = reactionService.findByIdeaAndUser(idea, user);
        if (existing.isPresent()) {
            Reaction r = existing.get();
            if (r.getType() == reactionType) {
                // Toggle off
                reactionService.delete(r);
                return ResponseEntity.ok(Map.of("removed", true, "reaction_counts", reactionService.getReactionCounts(idea)));
            } else {
                // Change reaction
                r.setType(reactionType);
                reactionService.save(r);
                return ResponseEntity.ok(Map.of("updated", true, "reaction_counts", reactionService.getReactionCounts(idea)));
            }
        } else {
            // New reaction
            reactionService.createReaction(idea, user, reactionType);
            return ResponseEntity.ok(Map.of("added", true, "reaction_counts", reactionService.getReactionCounts(idea)));
        }
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }
}
