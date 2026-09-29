package com.utp.webIntegrado.aulas.controller;

import com.utp.webIntegrado.aulas.model.Aula;
import com.utp.webIntegrado.aulas.service.AulaService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.WebMvcTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@WebMvcTest(AulaController.class)
class AulaControllerTest {

    @Autowired
    private MockMvc mockMvc;

   @MockitoBean
    private AulaService aulaService;

    @Test
    void debeRegistrarAula() throws Exception {

        Aula aulaRegistrada = new Aula(
                1L,
                "A-101",
                "Pabellón A - Primer piso",
                40,
                "Disponible"
        );

        when(aulaService.registrarAula(any(Aula.class)))
                .thenReturn(aulaRegistrada);

        mockMvc.perform(post("/api/aulas")
                .contentType(MediaType.APPLICATION_JSON)
                .content("""
                        {
                            "codigo": "A-101",
                            "ubicacion": "Pabellón A - Primer piso",
                            "capacidad": 40,
                            "estado": "Disponible"
                        }
                        """))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(1))
                .andExpect(jsonPath("$.codigo").value("A-101"))
                .andExpect(jsonPath("$.ubicacion").value("Pabellón A - Primer piso"))
                .andExpect(jsonPath("$.capacidad").value(40))
                .andExpect(jsonPath("$.estado").value("Disponible"));
    }
}