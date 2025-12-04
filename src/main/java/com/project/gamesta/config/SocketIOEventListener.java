package com.project.gamesta.config;

import com.corundumstudio.socketio.SocketIOServer;
import com.project.gamesta.controller.SocketIOController;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Component
public class SocketIOEventListener {

    @Autowired
    private SocketIOServer socketIOServer;

    @Autowired
    private SocketIOController socketIOController;

    @PostConstruct
    public void start() {
        // Register event listeners
        try {
            socketIOServer.addListeners(socketIOController);
            socketIOServer.start();
            System.out.println("Socket.io server started on port: " + socketIOServer.getConfiguration().getPort());
        } catch (Exception e) {
            System.err.println("Socket.io server failed to start: " + e.getMessage());
            // Do not fail application startup due to socket server
        }
    }

    @PreDestroy
    public void stop() {
        socketIOServer.stop();
    }
}

