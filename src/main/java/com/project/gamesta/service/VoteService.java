package com.project.gamesta.service;

import com.project.gamesta.model.Idea;
import com.project.gamesta.model.User;
import com.project.gamesta.model.Vote;
import com.project.gamesta.repository.VoteRepository;
import org.springframework.stereotype.Service;

import java.util.Optional;

@Service
public class VoteService {
    private final VoteRepository voteRepository;

    public VoteService(VoteRepository voteRepository) {
        this.voteRepository = voteRepository;
    }

    public Optional<Vote> findByIdeaAndUser(Idea idea, User user) {
        return voteRepository.findByIdeaAndUser(idea, user);
    }

    public Vote createVote(Idea idea, User user, int value) {
        Vote v = new Vote(idea, user, value);
        return voteRepository.save(v);
    }

    public void delete(Vote vote) { voteRepository.delete(vote); }
}
