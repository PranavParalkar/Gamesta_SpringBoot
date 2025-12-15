package com.project.gamesta.repository;

import com.project.gamesta.model.AuthToken;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface AuthTokenRepository extends JpaRepository<AuthToken, Long> {
    Optional<AuthToken> findByToken(String token);
    java.util.List<AuthToken> findByUser(com.project.gamesta.model.User user);
}
