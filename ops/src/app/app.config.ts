import { ApplicationConfig, provideZoneChangeDetection, importProvidersFrom } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import {
  LucideAngularModule,
  LogIn, LogOut, MapPin, Calendar, Shield,
  Users, Lock, ChevronRight, Crosshair,
  Mail, KeyRound, UserRound, X, Eye, EyeOff,
  AlertCircle, CheckCircle, Loader,
  Clock, Bell, MessageSquare, Edit,
  Trash2, Plus, Minus,
  Target, Globe, Star
} from 'lucide-angular';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    importProvidersFrom(
      LucideAngularModule.pick({
        LogIn, LogOut, MapPin, Calendar, Shield, Users, Lock,
        ChevronRight, Crosshair, Mail, KeyRound, UserRound,
        X, Eye, EyeOff, AlertCircle, CheckCircle, Loader,
        Target, Globe, Star, Clock, Bell, MessageSquare, 
        Edit, Trash2, Plus, Minus,
      })
    )
  ]
};