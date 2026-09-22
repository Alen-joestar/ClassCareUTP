package com.utp.webIntegrado.aulas.repository;

import com.utp.webIntegrado.aulas.model.Aula;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AulaRepository extends JpaRepository<Aula, Long> {
}