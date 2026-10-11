package com.utp.herDesarrollo.security.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import org.springframework.security.web.SecurityFilterChain;

/**
 * Configuración central de seguridad y control de acceso basado en roles (RBAC).
 * Semana 8:
 * - Habilita registro público de incidencias (POST /api/reportes) y consultas (GET).
 * - Restringe operaciones de modificación/actualización (PUT /api/reportes/**) a roles TECNICO y ADMIN.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Vistas estáticas y formulario web
                        .requestMatchers("/", "/index.html", "/css/**", "/js/**", "/images/**", "/error").permitAll()
                        // Endpoints de aulas universitarias (acceso de consulta libre)
                        .requestMatchers(HttpMethod.GET, "/api/aulas/**").permitAll()
                        // Módulo de Reportes: consulta pública de reportes
                        .requestMatchers(HttpMethod.GET, "/api/reportes/**").permitAll()
                        // Módulo de Reportes: creación pública de reportes
                        .requestMatchers(HttpMethod.POST, "/api/reportes").permitAll()
                        // Módulo de Reportes: actualización de incidencias restringida a personal técnico o admin
                        .requestMatchers(HttpMethod.PUT, "/api/reportes/**").hasAnyRole("TECNICO", "ADMIN")
                        // Cualquier otra petición requiere autenticación
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults());

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
        UserDetails tecnico = User.builder()
                .username("tecnico")
                .password(passwordEncoder.encode("tecnico123"))
                .roles("TECNICO")
                .build();

        UserDetails admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode("admin123"))
                .roles("ADMIN")
                .build();

        UserDetails alumno = User.builder()
                .username("alumno")
                .password(passwordEncoder.encode("alumno123"))
                .roles("ALUMNO")
                .build();

        return new InMemoryUserDetailsManager(tecnico, admin, alumno);
    }
}
