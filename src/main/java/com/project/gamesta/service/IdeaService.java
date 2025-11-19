package com.project.gamesta.service;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.IdeaRepository;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;

@Service
public class IdeaService {
    private final IdeaRepository ideaRepository;

    public IdeaService(IdeaRepository ideaRepository) {
        this.ideaRepository = ideaRepository;
    }

    public Idea createIdea(String title, String description, User author) {
        Idea i = new Idea(title, description, author);
        return ideaRepository.save(i);
    }

    public List<Idea> listIdeas() {
        return ideaRepository.findAll();
    }

    public Optional<Idea> findById(Long id) { return ideaRepository.findById(id); }

    public Idea save(Idea idea) { return ideaRepository.save(idea); }

    public void delete(Idea idea) { ideaRepository.delete(idea); }
}
