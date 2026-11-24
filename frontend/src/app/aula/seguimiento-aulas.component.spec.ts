import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';
import { Atencion } from '../models/atencion.model';
import { Reporte } from '../models/reporte.model';
import { AtencionService } from '../services/atencion.service';
import { ReporteService } from '../services/reporte.service';
import { Aula } from './aula.model';
import { AulaService } from './aula.service';
import { SeguimientoAulasComponent } from './seguimiento-aulas.component';

describe('SeguimientoAulasComponent', () => {
  let fixture: ComponentFixture<SeguimientoAulasComponent>;
  let aulasState: ReturnType<typeof signal<Aula[]>>;
  let reportesState: ReturnType<typeof signal<Reporte[]>>;
  let atencionesState: ReturnType<typeof signal<Atencion[]>>;
  let origenAulas: ReturnType<typeof signal<'API' | 'LOCAL'>>;
  let llamadasListarAulas: number;

  beforeEach(async () => {
    llamadasListarAulas = 0;
    aulasState = signal([
      { id: 1, codigo: 'A-101', ubicacion: 'Pabellón A · Piso 1', capacidad: 36, estado: 'Disponible' },
      { id: 2, codigo: 'A-102', ubicacion: 'Pabellón A · Piso 1', capacidad: 42, estado: 'Ocupada' },
      { id: 3, codigo: 'A-103', ubicacion: 'Pabellón A · Piso 2', capacidad: 30, estado: 'Disponible' },
      { id: 4, codigo: 'A-104', ubicacion: 'Pabellón A · Piso 2', capacidad: 40, estado: 'Disponible' },
      { id: 5, codigo: 'B-201', ubicacion: 'Pabellón B · Piso 2', capacidad: 32, estado: 'Mantenimiento' }
    ]);
    reportesState = signal([
      crearReporte(3, 'A-103', 'PENDIENTE', 'El proyector no funciona.'),
      crearReporte(4, 'A-104', 'RESUELTO', 'La conexión Wi-Fi estaba inestable.')
    ]);
    atencionesState = signal([
      {
        id: 10,
        reporteId: 4,
        tecnicoEncargado: 'María Torres',
        estado: 'RESUELTO',
        observaciones: 'Se reconfiguró el punto de acceso. [Solución: Se restableció la cobertura Wi-Fi.]',
        fechaRegistro: '2026-11-18T13:05:00',
        fechaResolucion: '2026-11-18T14:20:00'
      }
    ]);
    origenAulas = signal<'API' | 'LOCAL'>('API');

    await TestBed.configureTestingModule({
      imports: [SeguimientoAulasComponent],
      providers: [
        provideRouter([]),
        {
          provide: AulaService,
          useValue: {
            aulas: aulasState.asReadonly(),
            cargando: signal(false),
            error: signal(null),
            origenDatos: origenAulas,
            listar: async () => {
              llamadasListarAulas++;
              return aulasState();
            }
          }
        },
        {
          provide: ReporteService,
          useValue: {
            reportes: reportesState.asReadonly(),
            cargando: signal(false),
            backendConectado: signal(true),
            cargarReportes: () => undefined
          }
        },
        {
          provide: AtencionService,
          useValue: {
            atenciones: atencionesState.asReadonly(),
            cargando: signal(false),
            error: signal(null),
            origenDatos: signal('API'),
            cargarAtenciones: () => of(atencionesState())
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(SeguimientoAulasComponent);
    fixture.detectChanges();
  });

  it('loads the shared aula catalog when the page opens', () => {
    expect(llamadasListarAulas).toBe(1);
  });

  it('combines text, room-state, availability, and incident filters', () => {
    const component = fixture.componentInstance;
    component.busqueda.set('pabellón a');
    component.estadoSeleccionado.set('Disponible');
    component.disponibilidadSeleccionada.set('disponible');
    component.incidenciaSeleccionada.set('Pendiente');

    expect(component.aulasFiltradas().map(aula => aula.codigo)).toEqual(['A-103']);
  });

  it('combines report and attention data in the details panel', () => {
    const component = fixture.componentInstance;
    component.busqueda.set('A-104');
    component.abrirDetalles(component.aulas()[3]);
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.details-drawer')).not.toBeNull();
    expect(fixture.nativeElement.textContent).toContain('La conexión Wi-Fi estaba inestable.');
    expect(fixture.nativeElement.textContent).toContain('María Torres');
    expect(fixture.nativeElement.textContent).toContain('Se restableció la cobertura Wi-Fi.');

    component.cerrarDetalles();
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelector('.details-drawer')).toBeNull();
    expect(component.busqueda()).toBe('A-104');
    expect(component.aulasFiltradas().map(aula => aula.codigo)).toEqual(['A-104']);
  });

  it('reflects updates emitted by the shared aula and reporte services', () => {
    const component = fixture.componentInstance;
    expect(component.estadoAtencion(component.aulas()[2])).toBe('Pendiente');

    aulasState.update(aulas =>
      aulas.map(aula => aula.codigo === 'A-103' ? { ...aula, estado: 'Ocupada' } : aula)
    );
    reportesState.update(reportes =>
      reportes.map(reporte => reporte.aulaId === 'A-103' ? { ...reporte, estado: 'RESUELTO' } : reporte)
    );

    expect(component.aulasOcupadas()).toBe(2);
    expect(component.estadoAtencion(component.aulas()[2])).toBe('Solucionada');
  });

  it('updates an incident when its attention changes from pending to in progress', () => {
    const component = fixture.componentInstance;
    const aula = component.aulas().find(item => item.codigo === 'A-103')!;
    expect(aula.incidencias[0].estado).toBe('Pendiente');

    atencionesState.update(atenciones => [
      ...atenciones,
      {
        id: 11,
        reporteId: 3,
        tecnicoEncargado: 'Carlos Ruiz',
        estado: 'EN_ATENCION',
        fechaRegistro: '2026-11-22T10:00:00'
      }
    ]);

    expect(component.aulas().find(item => item.codigo === 'A-103')!.incidencias[0].estado)
      .toBe('En atención');
    expect(component.aulasConIncidenciasAbiertas()).toBe(1);
  });

  it('keeps individual statuses for multiple incidents in one aula', () => {
    reportesState.update(reportes => [
      ...reportes,
      crearReporte(5, 'A-103', 'RESUELTO', 'La lámpara no enciende.')
    ]);

    const aula = fixture.componentInstance.aulas().find(item => item.codigo === 'A-103')!;

    expect(aula.incidencias.map(incidencia => incidencia.estado).sort())
      .toEqual(['Pendiente', 'Solucionada']);
    expect(fixture.componentInstance.estadoAtencion(aula)).toBe('Pendiente');
  });

  it('refreshes the open details panel when shared data changes', () => {
    const component = fixture.componentInstance;
    component.abrirDetalles(component.aulas().find(aula => aula.codigo === 'A-104')!);
    fixture.detectChanges();

    aulasState.update(aulas =>
      aulas.map(aula => aula.codigo === 'A-104'
        ? { ...aula, ubicacion: 'Pabellón C · Piso 3' }
        : aula)
    );
    reportesState.update(reportes =>
      reportes.map(reporte => reporte.id === 4
        ? { ...reporte, descripcion: 'Descripción actualizada.' }
        : reporte)
    );
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent).toContain('Pabellón C · Piso 3');
    expect(fixture.nativeElement.textContent).toContain('Descripción actualizada.');
  });

  it('does not present general observations as a specific solution', () => {
    atencionesState.update(atenciones =>
      atenciones.map(atencion => ({
        ...atencion,
        observaciones: 'Se revisó el punto de acceso.'
      }))
    );
    const component = fixture.componentInstance;
    component.abrirDetalles(component.aulas().find(aula => aula.codigo === 'A-104')!);
    fixture.detectChanges();

    expect(fixture.nativeElement.textContent)
      .toContain('No se registró una descripción específica de la solución');
    expect(fixture.nativeElement.textContent).not.toContain('Se revisó el punto de acceso.');
  });

  it('shows an empty state when combined filters have no matches', () => {
    const component = fixture.componentInstance;
    component.estadoSeleccionado.set('Ocupada');
    component.incidenciaSeleccionada.set('Pendiente');
    fixture.detectChanges();

    expect(component.aulasFiltradas()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No se encontraron aulas');
  });

  it('marks the view as not synchronized when a service is using local data', () => {
    origenAulas.set('LOCAL');

    expect(fixture.componentInstance.sincronizado()).toBe(false);
    expect(fixture.componentInstance.estadoSincronizacion()).toContain('sin sincronización');
  });
});

function crearReporte(
  id: number,
  aulaId: string,
  estado: Reporte['estado'],
  descripcion: string
): Reporte {
  return {
    id,
    aulaId,
    tipoProblema: 'TECNOLOGICO',
    prioridad: 'MEDIA',
    estado,
    descripcion,
    fechaRegistro: '2026-11-22T09:15:00'
  };
}
