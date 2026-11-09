import { Routes } from '@angular/router';
import { AulaComponent } from './aula/aula.component';
import { ReporteListComponent } from './components/reporte-list/reporte-list.component';
import { ReporteDetailComponent } from './components/reporte-detail/reporte-detail.component';

export const routes: Routes = [
  { path: '', redirectTo: 'reportes', pathMatch: 'full' },
  { path: 'reportes', component: ReporteListComponent },
  { path: 'reportes/:id', component: ReporteDetailComponent },
  { path: 'aulas', component: AulaComponent },
  { path: '**', redirectTo: 'reportes' }
];
