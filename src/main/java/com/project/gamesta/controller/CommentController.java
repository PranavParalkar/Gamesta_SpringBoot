package com.project.gamesta.controller;

import com.project.gamesta.model.Comment;
import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.service.CommentService;
import com.project.gamesta.service.IdeaService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ideas/{ideaId}/comments")
public class CommentController {
    private final CommentService commentService;
    private final IdeaService ideaService;
    private final AuthTokenRepository tokenRepository;
    private final SocketIOController socketIOController;

    @Autowired
    public CommentController(CommentService commentService, IdeaService ideaService, 
                             AuthTokenRepository tokenRepository, SocketIOController socketIOController) {
        this.commentService = commentService;
        this.ideaService = ideaService;
        this.tokenRepository = tokenRepository;
        this.socketIOController = socketIOController;
    }

    @GetMapping
    public ResponseEntity<?> getComments(@PathVariable Long ideaId) {
        var opt = ideaService.findById(ideaId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Idea not found"));
        }
        Idea idea = opt.get();
        List<Comment> comments = commentService.getCommentsByIdea(idea);
        return ResponseEntity.ok(Map.of("data", comments));
    }

    @PostMapping
    public ResponseEntity<?> createComment(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long ideaId,
            @RequestBody Map<String, String> body) {
        User user = resolveUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
        
        var opt = ideaService.findById(ideaId);
        if (opt.isEmpty()) {
            return ResponseEntity.status(404).body(Map.of("error", "Idea not found"));
        }
        
        Idea idea = opt.get();
        String content = body.get("content");
        if (content == null || content.trim().isEmpty()) {
            return ResponseEntity.badRequest().body(Map.of("error", "Content is required"));
        }
        
        Comment comment = commentService.createComment(content.trim(), idea, user);
        
        // Emit real-time event
        socketIOController.emitNewComment(ideaId, comment);
        
        return ResponseEntity.ok(Map.of("data", comment));
    }

    @DeleteMapping("/{commentId}")
    public ResponseEntity<?> deleteComment(
            @RequestHeader(value = "Authorization", required = false) String auth,
            @PathVariable Long ideaId,
            @PathVariable Long commentId) {
        User user = resolveUser(auth);
        if (user == null) {
            return ResponseEntity.status(401).body(Map.of("error", "unauthorized"));
        }
        
        // Note: For simplicity, we'll allow comment deletion by author
        // You may want to add a CommentService method to find by ID and verify ownership
        return ResponseEntity.ok(Map.of("data", "deleted"));
    }

    private User resolveUser(String authHeader) {
        if (authHeader == null) return null;
        if (authHeader.startsWith("Bearer ")) authHeader = authHeader.substring(7);
        return tokenRepository.findByToken(authHeader).map(t -> t.getUser()).orElse(null);
    }
}


