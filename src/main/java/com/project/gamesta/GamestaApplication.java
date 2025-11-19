package com.project.gamesta;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import com.project.gamesta.repository.UserRepository;
import com.project.gamesta.service.AuthService;
import com.project.gamesta.service.IdeaService;

import java.util.List;


@SpringBootApplication
public class GamestaApplication {

	public static void main(String[] args) {
		SpringApplication.run(GamestaApplication.class, args);
	}

	@Bean
	public org.springframework.boot.CommandLineRunner seed(UserRepository ur, AuthService authService, IdeaService ideaService) {
		return args -> {
			if (ur.count() == 0) {
				var u = authService.register("demo@example.com", "Demo User", "password123");
				var t = authService.createTokenForUser(u);
				ideaService.createIdea("Sample idea 1", "This is a seeded sample idea for development.", u);
				ideaService.createIdea("Sample idea 2", "Another seeded idea to show leaderboard.", u);
				System.out.println("Seeded demo user: token=" + t.getToken());
			}
		};
	}

}
