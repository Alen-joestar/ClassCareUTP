import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { Aula } from './aula.model';
import { AulaService } from './aula.service';
import { AulaComponent } from './aula.component';

describe('AulaComponent pagination', () => {
  let fixture: ComponentFixture<AulaComponent>;
  let registrosSolicitados: number;

  beforeEach(async () => {
    registrosSolicitados = 0;
    await TestBed.configureTestingModule({
      imports: [AulaComponent],
      providers: [
        {
          provide: AulaService,
          useValue: {
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
            sesion: signal(null),
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

  it('limits the catalog to eight rooms and shows the remaining rooms on the next page', () => {
    fixture.componentInstance.aulas.set(crearAulas(10));
    fixture.detectChanges();

    expect(fixture.nativeElement.querySelectorAll('.aula-card').length).toBe(8);
    expect(fixture.componentInstance.primerResultado()).toBe(1);
    expect(fixture.componentInstance.ultimoResultado()).toBe(8);

    fixture.componentInstance.irPagina(2);
    fixture.detectChanges();

    const tarjetas = fixture.nativeElement.querySelectorAll('.aula-card');
    expect(tarjetas.length).toBe(2);
    expect(tarjetas[0].querySelector('.room-code').textContent.trim()).toBe('A-109');
    expect(fixture.componentInstance.primerResultado()).toBe(9);
    expect(fixture.componentInstance.ultimoResultado()).toBe(10);
  });

  it('returns to the first page when a filter changes', () => {
    fixture.componentInstance.aulas.set(crearAulas(10));
    fixture.componentInstance.irPagina(2);

    fixture.componentInstance.cambiarBusqueda('A-110');

    expect(fixture.componentInstance.paginaActual()).toBe(1);
    expect(fixture.componentInstance.aulasPaginadas().map(aula => aula.codigo)).toEqual(['A-110']);
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
    fixture.componentInstance.aulas.set(crearAulas(10));
    fixture.componentInstance.cambiarCapacidadMinima(20.5);

    expect(fixture.componentInstance.errorCapacidadMinima()).toBe(
      'La capacidad mínima debe ser un número entero igual o mayor que 0.'
    );
    expect(fixture.componentInstance.aulasFiltradas()).toHaveLength(10);
  });

  it('applies a valid numeric minimum-capacity filter', () => {
    fixture.componentInstance.aulas.set(crearAulas(10));
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
