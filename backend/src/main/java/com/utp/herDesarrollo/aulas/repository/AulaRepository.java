
package com.utp.herDesarrollo.aulas.repository;

import com.utp.herDesarrollo.aulas.model.Aula;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface AulaRepository extends JpaRepository<Aula, Long> {

    boolean existsByCodigo(String codigo);

    Optional<Aula> findByCodigo(String codigo);

    Optional<Aula> findByCodigoIgnoreCase(String codigo);

    @Query("SELECT a FROM Aula a WHERE LOWER(a.estado) = LOWER(:estado) ORDER BY a.codigo")
    List<Aula> buscarPorEstado(@Param("estado") String estado);

    @Query("SELECT a FROM Aula a WHERE a.capacidad >= :capacidad ORDER BY a.capacidad ASC")
    List<Aula> buscarPorCapacidadMinima(@Param("capacidad") int capacidad);

    @Query("SELECT COUNT(a) FROM Aula a WHERE LOWER(a.estado) = LOWER(:estado)")
    long contarPorEstado(@Param("estado") String estado);
}
