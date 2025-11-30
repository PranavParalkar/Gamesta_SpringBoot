package com.project.gamesta.controller;

import com.corundumstudio.socketio.SocketIOClient;
import com.corundumstudio.socketio.SocketIOServer;
import com.corundumstudio.socketio.annotation.OnConnect;
import com.corundumstudio.socketio.annotation.OnDisconnect;
import com.corundumstudio.socketio.annotation.OnEvent;
import com.project.gamesta.model.Comment;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

import java.util.HashMap;
import java.util.Map;

@Component
public class SocketIOController {

    @Autowired
    private SocketIOServer socketIOServer;

    @Autowired
    private AuthTokenRepository tokenRepository;

    private final Map<String, User> connectedUsers = new HashMap<>();

    @OnConnect
    public void onConnect(SocketIOClient client) {
        // Try to get token from query params or auth header
        String token = client.getHandshakeData().getSingleUrlParam("token");
        if (token == null || token.isEmpty()) {
            // Try from auth header if available
            token = client.getHandshakeData().getHttpHeaders().get("Authorization");
            if (token != null && token.startsWith("Bearer ")) {
                token = token.substring(7);
            }
        }
        
        if (token != null && !token.isEmpty()) {
            tokenRepository.findByToken(token).ifPresent(authToken -> {
                connectedUsers.put(client.getSessionId().toString(), authToken.getUser());
                System.out.println("User connected: " + authToken.getUser().getName());
            });
        } else {
            System.out.println("Client connected without token: " + client.getSessionId());
        }
    }

    @OnDisconnect
    public void onDisconnect(SocketIOClient client) {
        connectedUsers.remove(client.getSessionId().toString());
    }

    @OnEvent("join_idea")
    public void onJoinIdea(SocketIOClient client, Long ideaId) {
        client.joinRoom("idea_" + ideaId);
    }

    @OnEvent("leave_idea")
    public void onLeaveIdea(SocketIOClient client, Long ideaId) {
        client.leaveRoom("idea_" + ideaId);
    }

    // Emit new comment to all clients in the idea room
    public void emitNewComment(Long ideaId, Comment comment) {
        Map<String, Object> data = new HashMap<>();
        data.put("id", comment.getId());
        data.put("content", comment.getContent());
        data.put("author_name", comment.getAuthorName());
        data.put("idea_id", comment.getIdeaId());
        data.put("created_at", comment.getCreatedAt().toString());
        
        socketIOServer.getRoomOperations("idea_" + ideaId).sendEvent("new_comment", data);
    }

    // Emit updated vote/score to all clients in the idea room
    public void emitVoteUpdate(Long ideaId, int score, int upvoteCount) {
        Map<String, Object> data = new HashMap<>();
        data.put("idea_id", ideaId);
        data.put("score", score);
        data.put("upvote_count", upvoteCount);
        
        socketIOServer.getRoomOperations("idea_" + ideaId).sendEvent("vote_update", data);
    }
}

