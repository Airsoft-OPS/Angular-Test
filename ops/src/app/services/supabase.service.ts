import { Injectable, signal } from '@angular/core';
import { createClient, SupabaseClient, User } from '@supabase/supabase-js';
import { environment } from '../../environments/environment';

export interface Perfil {
  id: string;
  email: string;
  primeiro_nome: string;
  ultimo_nome: string;
  tier: 'free' | 'pro' | 'pro+' | 'admin';
  avatar_url: string;
}

@Injectable({ providedIn: 'root' })
export class SupabaseService {
  private supabase: SupabaseClient;

  currentUser = signal<User | null>(null);
  currentPerfil = signal<Perfil | null>(null);

  constructor() {
    this.supabase = createClient(
      environment.supabaseUrl,
      environment.supabaseKey,
      {
        auth: {
          lock: (name, acquireTimeout, fn) => fn(), // 👈 fix do NavigatorLockAcquireTimeoutError
        },
      },
    );

    this.supabase.auth.getSession().then(({ data }) => {
      this.currentUser.set(data.session?.user ?? null);
      if (data.session?.user) {
        this.carregarPerfil(data.session.user.id);
      }
    });

    this.supabase.auth.onAuthStateChange((_, session) => {
      this.currentUser.set(session?.user ?? null);
      if (session?.user) {
        this.carregarPerfil(session.user.id);
      } else {
        this.currentPerfil.set(null);
      }
    });
  }

  // ── Auth ──────────────────────────────────────────────
  async signUp(
    email: string,
    password: string,
    primeiro_nome: string,
    ultimo_nome: string,
  ) {
    const { data, error } = await this.supabase.auth.signUp({
      email,
      password,
      options: {
        data: { primeiro_nome, ultimo_nome },
      },
    });
    if (error) throw error;

    await this.signIn(email, password);

    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    const { error } = await this.supabase.auth.signOut();
    if (error) throw error;
  }

  // ── Perfil ────────────────────────────────────────────
  async criarPerfil(id: string, email: string, username: string) {
    const { error } = await this.supabase.from('perfis').insert({
      id,
      email,
      username,
      tier: 'free',
      avatar_url: '',
    });
    if (error) throw error;
  }

  async carregarPerfil(id: string) {
    const { data, error } = await this.supabase
      .from('perfis')
      .select('*')
      .eq('id', id)
      .single();

    if (!error && data) {
      this.currentPerfil.set(data);
    }
  }

  async resetPassword(email: string) {
    const { error } = await this.supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'http://localhost:4200/reset-password',
    });
    if (error) throw error;
  }

  async updatePassword(newPassword: string) {
    const { error } = await this.supabase.auth.updateUser({
      password: newPassword,
    });
    if (error) throw error;
  }

  // ── Helpers de Tier ───────────────────────────────────
  isPro(): boolean {
    const tier = this.currentPerfil()?.tier;
    return tier === 'pro' || tier === 'pro+' || tier === 'admin';
  }

  isProPlus(): boolean {
    const tier = this.currentPerfil()?.tier;
    return tier === 'pro+' || tier === 'admin';
  }

  isAdmin(): boolean {
    return this.currentPerfil()?.tier === 'admin';
  }

  // ── Eventos ───────────────────────────────────────────
  async getEventos() {
    const { data, error } = await this.supabase
      .from('eventos')
      .select('*')
      .order('data_evento', { ascending: true });
    if (error) throw error;
    return data;
  }

  async criarEvento(evento: any) {
    const { data, error } = await this.supabase.from('eventos').insert(evento);
    if (error) throw error;
    return data;
  }

  // ── Image Storage ─────────────────────────────────────
  async uploadEventoImagem(path: string, file: File) {
    return await this.supabase.storage.from('eventos').upload(path, file);
  }

  getEventoImagemUrl(path: string): string {
    return this.supabase.storage.from('eventos').getPublicUrl(path).data
      .publicUrl;
  }

  async getSession() {
    return await this.supabase.auth.getSession();
  }
}
