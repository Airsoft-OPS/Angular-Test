import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { AppComponent } from './app/app.component';

bootstrapApplication(AppComponent, appConfig).catch((err) =>
  console.error(err),
);

// Supress Supabase Navigator Lock warnings in dev
if (!('locks' in navigator)) {
  (navigator as any).locks = {
    request: (_: any, fn: any) => fn(),
  };
}
