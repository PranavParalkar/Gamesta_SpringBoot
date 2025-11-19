package com.project.gamesta.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "votes", uniqueConstraints = @UniqueConstraint(columnNames = {"idea_id","user_id"}))
public class Vote {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idea_id", nullable = false)
    private Idea idea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private int value = 1;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Vote() {}

    public Vote(Idea idea, User user, int value) {
        this.idea = idea;
        this.user = user;
        this.value = value;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public Idea getIdea() { return idea; }
    public void setIdea(Idea idea) { this.idea = idea; }
    public User getUser() { return user; }
    public void setUser(User user) { this.user = user; }
    public int getValue() { return value; }
    public void setValue(int value) { this.value = value; }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}
