package com.utp.herDesarrollo.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.ViewControllerRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

/**
 * Configuración MVC para el enrutamiento y mapeo de vistas estáticas de la plataforma.
 */
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    @Override
    public void addViewControllers(ViewControllerRegistry registry) {
        registry.addViewController("/aulas").setViewName("forward:/aulas/index.html");
        registry.addViewController("/aulas/").setViewName("forward:/aulas/index.html");
        registry.addViewController("/atenciones").setViewName("forward:/atenciones/index.html");
        registry.addViewController("/atenciones/").setViewName("forward:/atenciones/index.html");
    }
}
