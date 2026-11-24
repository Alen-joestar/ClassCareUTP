package com.utp.herDesarrollo.config;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.CorsRegistry;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración MVC para el enrutamiento de vistas estáticas y políticas CORS para el cliente Angular.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final String[] allowedOrigins;

    public WebMvcConfig(
            @Value("${app.cors.allowed-origins:http://localhost:4200,http://localhost:80,http://localhost}") String[] allowedOrigins
    ) {
        this.allowedOrigins = allowedOrigins;
    }

    @Override
    public void addCorsMappings(CorsRegistry registry) {
        registry.addMapping("/api/**")
                .allowedOrigins(allowedOrigins)
                .allowedMethods("GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS")
                .allowedHeaders("Authorization", "Content-Type", "Accept", "Origin", "X-Requested-With")
                .exposedHeaders("Authorization")
                .allowCredentials(true)
                .maxAge(3600);
    }

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/aulas").setViewName("forward:/aulas/index.html");
        registry.addViewController("/aulas/").setViewName("forward:/aulas/index.html");
        registry.addViewController("/atenciones").setViewName("forward:/atenciones/index.html");
        registry.addViewController("/atenciones/").setViewName("forward:/atenciones/index.html");
    }
}
