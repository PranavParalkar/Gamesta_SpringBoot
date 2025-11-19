package com.project.gamesta.repository;

import com.project.gamesta.model.LoginRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.Optional;

public interface LoginRepository extends JpaRepository<LoginRecord, Long> {
    Optional<LoginRecord> findByPrn(String prn);
}
