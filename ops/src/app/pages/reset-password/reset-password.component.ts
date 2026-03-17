import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';

@Component({
  selector: 'app-reset-password',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.css'],
})
export class ResetPasswordComponent {
  password = '';
  confirmPassword = '';
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

  async submit() {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (!this.password || !this.confirmPassword) {
      this.errorMsg.set('Preenche todos os campos.');
      return;
    }

    if (this.password !== this.confirmPassword) {
      this.errorMsg.set('As passwords não coincidem.');
      return;
    }

    if (this.password.length < 6) {
      this.errorMsg.set('A password deve ter pelo menos 6 caracteres.');
      return;
    }

    this.loading.set(true);
    try {
      await this.supabase.updatePassword(this.password);
      this.successMsg.set('Password atualizada com sucesso!');
      setTimeout(() => this.router.navigate(['/']), 2000);
    } catch (err: any) {
      this.errorMsg.set(err.message || 'Ocorreu um erro. Tenta novamente.');
    } finally {
      this.loading.set(false);
    }
  }
}
