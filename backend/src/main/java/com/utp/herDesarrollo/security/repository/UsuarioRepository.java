package com.utp.herDesarrollo.security.repository;

import com.utp.herDesarrollo.security.model.RolUsuario;
import com.utp.herDesarrollo.security.model.Usuario;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface UsuarioRepository extends JpaRepository<Usuario, Long> {

    Optional<Usuario> findByUsernameIgnoreCase(String username);

    boolean existsByUsernameIgnoreCase(String username);

    boolean existsByCorreoIgnoreCase(String correo);

    List<Usuario> findByRolAndActivoTrueOrderByNombreCompletoAsc(RolUsuario rol);

    List<Usuario> findAllByOrderByFechaRegistroDesc();
}
