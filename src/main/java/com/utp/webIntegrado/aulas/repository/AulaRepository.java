package com.utp.webIntegrado.aulas.repository;

import com.utp.webIntegrado.aulas.model.Aula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

import java.util.List;

public interface AulaRepository extends JpaRepository<Aula, Long> {

    @Query("SELECT a FROM Aula a WHERE a.estado = 'Disponible'")
    List<Aula> listarAulasDisponibles();
}