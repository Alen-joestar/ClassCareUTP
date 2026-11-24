import { Routes } from '@angular/router';
import { AtencionListComponent } from './components/atencion-list/atencion-list.component';
import { AulaComponent } from './aula/aula.component';
import { LoginComponent } from './components/login/login.component';
import { ReporteDetailComponent } from './components/reporte-detail/reporte-detail.component';
import { ReporteFormComponent } from './components/reporte-form/reporte-form.component';
import { ReporteListComponent } from './components/reporte-list/reporte-list.component';

export const routes: Routes = [
  { path: '', redirectTo: 'reportes', pathMatch: 'full' },
  { path: 'login', component: LoginComponent },
  { path: 'reportes', component: ReporteListComponent },
  { path: 'reportes/nuevo', component: ReporteFormComponent },
  { path: 'reportes/:id/editar', component: ReporteFormComponent },
  { path: 'reportes/:id', component: ReporteDetailComponent },
  { path: 'atenciones', component: AtencionListComponent },
  { path: 'aulas', component: AulaComponent },
  { path: '**', redirectTo: 'reportes' }
];
