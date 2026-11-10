package com.utp.herDesarrollo.reportes.config;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.repository.AulaRepository;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Sincronizador de datos semilla institucionales para PostgreSQL (ClassCare Campus).
 * Garantiza que las aulas del campus y los 6 reportes base existan en la base de datos
 * al iniciar el servidor, sin ejecutarse durante las pruebas automatizadas (app.seed.enabled=false).
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class ReporteDataInitializer implements CommandLineRunner {

    private final AulaRepository aulaRepository;
    private final ReporteRepository reporteRepository;

    public ReporteDataInitializer(AulaRepository aulaRepository, ReporteRepository reporteRepository) {
        this.aulaRepository = aulaRepository;
        this.reporteRepository = reporteRepository;
    }

    @Override
    @Transactional
    public void run(String... args) {
        Aula a101 = asegurarAula("A-101", "Pabellón A • Piso 1", 40, "Mantenimiento");
        Aula lab302 = asegurarAula("LAB-302", "Pabellón C • Piso 3", 30, "Mantenimiento");
        Aula b204 = asegurarAula("B-204", "Pabellón B • Piso 2", 45, "Disponible");
        Aula a305 = asegurarAula("A-305", "Pabellón A • Piso 3", 40, "Mantenimiento");
        Aula lab104 = asegurarAula("LAB-104", "Pabellón C • Piso 1", 30, "Disponible");
        Aula d401 = asegurarAula("D-401", "Pabellón D • Piso 4", 50, "Disponible");
        asegurarAula("C-201", "Pabellón C • Piso 2", 35, "Disponible");

        asegurarReporte(
                a101,
                TipoProblema.TECNOLOGICO,
                Prioridad.ALTA,
                EstadoReporte.PENDIENTE,
                "El proyector multimedia enciende pero no detecta señal HDMI desde el escritorio del docente.",
                LocalDateTime.of(2026, 10, 29, 8, 30)
        );

        asegurarReporte(
                lab302,
                TipoProblema.ELECTRICO,
                Prioridad.ALTA,
                EstadoReporte.EN_ATENCION,
                "Diferencial eléctrico de la bancada norte salta al encender los equipos de cómputo del laboratorio.",
                LocalDateTime.of(2026, 10, 29, 9, 15)
        );

        asegurarReporte(
                b204,
                TipoProblema.MOBILIARIO,
                Prioridad.MEDIA,
                EstadoReporte.PENDIENTE,
                "Cuatro carpetas unipersonales presentan respaldar suelto cerca de la puerta posterior del salón.",
                LocalDateTime.of(2026, 10, 28, 14, 20)
        );

        asegurarReporte(
                a305,
                TipoProblema.INFRAESTRUCTURA,
                Prioridad.MEDIA,
                EstadoReporte.EN_ATENCION,
                "Equipo de aire acondicionado presenta goteo leve sobre la esquina delantera derecha.",
                LocalDateTime.of(2026, 10, 28, 16, 40)
        );

        asegurarReporte(
                lab104,
                TipoProblema.TECNOLOGICO,
                Prioridad.BAJA,
                EstadoReporte.RESUELTO,
                "Access Point Wi-Fi reiniciado y actualizado; cobertura restablecida al 100% en el laboratorio.",
                LocalDateTime.of(2026, 10, 27, 11, 15)
        );

        asegurarReporte(
                d401,
                TipoProblema.ELECTRICO,
                Prioridad.BAJA,
                EstadoReporte.RESUELTO,
                "Reemplazo de dos paneles LED sobre la pizarra acrílica completado sin observaciones.",
                LocalDateTime.of(2026, 10, 26, 10, 0)
        );
    }

    private Aula asegurarAula(String codigo, String ubicacion, int capacidad, String estadoInicial) {
        return aulaRepository.findByCodigoIgnoreCase(codigo)
                .map(existente -> {
                    if (existente.getUbicacion() == null || existente.getUbicacion().isBlank()) {
                        existente.setUbicacion(ubicacion);
                        return aulaRepository.save(existente);
                    }
                    return existente;
                })
                .orElseGet(() -> aulaRepository.save(new Aula(null, codigo, ubicacion, capacidad, estadoInicial)));
    }

    private void asegurarReporte(
            Aula aula,
            TipoProblema tipoProblema,
            Prioridad prioridad,
            EstadoReporte estado,
            String descripcion,
            LocalDateTime fechaRegistro) {
        List<Reporte> existentesEnAula = reporteRepository.findByAulaId(aula.getCodigo());
        boolean yaExiste = existentesEnAula.stream()
                .anyMatch(r -> r.getTipoProblema() == tipoProblema && r.getDescripcion().equalsIgnoreCase(descripcion));

        if (!yaExiste) {
            Reporte nuevo = new Reporte(aula, tipoProblema, descripcion, prioridad, estado, fechaRegistro);
            reporteRepository.save(nuevo);
        }
    }
}
