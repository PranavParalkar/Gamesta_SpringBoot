package com.project.gamesta.model;

import jakarta.persistence.*;

@Entity
@Table(name = "login")
public class LoginRecord {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "prn", nullable = false, unique = true)
    private String prn;

    @Column(name = "name")
    private String name;

    @Column(name = "email")
    private String email;

    public LoginRecord() {}

    public Long getId() { return id; }
    public String getPrn() { return prn; }
    public void setPrn(String prn) { this.prn = prn; }
    public String getName() { return name; }
    public void setName(String name) { this.name = name; }
    public String getEmail() { return email; }
    public void setEmail(String email) { this.email = email; }
}
