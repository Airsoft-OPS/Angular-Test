import { Component, EventEmitter, Output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SupabaseService } from '../../services/supabase.service';
import { LucideAngularModule } from 'lucide-angular';

type AuthMode = 'login' | 'register';

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

  constructor(private supabase: SupabaseService) { }

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
        this.close.emit();
      } else {
        await this.supabase.signUp(this.email, this.password, this.username);
        this.successMsg.set('Conta criada! Verifica o teu email.');
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