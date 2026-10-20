import { Routes } from '@angular/router';
import { ReporteListComponent } from './components/reporte-list/reporte-list.component';

export const routes: Routes = [
  { path: '', component: ReporteListComponent },
  { path: 'reportes', component: ReporteListComponent },
  { path: '**', redirectTo: '' }
];
