import { Routes } from '@angular/router';
import { ReporteDetailComponent } from './components/reporte-detail/reporte-detail.component';
import { ReporteFormComponent } from './components/reporte-form/reporte-form.component';
import { ReporteListComponent } from './components/reporte-list/reporte-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'reportes', pathMatch: 'full' },
  { path: 'reportes', component: ReporteListComponent },
  { path: 'reportes/nuevo', component: ReporteFormComponent },
  { path: 'reportes/:id/editar', component: ReporteFormComponent },
  { path: 'reportes/:id', component: ReporteDetailComponent },
  { path: '**', redirectTo: 'reportes' }
];
