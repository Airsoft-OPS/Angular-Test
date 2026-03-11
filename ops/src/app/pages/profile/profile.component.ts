import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';

type ActiveTab = 'overview' | 'edit' | 'security';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css'],
})
export class ProfileComponent implements OnInit {
  activeTab = signal<ActiveTab>('overview');
  loading = signal(true);
  saveLoading = signal(false);
  passwordLoading = signal(false);
  successMsg = signal('');
  errorMsg = signal('');
  passwordSuccessMsg = signal('');
  passwordErrorMsg = signal('');
  perfil!: typeof this.supabase.currentPerfil;
  user!: typeof this.supabase.currentUser;
  editUsername = '';
  editPrimeiroNome = '';
  editUltimoNome = '';
  editAvatarUrl = '';
  newPassword = '';
  confirmPassword = '';
  eventsCreated = signal(0);
  eventsJoined = signal(0);
  reviewsWritten = signal(0);

  constructor(
    public supabase: SupabaseService,
    private router: Router,
  ) {
    this.perfil = this.supabase.currentPerfil;
    this.user = this.supabase.currentUser;
  }

  async ngOnInit() {
    const user = this.supabase.currentUser();
    if (user && !this.supabase.currentPerfil()) {
      await this.supabase.carregarPerfil(user.id);
    }

    this.syncFormFields();
    await this.loadStats();
    this.loading.set(false);
  }

  syncFormFields() {
    const p = this.supabase.currentPerfil();
    if (!p) return;
    this.editUsername = p.username || '';
    this.editPrimeiroNome = p.primeiro_nome || '';
    this.editUltimoNome = p.ultimo_nome || '';
    this.editAvatarUrl = p.avatar_url || '';
  }

  async loadStats() {
    const user = this.supabase.currentUser();
    if (!user) return;
    try {
      //const [created, joined, reviews]
      const [created] = await Promise.all([
        (this.supabase as any).supabase
          .from('eventos')
          .select('id', { count: 'exact', head: true })
          .eq('criador_id', user.id),
        // (this.supabase as any).supabase
        //   .from('registrations')
        //   .select('id', { count: 'exact', head: true })
        //   .eq('user_id', user.id),
        // (this.supabase as any).supabase
        //   .from('reviews')
        //   .select('id', { count: 'exact', head: true })
        //   .eq('user_id', user.id),
      ]);
      this.eventsCreated.set(created.count ?? 0);
      // this.eventsJoined.set(joined.count ?? 0);
      // this.reviewsWritten.set(reviews.count ?? 0);
    } catch {
      // Stats are non-critical
    }
  }

  setTab(tab: ActiveTab) {
    this.activeTab.set(tab);
    if (tab === 'edit') this.syncFormFields();
    if (tab === 'overview') this.loadStats();
    this.successMsg.set('');
    this.errorMsg.set('');
    this.passwordSuccessMsg.set('');
    this.passwordErrorMsg.set('');
  }

  async saveProfile() {
    const user = this.supabase.currentUser();
    if (!user) return;

    if (!this.editUsername.trim()) {
      this.errorMsg.set('O username não pode estar vazio.');
      return;
    }

    this.saveLoading.set(true);
    this.errorMsg.set('');

    try {
      const { error } = await (this.supabase as any).supabase
        .from('perfis')
        .update({
          username: this.editUsername.trim(),
          primeiro_nome: this.editPrimeiroNome.trim(),
          ultimo_nome: this.editUltimoNome.trim(),
          avatar_url: this.editAvatarUrl.trim(),
        })
        .eq('id', user.id);

      if (error) throw error;

      await this.supabase.carregarPerfil(user.id);
      this.successMsg.set('Perfil atualizado com sucesso!');
      setTimeout(() => this.successMsg.set(''), 3000);
    } catch (err: any) {
      this.errorMsg.set(err.message || 'Erro ao guardar o perfil.');
    } finally {
      this.saveLoading.set(false);
    }
  }

  async changePassword() {
    this.passwordErrorMsg.set('');
    this.passwordSuccessMsg.set('');

    if (!this.newPassword || !this.confirmPassword) {
      this.passwordErrorMsg.set('Preenche todos os campos.');
      return;
    }
    if (this.newPassword.length < 6) {
      this.passwordErrorMsg.set('A password deve ter pelo menos 6 caracteres.');
      return;
    }
    if (this.newPassword !== this.confirmPassword) {
      this.passwordErrorMsg.set('As passwords não coincidem.');
      return;
    }

    this.passwordLoading.set(true);
    try {
      await this.supabase.updatePassword(this.newPassword);
      this.passwordSuccessMsg.set('Password alterada com sucesso!');
      this.newPassword = '';
      this.confirmPassword = '';
      setTimeout(() => this.passwordSuccessMsg.set(''), 3000);
    } catch (err: any) {
      this.passwordErrorMsg.set(err.message || 'Erro ao alterar a password.');
    } finally {
      this.passwordLoading.set(false);
    }
  }

  getAvatarInitial(): string {
    const source =
      this.supabase.currentPerfil()?.username ??
      this.supabase.currentUser()?.email ??
      'U';
    return source[0].toUpperCase();
  }

  getTierLabel(tier: string): string {
    const map: Record<string, string> = {
      free: 'Free',
      pro: 'Pro',
      'pro+': 'Pro+',
      admin: 'Admin',
    };
    return map[tier] || tier;
  }

  getTierClass(tier: string): string {
    return `tier-${tier.replace('+', 'plus')}`;
  }

  async logout() {
    await this.supabase.signOut();
    this.router.navigate(['/']);
  }
}
