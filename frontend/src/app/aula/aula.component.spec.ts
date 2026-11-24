import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { Aula } from './aula.model';
import { AulaService } from './aula.service';
import { AulaComponent } from './aula.component';

describe('AulaComponent pagination', () => {
  let fixture: ComponentFixture<AulaComponent>;
  let registrosSolicitados: number;
  let aulasState: ReturnType<typeof signal<Aula[]>>;

  beforeEach(async () => {
    registrosSolicitados = 0;
    aulasState = signal<Aula[]>([]);
    await TestBed.configureTestingModule({
      imports: [AulaComponent],
      providers: [
        provideRouter([]),
        {
          provide: AulaService,
          useValue: {
            aulas: aulasState.asReadonly(),
            listar: async () => [],
            registrar: async () => {
              registrosSolicitados++;
            },
            mensajeError: () => 'Error'
          }
        },
        {
          provide: AuthService,
          useValue: {
            sesion: signal({ roles: ['ROLE_TECNICO'] }),
            logout: () => undefined,
            abrirPanel: () => undefined
          }
        }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(AulaComponent);
    fixture.detectChanges();
    await fixture.whenStable();
  });

  it('limits the catalog to six rooms and shows the remaining rooms on the next page', () => {
    aulasState.set(crearAulas(10));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.room-arch-card').length).toBe(6);
    expect(fixture.componentInstance.primerResultado()).toBe(1);
    expect(fixture.componentInstance.ultimoResultado()).toBe(6);

    fixture.componentInstance.irPagina(2);
    fixture.detectChanges();

    const tarjetas = fixture.nativeElement.querySelectorAll('.room-arch-card');
    expect(tarjetas.length).toBe(4);
    expect(tarjetas[0].querySelector('.room-door-plaque').textContent.trim()).toBe('A-107');
    expect(fixture.componentInstance.primerResultado()).toBe(7);
    expect(fixture.componentInstance.ultimoResultado()).toBe(10);
  });

  it('returns to the first page when a filter changes', () => {
    aulasState.set(crearAulas(10));
    fixture.componentInstance.irPagina(2);

    fixture.componentInstance.cambiarBusqueda('A-110');

    expect(fixture.componentInstance.paginaActual()).toBe(1);
    expect(fixture.componentInstance.aulasPaginadas().map(aula => aula.codigo)).toEqual(['A-110']);
  });

  it('matches both maintenance status labels in the catalog filter', () => {
    aulasState.set([
      { ...crearAulas(1)[0], estado: 'En mantenimiento' },
      { ...crearAulas(1)[0], id: 2, codigo: 'A-102', estado: 'Mantenimiento' }
    ]);

    fixture.componentInstance.cambiarEstado('Mantenimiento');

    expect(fixture.componentInstance.aulasFiltradas().map(aula => aula.codigo)).toEqual([
      'A-101',
      'A-102'
    ]);
  });

  it('rejects whitespace-only fields before sending the request', async () => {
    fixture.componentInstance.datosFormulario.codigo = '   ';

    await fixture.componentInstance.guardarAula();

    expect(fixture.componentInstance.errorFormulario).toBe(
      'Ingrese el código del aula; no puede contener solo espacios.'
    );
    expect(registrosSolicitados).toBe(0);
  });

  it('rejects fractional room capacity before sending the request', async () => {
    fixture.componentInstance.datosFormulario.codigo = 'A-110';
    fixture.componentInstance.datosFormulario.ubicacion = 'Pabellón A';
    fixture.componentInstance.datosFormulario.capacidad = 20.5;

    await fixture.componentInstance.guardarAula();

    expect(fixture.componentInstance.errorFormulario).toBe(
      'La capacidad debe ser un número entero entre 1 y 200.'
    );
    expect(registrosSolicitados).toBe(0);
  });

  it('reports invalid minimum-capacity filters instead of silently applying them', () => {
    aulasState.set(crearAulas(10));
    fixture.componentInstance.cambiarCapacidadMinima(20.5);

    expect(fixture.componentInstance.errorCapacidadMinima()).toBe(
      'La capacidad mínima debe ser un número entero igual o mayor que 0.'
    );
    expect(fixture.componentInstance.aulasFiltradas()).toHaveLength(10);
  });

  it('applies a valid numeric minimum-capacity filter', () => {
    aulasState.set(crearAulas(10));
    fixture.componentInstance.cambiarCapacidadMinima(28);

    expect(fixture.componentInstance.errorCapacidadMinima()).toBe('');
    expect(fixture.componentInstance.aulasFiltradas().map(aula => aula.capacidad)).toEqual([
      28, 29
    ]);
  });
});

function crearAulas(cantidad: number): Aula[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    id: indice + 1,
    codigo: `A-${101 + indice}`,
    ubicacion: `Pabellón A, piso ${Math.floor(indice / 4) + 1}`,
    capacidad: 20 + indice,
    estado: 'Disponible'
  }));
}
