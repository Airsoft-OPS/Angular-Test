import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EventosComponent } from './pages/eventos/eventos.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { EventoDetalheComponent } from './pages/evento-detalhe/evento-detalhe.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'eventos', component: EventosComponent },
  { path: 'eventos/:id', component: EventoDetalheComponent },
  { path: 'reset-password', component: ResetPasswordComponent },
  { path: '**', redirectTo: '' },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [ResetPasswordGuard],
  },
];
