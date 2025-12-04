package com.project.gamesta.repository;

import com.project.gamesta.model.EventCatalog;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface EventCatalogRepository extends JpaRepository<EventCatalog, Long> {
    Optional<EventCatalog> findByName(String name);
    boolean existsByName(String name);
    List<EventCatalog> findAllByActiveTrueOrderByNameAsc();
}
