package com.project.gamesta.repository;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.Reaction;
import com.project.gamesta.model.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface ReactionRepository extends JpaRepository<Reaction, Long> {
    Optional<Reaction> findByIdeaAndUser(Idea idea, User user);
    
    @Query("SELECT r.type, COUNT(r) FROM Reaction r WHERE r.idea = :idea GROUP BY r.type")
    List<Object[]> countReactionsByIdea(@Param("idea") Idea idea);
    
    List<Reaction> findByIdea(Idea idea);
}
