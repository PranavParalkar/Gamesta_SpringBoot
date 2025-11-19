package com.project.gamesta.model;

import jakarta.persistence.*;
import java.time.Instant;
import java.util.UUID;

@Entity
@Table(name = "auth_tokens")
public class AuthToken {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String token;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public AuthToken() {}

    public AuthToken(User user) {
        this.user = user;
        this.token = UUID.randomUUID().toString();
    }

    public Long getId() { return id; }
    public String getToken() { return token; }
    public User getUser() { return user; }
    public Instant getCreatedAt() { return createdAt; }
}
