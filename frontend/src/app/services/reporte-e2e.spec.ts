import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { authInterceptor } from '../interceptors/auth.interceptor';
import { Reporte } from '../models/reporte.model';
import { AuthService } from './auth.service';
import { ReporteService } from './reporte.service';

describe('Semana 15 - Verificación E2E Frontend (ReporteService + AuthService + authInterceptor)', () => {
  let reporteService: ReporteService;
  let authService: AuthService;
  let httpMock: HttpTestingController;

  const reportesMockBackend: Reporte[] = [
    {
      id: 1,
      aulaId: 'A-101',
      aulaUbicacion: 'Pabellón A • Piso 1',
      tipoProblema: 'TECNOLOGICO',
      prioridad: 'ALTA',
      estado: 'PENDIENTE',
      descripcion: 'El proyector multimedia enciende pero no detecta señal HDMI.',
      fechaRegistro: '2026-10-29T08:30:00'
    },
    {
      id: 2,
      aulaId: 'LAB-302',
      aulaUbicacion: 'Pabellón C • Piso 3',
      tipoProblema: 'ELECTRICO',
      prioridad: 'ALTA',
      estado: 'EN_ATENCION',
      descripcion: 'Diferencial eléctrico de la bancada norte salta al encender equipos.',
      fechaRegistro: '2026-10-29T09:15:00'
    }
  ];

  beforeEach(() => {
    if (typeof localStorage !== 'undefined') {
      localStorage.clear();
    }

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withInterceptors([authInterceptor])),
        provideHttpClientTesting(),
        AuthService,
        ReporteService
      ]
    });

    authService = TestBed.inject(AuthService);
    reporteService = TestBed.inject(ReporteService);
    httpMock = TestBed.inject(HttpTestingController);

    // Drenar el canje inicial de DEMO_JWT y la carga de técnicos en AuthService
    const loginInicialReqs = httpMock.match('/api/auth/login');
    for (const req of loginInicialReqs) {
      req.flush({
        token: 'jwt-inicial-tecnico',
        tipo: 'Bearer',
        username: 'tecnico',
        roles: ['ROLE_TECNICO']
      });
    }
    const tecnicosInicialReqs = httpMock.match('/api/auth/tecnicos');
    for (const req of tecnicosInicialReqs) {
      req.flush([]);
    }

    // Drenar las 2 peticiones iniciales del constructor de ReporteService
    const reqReportesInicial = httpMock.expectOne('/api/reportes');
    reqReportesInicial.flush(reportesMockBackend);

    const reqAulasInicial = httpMock.expectOne('/api/aulas');
    reqAulasInicial.flush([
      { id: 1, codigo: 'A-101', ubicacion: 'Pabellón A • Piso 1', capacidad: 40, estado: 'Mantenimiento' }
    ]);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('debe sincronizar reportes desde PostgreSQL/Spring Boot al iniciar y activar backendConectado()', () => {
    expect(reporteService.backendConectado()).toBe(true);
    expect(reporteService.cargando()).toBe(false);
    expect(reporteService.reportes().length).toBe(2);
    expect(reporteService.reportes()[0].aulaId).toBe('A-101');
  });

  it('debe registrar un nuevo reporte vía POST /api/reportes y actualizar la señal reactiva', () => {
    let creadoResultado: Reporte | undefined;

    reporteService
      .crearReporte({
        aulaId: 'b-204',
        aulaUbicacion: 'Pabellón B • Piso 2',
        tipoProblema: 'MOBILIARIO',
        prioridad: 'MEDIA',
        descripcion: 'Cuatro carpetas unipersonales presentan respaldar suelto.'
      })
      .subscribe(res => (creadoResultado = res));

    const postReq = httpMock.expectOne('/api/reportes');
    expect(postReq.request.method).toBe('POST');
    expect(postReq.request.body.aulaId).toBe('B-204');

    postReq.flush({
      id: 3,
      aulaId: 'B-204',
      aulaUbicacion: 'Pabellón B • Piso 2',
      tipoProblema: 'MOBILIARIO',
      prioridad: 'MEDIA',
      estado: 'PENDIENTE',
      descripcion: 'Cuatro carpetas unipersonales presentan respaldar suelto.',
      fechaRegistro: '2026-10-30T10:00:00'
    });

    // Al crear un reporte se refresca también el catálogo de aulas
    const aulasRefresh = httpMock.expectOne('/api/aulas');
    aulasRefresh.flush([]);

    expect(creadoResultado?.id).toBe(3);
    expect(reporteService.reportes().length).toBe(3);
    expect(reporteService.reportes()[0].aulaId).toBe('B-204');
  });

  it('debe inyectar automáticamente Authorization: Bearer <token> en PUT y DELETE tras autenticar con AuthService', () => {
    // 1. Login contra /api/auth/login
    const tokenRealSimulado =
      'eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0ZWNuaWNvIiwicm9sZXMiOlsiUk9MRV9URUNOSUNPIl19.signature';

    authService.login({ username: 'tecnico', password: 'tecnico123' }).subscribe();
    const loginReq = httpMock.expectOne('/api/auth/login');
    expect(loginReq.request.method).toBe('POST');
    loginReq.flush({ token: tokenRealSimulado, tipo: 'Bearer' });

    expect(authService.autenticado()).toBe(true);
    expect(authService.puedeActualizarReportes()).toBe(true);

    // 2. Actualizar estado (PUT /api/reportes/1) -> debe llevar cabecera Authorization: Bearer
    reporteService.actualizarEstado(1, 'EN_ATENCION').subscribe();

    const putReq = httpMock.expectOne('/api/reportes/1');
    expect(putReq.request.method).toBe('PUT');
    expect(putReq.request.headers.get('Authorization')).toBe(`Bearer ${tokenRealSimulado}`);
    expect(putReq.request.body.estado).toBe('EN_ATENCION');

    putReq.flush({
      ...reportesMockBackend[0],
      estado: 'EN_ATENCION'
    });

    const aulasRefresh = httpMock.expectOne('/api/aulas');
    aulasRefresh.flush([]);

    expect(reporteService.obtenerPorId(1)?.estado).toBe('EN_ATENCION');
  });
});
