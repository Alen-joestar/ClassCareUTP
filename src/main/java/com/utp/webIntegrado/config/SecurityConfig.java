package com.utp.webIntegrado.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.provisioning.InMemoryUserDetailsManager;
import com.utp.webIntegrado.security.JwtAuthenticationFilter;
import com.utp.webIntegrado.security.JwtService;

import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
@Configuration
public class SecurityConfig {

    @Bean
public SecurityFilterChain securityFilterChain(
        HttpSecurity http,
        JwtService jwtService,
        UserDetailsService userDetailsService) throws Exception {

    JwtAuthenticationFilter jwtFilter =
        new JwtAuthenticationFilter(jwtService, userDetailsService);

    http
        .csrf(csrf -> csrf.disable())
        .sessionManagement(session -> session
            .sessionCreationPolicy(SessionCreationPolicy.STATELESS)
        )
        .authorizeHttpRequests(auth -> auth
            .requestMatchers(HttpMethod.POST, "/api/auth/login").permitAll()
            .requestMatchers(HttpMethod.GET, "/api/aulas/**").permitAll()
            .requestMatchers(HttpMethod.POST, "/api/aulas").authenticated()
            .requestMatchers(HttpMethod.PUT, "/api/aulas/**").authenticated()
            .anyRequest().permitAll()
        )
        .addFilterBefore(
            jwtFilter,
            UsernamePasswordAuthenticationFilter.class
        );

    return http.build();
}
    @Bean
public PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
}

@Bean
public UserDetailsService userDetailsService(
        PasswordEncoder passwordEncoder,
        @Value("${app.auth.username}") String username,
        @Value("${app.auth.password}") String password) {

    var usuario = User.withUsername(username)
        .password(passwordEncoder.encode(password))
        .roles("ADMIN_AULAS")
        .build();

    return new InMemoryUserDetailsManager(usuario);
}

@Bean
public AuthenticationManager authenticationManager(
        AuthenticationConfiguration configuration)
        throws Exception {
    return configuration.getAuthenticationManager();
}
}