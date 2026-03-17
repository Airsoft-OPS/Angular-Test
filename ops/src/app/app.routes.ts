import { Routes } from '@angular/router';
import { HomeComponent } from './pages/home/home.component';
import { EventsComponent } from './pages/events/events.component';
import { EventCreationFormComponent } from './pages/events/event-creation-form/event-creation-form.component';
import { ResetPasswordComponent } from './pages/reset-password/reset-password.component';
import { ResetPasswordGuard } from './guards/reset-password.guard';
import { EventDetailsComponent } from './pages/event-details/event-details.component';

export const routes: Routes = [
  { path: '', component: HomeComponent },
  {
    path: 'events',
    children: [
      { path: '', component: EventsComponent },
      { path: 'create', component: EventCreationFormComponent },
      { path: ':id', component: EventDetailsComponent },
    ],
  },
  {
    path: 'reset-password',
    component: ResetPasswordComponent,
    canActivate: [ResetPasswordGuard],
  },
  { path: '**', redirectTo: '' },
];
