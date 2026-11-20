package com.utp.herDesarrollo.aulas.controller;

import com.utp.herDesarrollo.aulas.model.Aula;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

import java.math.BigDecimal;

public record AulaRequestDTO(
        String codigo,
        String ubicacion,
        BigDecimal capacidad,
        String estado
) {

    public Aula toEntity() {
        int capacidadEntera = 0;
        if (capacidad != null) {
            try {
                capacidadEntera = capacidad.intValueExact();
            } catch (ArithmeticException exception) {
                throw new ResponseStatusException(
                        HttpStatus.BAD_REQUEST,
                        "La capacidad debe ser un número entero entre 1 y 200"
                );
            }
        }

        return new Aula(null, codigo, ubicacion, capacidadEntera, estado);
    }
}
