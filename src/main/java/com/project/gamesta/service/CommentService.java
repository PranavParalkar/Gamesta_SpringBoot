package com.project.gamesta.service;

import com.project.gamesta.model.Comment;
import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.CommentRepository;
import org.springframework.stereotype.Service;

import java.util.List;

@Service
public class CommentService {
    private final CommentRepository commentRepository;

    public CommentService(CommentRepository commentRepository) {
        this.commentRepository = commentRepository;
    }

    public Comment createComment(String content, Idea idea, User author) {
        Comment comment = new Comment(content, idea, author);
        return commentRepository.save(comment);
    }

    public List<Comment> getCommentsByIdea(Idea idea) {
        return commentRepository.findByIdeaOrderByCreatedAtAsc(idea);
    }

    public long getCommentCount(Idea idea) {
        return commentRepository.countByIdea(idea);
    }

    public void deleteComment(Comment comment) {
        commentRepository.delete(comment);
    }
}


