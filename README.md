# Plataforma de Gestión de Mantenimiento de Aulas Universitarias

Sistema web desarrollado con Spring Boot para centralizar, gestionar y dar seguimiento oportuno a las incidencias operativas y de infraestructura en las aulas de una institución universitaria.

La solución permite a los usuarios (docentes, estudiantes y personal administrativo) consultar aulas y registrar averías o desperfectos, facilitando al equipo de mantenimiento técnico la recepción, asignación y actualización del estado de cada solicitud.

---

## Módulos del Sistema

El sistema está diseñado bajo una arquitectura modular compuesta por tres componentes principales:

1. **Módulo de Aulas:**
   * Gestión y consulta del catálogo de aulas y laboratorios universitarios.
   * Registro de información clave: código del aula, ubicación (pabellón/piso), capacidad y estado de disponibilidad operativa.

2. **Módulo de Reportes:**
   * Registro y consulta de incidencias y fallas técnicas.
   * Captura estructurada de datos: código del aula afectada, categoría del problema (tecnológico, eléctrico, mobiliario, infraestructura u otro), descripción detallada y nivel de prioridad (alta, media, baja).

3. **Módulo de Atenciones:**
   * Trazabilidad y seguimiento del ciclo de vida de los reportes generados.
   * Gestión y transición de estados de atención: *Pendiente*, *En atención* y *Resuelto*.
   * Registro de acciones correctivas realizadas por el personal de soporte.

---

## Alcance del Primer Avance

Para este primer avance se implementó la base arquitectónica del sistema y la versión funcional completa del **Módulo de Reportes**, con las siguientes características:

* **Arquitectura de API REST:** Implementación de controladores REST (`@RestController`), capas de servicio de aplicación e inyección de dependencias (`@Service`, `@Repository`).
* **Desarrollo Guiado por Pruebas (TDD):** Cobertura exhaustiva de pruebas unitarias y de integración utilizando JUnit 5, Mockito y Spring `MockMvc` para validar peticiones HTTP (`GET`, `POST`, `PUT`), códigos de respuesta y manejo de excepciones.
* **Almacenamiento Concurrente en Memoria:** Manejo de datos desacoplado mediante interfaces de repositorio (`ReporteRepository`) e implementado con estructuras en memoria (`ConcurrentHashMap` y `AtomicLong`), dejando el diseño preparado para una transición directa a persistencia relacional con Spring Data JPA, Hibernate y PostgreSQL.
* **Manejo Centralizado de Excepciones:** Controlador global (`@RestControllerAdvice`) que estandariza las respuestas ante errores de validación (`400 Bad Request`), recursos inexistentes (`404 Not Found`) y errores de servidor.
* **Interfaz de Usuario Semántica:** Maquetación web preliminar con HTML5 semántico y accesible, acompañada de estilos CSS3 con enfoque *mobile-first*, Flexbox y CSS Grid.

---

## Tecnologías Utilizadas

* **Lenguaje:** Java 25
* **Framework:** Spring Boot 4.1.x (Spring Web MVC, Spring Boot Test)
* **Testing:** JUnit 5, Mockito, Spring MockMvc
* **Gestor de Construcción:** Gradle Wrapper
* **Frontend Estático:** HTML5 semántico, CSS3 moderno
* **Control de Versiones:** Git y GitHub

---

## Ejecución del Proyecto

### Prerrequisitos
* Java Development Kit (JDK) 25 instalado y configurado en el sistema.
* Git instalado.

### 1. Clonar el repositorio
```bash
git clone https://github.com/Alen-joestar/ClassCareUTP.git
cd ClassCareUTP
```

### 2. Ejecutar la suite de pruebas automatizadas
Para verificar que todas las pruebas unitarias y de integración se ejecuten correctamente:

* En Windows (PowerShell o CMD):
```powershell
.\gradlew.bat test
```

* En Linux / macOS:
```bash
./gradlew test
```

### 3. Iniciar el servidor local
```powershell
.\gradlew.bat bootRun
```

Una vez levantada la aplicación, los servicios estarán disponibles en:
* API REST: `http://localhost:8080/api/reportes`
* Interfaz Web: `http://localhost:8080/index.html`

---

## Plan de Trabajo para Próximos Hitos

1. **Migración a Base de Datos Relacional:**
   * Integración de PostgreSQL mediante Spring Data JPA e Hibernate.
   * Reemplazo de la implementación en memoria por persistencia gestionada, manteniendo intacto el contrato `ReporteRepository`.
2. **Implementación de los Módulos Restantes:**
   * Desarrollo del Módulo de Aulas (CRUD, validación de capacidad y ubicación).
   * Desarrollo del Módulo de Atenciones (asignación técnica y registro de intervenciones).
3. **Consumo Dinámico de la API en el Frontend:**
   * Integración asíncrona mediante JavaScript (Fetch API) para conectar el formulario y la vista de incidencias con los endpoints REST.
4. **Seguridad y Control de Acceso:**
   * Incorporación de autenticación y autorización por roles (usuarios y administradores/técnicos) con Spring Security.
