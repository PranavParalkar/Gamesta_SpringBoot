package com.project.gamesta.service;

import com.project.gamesta.model.AuthToken;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.AuthTokenRepository;
import com.project.gamesta.repository.UserRepository;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class AuthService {
    private final UserRepository userRepository;
    private final AuthTokenRepository tokenRepository;
    private final BCryptPasswordEncoder passwordEncoder = new BCryptPasswordEncoder();

    public AuthService(UserRepository userRepository, AuthTokenRepository tokenRepository) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
    }

    public Optional<User> authenticate(String email, String password) {
        return userRepository.findByEmail(email).filter(u -> passwordEncoder.matches(password, u.getPasswordHash()));
    }

    public AuthToken createTokenForUser(User user) {
        AuthToken t = new AuthToken(user);
        return tokenRepository.save(t);
    }

    public User register(String email, String name, String password) {
        String hash = passwordEncoder.encode(password);
        User u = new User(email, name, hash);
        return userRepository.save(u);
    }

    public Optional<User> findUserByToken(String token) {
        return tokenRepository.findByToken(token).map(AuthToken::getUser);
    }
}
