package com.project.gamesta.repository;

import com.project.gamesta.model.Vote;
import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface VoteRepository extends JpaRepository<Vote, Long> {
    Optional<Vote> findByIdeaAndUser(Idea idea, User user);
    java.util.List<Vote> findByIdea(Idea idea);
    java.util.List<Vote> findByUser(User user);
    long countByIdea(Idea idea);
}
