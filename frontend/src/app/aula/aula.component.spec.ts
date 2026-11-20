import { signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthService } from '../services/auth.service';
import { Aula } from './aula.model';
import { AulaService } from './aula.service';
import { AulaComponent } from './aula.component';

describe('AulaComponent pagination', () => {
  let fixture: ComponentFixture<AulaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AulaComponent],
      providers: [
        {
          provide: AulaService,
          useValue: {
            listar: async () => [],
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
});

function crearAulas(cantidad: number): Aula[] {
  return Array.from({ length: cantidad }, (_, indice) => ({
    id: indice + 1,
    codigo: `A-${101 + indice}`,
    ubicacion: `Pabellón A, piso ${Math.floor(indice / 4) + 1}`,
    capacidad: 30,
    estado: 'Disponible'
  }));
}
