package com.project.gamesta.repository;

import com.project.gamesta.model.EventRegistration;
import com.project.gamesta.model.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface EventRegistrationRepository extends JpaRepository<EventRegistration, Long> {
    List<EventRegistration> findByUser(User user);
}
