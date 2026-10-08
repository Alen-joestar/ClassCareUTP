package com.utp.webIntegrado.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.web.SecurityFilterChain;

@Configuration
public class SecurityConfig {

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {

        http
            .csrf(csrf -> csrf.disable())
            .authorizeHttpRequests(auth -> auth
                .requestMatchers(HttpMethod.GET, "/api/aulas/**").permitAll()
                .requestMatchers(HttpMethod.POST, "/api/aulas").authenticated()
                .requestMatchers(HttpMethod.PUT, "/api/aulas/**").authenticated()
                .anyRequest().permitAll()
            );

        return http.build();
    }
}