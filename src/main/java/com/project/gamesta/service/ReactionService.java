package com.project.gamesta.service;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.Reaction;
import com.project.gamesta.model.User;
import com.project.gamesta.repository.ReactionRepository;
import org.springframework.stereotype.Service;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ReactionService {
    private final ReactionRepository reactionRepository;

    public ReactionService(ReactionRepository reactionRepository) {
        this.reactionRepository = reactionRepository;
    }

    public Optional<Reaction> findByIdeaAndUser(Idea idea, User user) {
        return reactionRepository.findByIdeaAndUser(idea, user);
    }

    public Reaction createReaction(Idea idea, User user, Reaction.ReactionType type) {
        Reaction r = new Reaction(idea, user, type);
        return reactionRepository.save(r);
    }

    public Reaction save(Reaction reaction) {
        return reactionRepository.save(reaction);
    }

    public void delete(Reaction reaction) {
        reactionRepository.delete(reaction);
    }

    public Map<String, Long> getReactionCounts(Idea idea) {
        List<Object[]> results = reactionRepository.countReactionsByIdea(idea);
        Map<String, Long> counts = new HashMap<>();
        for (Object[] result : results) {
            Reaction.ReactionType type = (Reaction.ReactionType) result[0];
            Long count = (Long) result[1];
            counts.put(type.name(), count);
        }
        return counts;
    }
}
