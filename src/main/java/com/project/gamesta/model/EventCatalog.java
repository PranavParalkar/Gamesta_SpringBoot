package com.project.gamesta.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "events")
public class EventCatalog {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String name;

    @Column(nullable = false)
    private Integer price; // INR per ticket

    @Column(nullable = true)
    private Integer ticketLimit; // null = unlimited

    @Column(nullable = false)
    private Boolean active = true;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
        if (active == null) active = true;
    }

    public EventCatalog() {}

    public EventCatalog(String name, Integer price, Integer ticketLimit, Boolean active) {
        this.name = name;
        this.price = price;
        this.ticketLimit = ticketLimit;
        this.active = active != null ? active : true;
    }

    public Long getId() { return id; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public Integer getPrice() { return price; }
    public void setPrice(Integer price) { this.price = price; }
    public Integer getTicketLimit() { return ticketLimit; }
    public void setTicketLimit(Integer ticketLimit) { this.ticketLimit = ticketLimit; }
    public Boolean getActive() { return active; }
    public void setActive(Boolean active) { this.active = active; }
    public Instant getCreatedAt() { return createdAt; }
}
