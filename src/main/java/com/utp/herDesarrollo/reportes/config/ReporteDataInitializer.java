package com.utp.herDesarrollo.reportes.config;

import com.utp.herDesarrollo.aulas.model.Aula;
import com.utp.herDesarrollo.aulas.repository.AulaRepository;
import com.utp.herDesarrollo.reportes.domain.model.EstadoReporte;
import com.utp.herDesarrollo.reportes.domain.model.Prioridad;
import com.utp.herDesarrollo.reportes.domain.model.Reporte;
import com.utp.herDesarrollo.reportes.domain.model.TipoProblema;
import com.utp.herDesarrollo.reportes.domain.repository.ReporteRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.autoconfigure.condition.ConditionalOnProperty;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

/**
 * Sincronizador y auditor de integridad referencial para PostgreSQL (ClassCare Campus).
 * 1. Sanea esquemas heredados, registros huérfanos (aula_id inexistentes) y valores de enums inválidos.
 * 2. Garantiza la restricción FOREIGN KEY (fk_reportes_aula) entre reportes y aulas.
 * 3. Sincroniza el catálogo de aulas y los 6 reportes institucionales base.
 */
@Component
@ConditionalOnProperty(name = "app.seed.enabled", havingValue = "true", matchIfMissing = true)
public class ReporteDataInitializer implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(ReporteDataInitializer.class);

    private final AulaRepository aulaRepository;
    private final ReporteRepository reporteRepository;
    private final JdbcTemplate jdbcTemplate;

    public ReporteDataInitializer(
            AulaRepository aulaRepository,
            ReporteRepository reporteRepository,
            JdbcTemplate jdbcTemplate) {
        this.aulaRepository = aulaRepository;
        this.reporteRepository = reporteRepository;
        this.jdbcTemplate = jdbcTemplate;
    }

    @Override
    @Transactional
    public void run(String... args) {
        sanearEsquemaYDatosLegacy();

        Aula a101 = asegurarAula("A-101", "Pabellón A • Piso 1", 40, "Mantenimiento");
        Aula lab302 = asegurarAula("LAB-302", "Pabellón C • Piso 3", 30, "Mantenimiento");
        Aula b204 = asegurarAula("B-204", "Pabellón B • Piso 2", 45, "Disponible");
        Aula a305 = asegurarAula("A-305", "Pabellón A • Piso 3", 40, "Mantenimiento");
        Aula lab104 = asegurarAula("LAB-104", "Pabellón C • Piso 1", 30, "Disponible");
        Aula d401 = asegurarAula("D-401", "Pabellón D • Piso 4", 50, "Disponible");
        Aula c201 = asegurarAula("C-201", "Pabellón C • Piso 2", 35, "Disponible");

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

        sincronizarEstadoRealAulas(List.of(a101, lab302, b204, a305, lab104, d401, c201));
        log.info("PostgreSQL ClassCare Campus: Integridad referencial y catálogo de reportes verificados correctamente.");
    }

    /**
     * Limpia registros huérfanos en la tabla reportes cuyo aula_id apunta a un aula eliminada,
     * elimina filas con valores de enums obsoletos y asegura la llave foránea física en PostgreSQL.
     */
    private void sanearEsquemaYDatosLegacy() {
        try {
            // 1. Verificar si la columna aula_id quedó con tipo VARCHAR de versiones anteriores
            List<String> tiposColumna = jdbcTemplate.queryForList(
                    "SELECT data_type FROM information_schema.columns WHERE LOWER(table_name) = 'reportes' AND LOWER(column_name) = 'aula_id'",
                    String.class
            );
            if (!tiposColumna.isEmpty()) {
                String dataType = tiposColumna.getFirst().toLowerCase();
                if (dataType.contains("char") || dataType.contains("text")) {
                    log.warn("Migrando columna legacy reportes.aula_id de {} a BIGINT...", dataType);
                    jdbcTemplate.execute("DELETE FROM reportes");
                    jdbcTemplate.execute("ALTER TABLE reportes ALTER COLUMN aula_id TYPE BIGINT USING aula_id::bigint");
                }
            }

            // 2. Eliminar reportes huérfanos cuyo aula_id no existe en la tabla aulas
            int huerfanosEliminados = jdbcTemplate.update(
                    "DELETE FROM reportes WHERE aula_id IS NULL OR aula_id NOT IN (SELECT id FROM aulas)"
            );
            if (huerfanosEliminados > 0) {
                log.warn("Saneamiento PostgreSQL: se eliminaron {} reportes huérfanos con aula_id inexistente.", huerfanosEliminados);
            }

            // 3. Eliminar registros con valores de enums corruptos o fuera de catálogo
            int enumsCorruptos = jdbcTemplate.update(
                    "DELETE FROM reportes WHERE " +
                    "tipo_problema NOT IN ('MOBILIARIO', 'INFRAESTRUCTURA', 'TECNOLOGICO', 'ELECTRICO', 'OTRO') OR " +
                    "prioridad NOT IN ('ALTA', 'MEDIA', 'BAJA') OR " +
                    "estado NOT IN ('PENDIENTE', 'EN_ATENCION', 'RESUELTO')"
            );
            if (enumsCorruptos > 0) {
                log.warn("Saneamiento PostgreSQL: se eliminaron {} reportes con valores de enum no válidos.", enumsCorruptos);
            }

            // 4. Asegurar la restricción de llave foránea física fk_reportes_aula en PostgreSQL
            Integer fkCount = jdbcTemplate.queryForObject(
                    "SELECT COUNT(*) FROM information_schema.table_constraints " +
                    "WHERE LOWER(table_name) = 'reportes' AND constraint_type = 'FOREIGN KEY'",
                    Integer.class
            );
            if (fkCount != null && fkCount == 0) {
                jdbcTemplate.execute(
                        "ALTER TABLE reportes ADD CONSTRAINT fk_reportes_aula " +
                        "FOREIGN KEY (aula_id) REFERENCES aulas(id) ON UPDATE CASCADE"
                );
                log.info("Saneamiento PostgreSQL: restricción FOREIGN KEY fk_reportes_aula aplicada exitosamente.");
            }
        } catch (Exception ex) {
            log.warn("Aviso durante verificación inicial de tabla reportes: {}", ex.getMessage());
        }
    }

    private Aula asegurarAula(String codigo, String ubicacion, int capacidad, String estadoInicial) {
        return aulaRepository.findByCodigoIgnoreCase(codigo)
                .map(existente -> {
                    boolean modificado = false;
                    if (existente.getUbicacion() == null
                            || existente.getUbicacion().isBlank()
                            || !existente.getUbicacion().contains("•")) {
                        existente.setUbicacion(ubicacion);
                        modificado = true;
                    }
                    if (existente.getCapacidad() <= 0) {
                        existente.setCapacidad(capacidad);
                        modificado = true;
                    }
                    if (existente.getEstado() == null || existente.getEstado().isBlank()) {
                        existente.setEstado(estadoInicial);
                        modificado = true;
                    }
                    return modificado ? aulaRepository.save(existente) : existente;
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

    private void sincronizarEstadoRealAulas(List<Aula> aulas) {
        List<Reporte> todos = reporteRepository.findAll();
        for (Aula aula : aulas) {
            if (aula.getId() == null) {
                continue;
            }
            boolean requiereMantenimiento = todos.stream()
                    .filter(r -> r.getAula() != null && aula.getId().equals(r.getAula().getId()))
                    .filter(r -> r.getEstado() != EstadoReporte.RESUELTO)
                    .anyMatch(r -> r.getEstado() == EstadoReporte.EN_ATENCION || r.getPrioridad() == Prioridad.ALTA);

            String estadoEsperado = requiereMantenimiento ? "Mantenimiento" : "Disponible";
            if (!estadoEsperado.equalsIgnoreCase(aula.getEstado())) {
                aula.setEstado(estadoEsperado);
                aulaRepository.save(aula);
            }
        }
    }
}
