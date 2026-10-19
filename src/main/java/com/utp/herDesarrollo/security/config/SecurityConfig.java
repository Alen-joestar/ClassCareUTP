package com.utp.herDesarrollo.security.config;

import com.utp.herDesarrollo.security.jwt.JwtAuthenticationFilter;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
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
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

/**
 * Configuración central de seguridad y control de acceso basado en roles (RBAC).
 * Unifica las políticas de acceso para los tres módulos:
 * - Reportes: consulta pública, registro libre y actualización restringida (TECNICO, ADMIN).
 * - Aulas: consulta pública y gestión restringida (POST, PUT, DELETE para TECNICO, ADMIN).
 * - Atenciones: endpoints libres y vistas de seguimiento.
 */
@Configuration
@EnableWebSecurity
@EnableMethodSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    public SecurityConfig(JwtAuthenticationFilter jwtAuthenticationFilter) {
        this.jwtAuthenticationFilter = jwtAuthenticationFilter;
    }

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .sessionManagement(session ->
                        session.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(auth -> auth
                        // Vistas estáticas de los tres módulos
                        .requestMatchers(
                                "/", "/index.html", "/css/**",
                                "/js/**", "/images/**", "/error",
                                "/aulas/**", "/atenciones/**"
                        ).permitAll()

                        // Autenticación JWT
                        .requestMatchers("/api/auth/**").permitAll()

                        // Módulo de Aulas: consultas públicas
                        .requestMatchers(HttpMethod.GET, "/api/aulas/**").permitAll()

                        // Módulo de Aulas: gestión técnica restringida
                        .requestMatchers(HttpMethod.POST, "/api/aulas/**").hasAnyRole("TECNICO", "ADMIN")
                        .requestMatchers(HttpMethod.PUT, "/api/aulas/**").hasAnyRole("TECNICO", "ADMIN")
                        .requestMatchers(HttpMethod.DELETE, "/api/aulas/**").hasAnyRole("TECNICO", "ADMIN")

                        // Módulo de Reportes: consulta y registro libre
                        .requestMatchers(HttpMethod.GET, "/api/reportes/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/reportes").permitAll()

                        // Módulo de Reportes: actualización restringida a personal técnico o admin
                        .requestMatchers(HttpMethod.PUT, "/api/reportes/**").hasAnyRole("TECNICO", "ADMIN")

                        // Módulo de Atenciones: consulta y registro libre
                        .requestMatchers(HttpMethod.GET, "/api/atenciones/**").permitAll()
                        .requestMatchers(HttpMethod.POST, "/api/atenciones").permitAll()

                        // Módulo de Atenciones: actualización restringida a personal técnico o admin
                        .requestMatchers(HttpMethod.PUT, "/api/atenciones/**").hasAnyRole("TECNICO", "ADMIN")

                        // Cualquier otra petición requiere autenticación
                        .anyRequest().authenticated()
                )
                .httpBasic(Customizer.withDefaults())
                .addFilterBefore(
                        jwtAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class
                );

        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(
            AuthenticationConfiguration authenticationConfiguration
    ) throws Exception {
        return authenticationConfiguration.getAuthenticationManager();
    }

    @Bean
    public UserDetailsService userDetailsService(
            PasswordEncoder passwordEncoder,
            @Value("${app.security.tecnico.password}") String passwordTecnico,
            @Value("${app.security.admin.password}") String passwordAdmin
    ) {
        UserDetails tecnico = User.builder()
                .username("tecnico")
                .password(passwordEncoder.encode(passwordTecnico))
                .roles("TECNICO")
                .build();

        UserDetails admin = User.builder()
                .username("admin")
                .password(passwordEncoder.encode(passwordAdmin))
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
