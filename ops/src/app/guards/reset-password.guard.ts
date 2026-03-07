import { Injectable } from '@angular/core';
import { CanActivate, Router } from '@angular/router';
import { SupabaseService } from '../services/supabase.service';

@Injectable({ providedIn: 'root' })
export class ResetPasswordGuard implements CanActivate {
  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

  async canActivate(): Promise<boolean> {
    // Verifica se há uma sessão ativa vinda do link de recuperação
    const { data } = await this.getSession();

    if (data.session) {
      return true;
    }

    // Se não houver sessão, redireciona para a home
    this.router.navigate(['/']);
    return false;
  }

  async getSession() {
    return await this.supabase['supabase'].auth.getSession();
  }
}
