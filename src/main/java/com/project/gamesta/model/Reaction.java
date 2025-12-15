package com.project.gamesta.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "reactions", uniqueConstraints = @UniqueConstraint(columnNames = {"idea_id","user_id"}))
public class Reaction {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idea_id", nullable = false)
    private Idea idea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private ReactionType type;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public enum ReactionType {
        LIKE, LOVE, HAHA, WOW, SAD, ANGRY
    }

    public Reaction() {}

    public Reaction(Idea idea, User user, ReactionType type) {
        this.idea = idea;
        this.user = user;
        this.type = type;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Idea getIdea() { return idea; }
    public void setIdea(Idea idea) { this.idea = idea; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public ReactionType getType() { return type; }
    public void setType(ReactionType type) { this.type = type; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
