package com.project.gamesta.model;

import jakarta.persistence.*;
import java.time.Instant;

@Entity
@Table(name = "event_registrations")
@com.fasterxml.jackson.annotation.JsonIgnoreProperties({"hibernateLazyInitializer","handler"})
public class EventRegistration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String eventName;

    private Integer price; // store snapshot price in INR

    private String paymentId;
    private String orderId;

    @Column(nullable = false, updatable = false)
    private Instant createdAt;

    @PrePersist
    public void prePersist() {
        createdAt = Instant.now();
    }

    public EventRegistration() {}

    public EventRegistration(User user, String eventName, Integer price, String paymentId, String orderId) {
        this.user = user;
        this.eventName = eventName;
        this.price = price;
        this.paymentId = paymentId;
        this.orderId = orderId;
    }

    public Long getId() { return id; }
    public User getUser() { return user; }
    public String getEventName() { return eventName; }
    public Integer getPrice() { return price; }
    public String getPaymentId() { return paymentId; }
    public String getOrderId() { return orderId; }
    public Instant getCreatedAt() { return createdAt; }
}
