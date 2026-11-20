# ClassCare Campus — Plataforma de Gestión de Mantenimiento de Aulas (UTP)

Plataforma web **Full-Stack** desarrollada con **Spring Boot** y **Angular** para centralizar, gestionar y dar seguimiento en tiempo real a las incidencias operativas, de equipamiento y de infraestructura en las aulas y laboratorios universitarios.

La solución integra persistencia relacional en **PostgreSQL**, autenticación y control de acceso basado en roles (**RBAC**) mediante **JWT (JSON Web Tokens)**, y una interfaz reactiva construida con **Angular 22** bajo el sistema de diseño **Material Design 3 (Identidad Marino Institucional + Modo Nocturno)**.

---

## Estructura del Monorepo

El repositorio está organizado en dos directorios principales que conservan la trazabilidad completa del historial de Git:

```text
ClassCareUTP/
├── backend/                  # API REST con Spring Boot, JPA/PostgreSQL, JWT y suites de pruebas
│   ├── src/main/java/        # Código fuente modular (reportes, aulas, atenciones, security, config)
│   ├── src/main/resources/   # Configuración (application.properties) y vistas estáticas legacy
│   ├── src/test/             # Pruebas unitarias, de integración JPA/Security y End-to-End (E2E)
│   ├── build.gradle          # Dependencias y configuración de compilación Gradle
│   └── gradlew / gradlew.bat # Gradle Wrapper
└── frontend/                 # Aplicación SPA con Angular 22 y Angular Material 3
    ├── src/app/
    │   ├── components/       # Módulos visuales (reporte-list, reporte-detail, reporte-form, atencion-list)
    │   ├── aula/             # Componente, modelo y servicio del módulo de Aulas
    │   ├── interceptors/     # Interceptor funcional HTTP para inyección automática de Bearer JWT
    │   ├── models/           # Contratos TypeScript (Reporte, Atencion, Auth)
    │   └── services/         # Servicios reactivos con Signals y HttpClient (ReporteService, AuthService, AtencionService)
    ├── proxy.conf.json       # Proxy de desarrollo (/api -> http://localhost:8080)
    └── package.json          # Dependencias de Angular 22, Material 3 y Vitest
```

---

## Módulos Integrados del Sistema

### 1. Módulo de Reportes (`/reportes`)
* **Ciclo CRUD Completo con PostgreSQL:** Listado con búsqueda en vivo y menú unificado de filtros (categoría, prioridad y ordenamiento), vista de detalle técnico (`/reportes/:id`), creación (`/reportes/nuevo`), edición (`/reportes/:id/editar`) y eliminación protegida por rol `ADMIN`.
* **Formulario Reactivo y Validaciones Avanzadas:** Validación en tiempo real de formato de código de aula (`B-304`, `LAB-402`), coherencia automática de pabellón/piso, diagnóstico técnico mínimo, detección temprana de reportes duplicados activos y vista previa en vivo estilo *Folder-Tab*.
* **Máquina de Estados Progresiva y Reglas de Negocio:** Transición controlada (`REPORTADO` $\rightarrow$ `EN_ATENCION` $\rightarrow$ `RESUELTO`) que actualiza automáticamente la disponibilidad del aula vinculada a *"En mantenimiento"* cuando inicia la atención y la libera a *"Disponible"* cuando se resuelven sus incidencias activas.

### 2. Módulo de Aulas (`/aulas` y `/aulas/index.html`)
* **Catálogo e Inventario de Infraestructura:** Gestión de aulas y laboratorios con código único, ubicación (pabellón y piso), capacidad y estado operativo (*Disponible*, *En mantenimiento*, *Fuera de servicio*).
* **Integridad Referencial JPA:** Relación `@ManyToOne` entre `Reporte` y `Aula` con consultas optimizadas (`JOIN FETCH`) y validación cruzada que impide eliminar aulas con historial comprometido o registrar incidencias en aulas inexistentes.

### 3. Módulo de Atenciones (`/atenciones` y `/atenciones/index.html`)
* **Bandeja de Triaje y Seguimiento Técnico:** Panel con indicadores clave (KPIs), línea de tiempo (*stepper*) del progreso de atención, apertura de órdenes de trabajo y modal de resolución técnica.
* **Trazabilidad de Soporte:** Registro del técnico encargado, observaciones de diagnóstico, acciones correctivas aplicadas y sincronización reactiva con el backend mediante `HttpClient` y seguridad JWT.

---

## Seguridad y Autenticación JWT (RBAC)

El sistema implementa una arquitectura de seguridad *stateless* con **Spring Security 7** y **JJWT (`0.12.6`)**:

