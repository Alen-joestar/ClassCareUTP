
package com.utp.herDesarrollo.aulas.controller;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.service.AulaService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.bean.override.mockito.MockitoBean;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors;

import java.util.List;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@SpringBootTest
@AutoConfigureMockMvc
class AulaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockitoBean
    private AulaService aulaService;

    private Aula aulaEjemplo;

    @BeforeEach
    void prepararDatos() {
        aulaEjemplo = new Aula(
                1L,
                "A-101",
                "Pabellon A - Primer piso",
                40,
                "Disponible"
        );
    }

    @Test
    void debePermitirConsultarAulasSinAutenticacion() throws Exception {
        when(aulaService.listarAulas())
                .thenReturn(List.of(aulaEjemplo));

        mockMvc.perform(get("/api/aulas"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].codigo").value("A-101"));
    }

    @Test
    void debeRechazarRegistroSinAutenticacion() throws Exception {
        mockMvc.perform(post("/api/aulas")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "codigo": "A-102",
                                    "ubicacion": "Pabellon A - Segundo piso",
                                    "capacidad": 35,
                                    "estado": "Disponible"
                                }
                                """))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void debePermitirRegistroAlTecnico() throws Exception {
        Aula registrada = new Aula(
                2L,
                "A-102",
                "Pabellon A - Segundo piso",
                35,
                "Disponible"
        );

        when(aulaService.registrarAula(any(Aula.class)))
                .thenReturn(registrada);

        mockMvc.perform(post("/api/aulas")
                        .with(SecurityMockMvcRequestPostProcessors.user("tecnico")
                                .roles("TECNICO"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "codigo": "A-102",
                                    "ubicacion": "Pabellon A - Segundo piso",
                                    "capacidad": 35,
                                    "estado": "Disponible"
                                }
                                """))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(2))
                .andExpect(jsonPath("$.codigo").value("A-102"));
    }

    @Test
    void debeRechazarRegistroAlAlumno() throws Exception {
        mockMvc.perform(post("/api/aulas")
                        .with(SecurityMockMvcRequestPostProcessors.user("alumno")
                                .roles("ALUMNO"))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("""
                                {
                                    "codigo": "A-103",
                                    "ubicacion": "Pabellon B - Primer piso",
                                    "capacidad": 30,
                                    "estado": "Disponible"
                                }
                                """))
                .andExpect(status().isForbidden());
    }
}
