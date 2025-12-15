package com.project.gamesta.repository;

import com.project.gamesta.model.Comment;
import com.project.gamesta.model.Idea;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByIdeaOrderByCreatedAtAsc(Idea idea);
    List<Comment> findByAuthor(com.project.gamesta.model.User author);
    long countByIdea(Idea idea);
}


