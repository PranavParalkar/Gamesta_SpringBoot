package com.project.gamesta.config;

import com.project.gamesta.model.EventCatalog;
import com.project.gamesta.repository.EventCatalogRepository;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;

import java.util.LinkedHashMap;
import java.util.Map;

@Component
public class EventDataInitializer implements ApplicationRunner {
    private final EventCatalogRepository repo;

    public EventDataInitializer(EventCatalogRepository repo) {
        this.repo = repo;
    }

    @Override
    public void run(ApplicationArguments args) {
        // Seed events if table is empty
        if (repo.count() > 0) return;

        Map<String, Integer> priceMap = new LinkedHashMap<>();
        priceMap.put("BGMI Tournament", 200);
        priceMap.put("Chess Tournament", 150);
        priceMap.put("Debate Contest", 100);
        priceMap.put("Drone Race Competition", 300);
        priceMap.put("VR Experience", 250);
        priceMap.put("Photography Scavenger Hunt", 120);
        priceMap.put("Dance Face-off", 180);
        priceMap.put("Flying Simulator", 350);
        priceMap.put("Ramp Walk", 100);
        priceMap.put("GSQ (Google Squid Games)", 280);
        priceMap.put("Drone Simulator Competition", 320);
        priceMap.put("AeroCAD Face-Off", 200);
        priceMap.put("Poster Design Competition", 80);
        priceMap.put("Mobile Robocar Racing", 400);
        priceMap.put("Strongest on Campus", 150);
        priceMap.put("Valorant Tournament", 220);

        // Default ticket limit for all; adjust as needed later
        int defaultLimit = 100;

        priceMap.forEach((name, price) -> {
            if (!repo.existsByName(name)) {
                repo.save(new EventCatalog(name, price, defaultLimit, true));
            }
        });
    }
}
