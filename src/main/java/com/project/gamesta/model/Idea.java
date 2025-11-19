package com.project.gamesta.model;

import com.fasterxml.jackson.annotation.JsonIgnore;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "ideas")
@JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
public class Idea {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false)
    private String title;

    @Column(length = 1000)
    private String description;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "author_id")
    private User author;

    @Column(nullable = false)
    private Instant createdAt = Instant.now();

    @Column(nullable = false)
    private int upvoteCount = 0;

    @Column(nullable = false)
    private int score = 0;

    public Idea() {}

    public Idea(String title, String description, User author) {
        this.title = title;
        this.description = description;
        this.author = author;
    }

    public Long getId() { return id; }
    public void setId(Long id) { this.id = id; }
    public String getTitle() { return title; }
    public void setTitle(String title) { this.title = title; }
    public String getDescription() { return description; }
    public void setDescription(String description) { this.description = description; }
    @JsonIgnore
    public User getAuthor() { return author; }
    public void setAuthor(User author) { this.author = author; }

    @JsonProperty("author_name")
    public String getAuthorName() {
        return this.author != null ? this.author.getName() : null;
    }
    public Instant getCreatedAt() { return createdAt; }
    public void setCreatedAt(Instant createdAt) { this.createdAt = createdAt; }
    public int getUpvoteCount() { return upvoteCount; }
    public void setUpvoteCount(int upvoteCount) { this.upvoteCount = upvoteCount; }
    public int getScore() { return score; }
    public void setScore(int score) { this.score = score; }
}
