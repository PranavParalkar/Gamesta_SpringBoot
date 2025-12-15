package com.project.gamesta.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "comments")
public class Comment {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 2000)
    private String content;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "idea_id", nullable = false)
    private Idea idea;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User author;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    public Comment() {}

    public Comment(String content, Idea idea, User author) {
        this.content = content;
        this.idea = idea;
        this.author = author;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getContent() { return content; }
    public void setContent(String content) { this.content = content; }
    
    @JsonIgnore
    public Idea getIdea() { return idea; }
    public void setIdea(Idea idea) { this.idea = idea; }
    
    @JsonIgnore
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }
    
    @JsonProperty("author_name")
    public String getAuthorName() {
        return this.author != null ? this.author.getName() : null;
    }
    
    @JsonProperty("idea_id")
    public Long getIdeaId() {
        return this.idea != null ? this.idea.getId() : null;
    }
    
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
}


