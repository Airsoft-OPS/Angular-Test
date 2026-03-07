import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';
import { ToastService } from '../../services/toast.service';

type AuthMode = 'login' | 'register' | 'reset';

@Component({
  selector: 'app-auth-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './auth-modal.component.html',
  styleUrls: ['./auth-modal.component.css']
})
export class AuthModalComponent {
  @Output() close = new EventEmitter<void>();

  mode = signal<AuthMode>('login');
  email = '';
  password = '';
  confirmPassword = '';
  username = '';
  loading = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  constructor(private supabase: SupabaseService, private toast: ToastService) { }

  setMode(m: AuthMode) {
    this.errorMsg.set('');
    this.successMsg.set('');
    this.email = '';
    this.password = '';
    this.confirmPassword = '';
    this.username = '';
    setTimeout(() => { this.mode.set(m); }, 10);
  }

  async submit() {
    this.errorMsg.set('');
    this.successMsg.set('');

    if (this.mode() === 'reset') {
      if (!this.email) {
        this.errorMsg.set('Introduz o teu email.');
        return;
      }
      this.loading.set(true);
      try {
        await this.supabase.resetPassword(this.email);
        this.successMsg.set('Email enviado! Verifica a tua caixa de correio.');
      } catch (err: any) {
        this.errorMsg.set(err.message || 'Ocorreu um erro. Tenta novamente.');
      } finally {
        this.loading.set(false);
      }
      return;
    }

    if (!this.email || !this.password) {
      this.errorMsg.set('Preenche todos os campos.');
      return;
    }

    if (this.mode() === 'register' && !this.username) {
      this.errorMsg.set('Preenche o teu username.');
      return;
    }

    if (this.mode() === 'register' && !this.confirmPassword) {
      this.errorMsg.set('Preenche todos os campos.');
      return;
    }

    if (this.mode() === 'register' && this.password !== this.confirmPassword) {
      this.errorMsg.set('As passwords não coincidem.');
      return;
    }

    this.loading.set(true);
    try {
      if (this.mode() === 'login') {
        await this.supabase.signIn(this.email, this.password);
        await new Promise(resolve => setTimeout(resolve, 500));
        const username = this.supabase.currentPerfil()?.username || this.email.split('@')[0];
        this.toast.show(`Bem-vindo de volta, ${username} !`);
        this.close.emit();
      } else {
        await this.supabase.signUp(this.email, this.password, this.username);
        await new Promise(resolve => setTimeout(resolve, 500));
        const username = this.supabase.currentPerfil()?.username || this.email.split('@')[0];
        this.toast.show(`Bem-vindo, ${username}! Conta criada com sucesso.`);
        this.close.emit();
      }
    } catch (err: any) {
      this.errorMsg.set(err.message || 'Ocorreu um erro. Tenta novamente.');
    } finally {
      this.loading.set(false);
    }
  }

  onBackdropClick(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }
}