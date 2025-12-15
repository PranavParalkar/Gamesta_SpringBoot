package com.project.gamesta.repository;

import com.project.gamesta.model.Idea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import java.util.List;

public interface IdeaRepository extends JpaRepository<Idea, Long> {
    @Query("select i from Idea i order by i.score desc, i.createdAt desc")
    List<Idea> findTopByScore();
    
    @Query("SELECT i FROM Idea i LEFT JOIN Comment c ON c.idea = i GROUP BY i ORDER BY COUNT(c) DESC")
    List<Idea> findTopByDiscussed();

    boolean existsByTitle(String title);
    List<Idea> findByAuthor(com.project.gamesta.model.User author);
}