* **Consultas y Registro Inicial (`GET` / `POST`):** Acceso público para permitir que docentes y alumnos consulten el estado de las aulas y reporten incidencias.
* **Actualización y Gestión Técnica (`PUT /api/reportes/**`, `POST/PUT/DELETE /api/aulas/**`, `PUT /api/atenciones/**`):** Restringido mediante token JWT a los roles `ROLE_TECNICO` y `ROLE_ADMIN`.
* **Eliminación de Reportes (`DELETE /api/reportes/**`):** Restringido exclusivamente al rol `ROLE_ADMIN`.

### Credenciales de Prueba (`/api/auth/login` y Panel JWT en Navbar)

| Usuario | Contraseña | Rol Asignado | Permisos Principales |
| :--- | :--- | :--- | :--- |
| `tecnico` | `tecnico123` | `ROLE_TECNICO` | Actualizar estados, editar reportes abiertos, gestionar aulas y atenciones |
| `admin` | `admin123` | `ROLE_ADMIN` | Control total del sistema, edición irrestricta y eliminación de reportes (`DELETE`) |
| `alumno` | `alumno123` | `ROLE_ALUMNO` | Consulta de catálogo y registro de nuevos reportes |

---

## Tecnologías Utilizadas

* **Backend:**
  * **Java 25** y **Spring Boot 4.1.x** (Spring Web MVC, Spring Data JPA, Spring Security, Bean Validation)
  * **Base de Datos:** PostgreSQL (producción/desarrollo) y H2 Database en memoria (pruebas automatizadas)
  * **Autenticación:** JSON Web Tokens (`io.jsonwebtoken:jjwt 0.12.6`)
  * **Testing Backend:** JUnit 5, Mockito, Spring `MockMvc`, Spring Security Test
  * **Construcción:** Gradle Wrapper (`9.x`)
* **Frontend:**
  * **Angular 22** (Standalone Components, Signals, Reactive Forms, HttpClient con interceptores funcionales)
  * **Diseño UI/UX:** Angular Material 3 (`@use '@angular/material' as mat`), tarjetas *Folder-Tab*, tipografías *Chakra Petch* + *Inter* y soporte nativo de **Modo Día / Modo Nocturno**
  * **Testing Frontend:** Vitest + Angular `HttpTestingController`

---

## Guía de Instalación y Ejecución

### Prerrequisitos
* **JDK 25** instalado y configurado en `JAVA_HOME`.
* **PostgreSQL** activo en `localhost:5432` con una base de datos llamada `classcare_db` (credenciales por defecto en `backend/src/main/resources/application.properties`: usuario `postgres`, contraseña `postgres`).
* **Node.js** (v22+) y **npm** instalados.

### 1. Clonar el repositorio
```bash
git clone https://github.com/Alen-joestar/ClassCareUTP.git
cd ClassCareUTP
```

### 2. Ejecutar y probar el Backend (Spring Boot)
Abre una terminal y entra a la carpeta `backend`:

```powershell
cd backend

# Ejecutar todas las suites de pruebas (Unitarias, Integración JPA/JWT y E2E)
.\gradlew.bat test

# Iniciar el servidor Spring Boot en http://localhost:8080
.\gradlew.bat bootRun
```
*(En Linux / macOS utiliza `./gradlew test` y `./gradlew bootRun`). Al arrancar por primera vez conectado a PostgreSQL, `ReporteDataInitializer` sembrará automáticamente las aulas y reportes iniciales.*

### 3. Ejecutar y probar el Frontend (Angular)
Abre una segunda terminal y entra a la carpeta `frontend`:

```powershell
cd frontend

# Instalar dependencias
npm.cmd install

# Ejecutar pruebas unitarias y E2E del frontend
npm.cmd test -- --watch=false

# Iniciar el servidor de desarrollo con proxy hacia el backend
npm.cmd start
```

---

## Enlaces de Acceso Local

* **Aplicación Principal Angular (SPA - Puerto 4200):**
  * **Módulo de Reportes:** [http://localhost:4200/reportes](http://localhost:4200/reportes)
  * **Nuevo Reporte:** [http://localhost:4200/reportes/nuevo](http://localhost:4200/reportes/nuevo)
  * **Módulo de Aulas (SPA):** [http://localhost:4200/aulas](http://localhost:4200/aulas)
  * **Módulo de Atenciones (SPA):** [http://localhost:4200/atenciones](http://localhost:4200/atenciones)
* **Backend API REST y Vistas Estáticas (Puerto 8080):**
  * **API de Reportes:** [http://localhost:8080/api/reportes](http://localhost:8080/api/reportes)
  * **API de Aulas:** [http://localhost:8080/api/aulas](http://localhost:8080/api/aulas)
  * **API de Atenciones:** [http://localhost:8080/api/atenciones](http://localhost:8080/api/atenciones)
  * **Vistas Estáticas Legacy:** [http://localhost:8080/index.html](http://localhost:8080/index.html) | [http://localhost:8080/aulas/index.html](http://localhost:8080/aulas/index.html) | [http://localhost:8080/atenciones/index.html](http://localhost:8080/atenciones/index.html)
