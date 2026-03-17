import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from '../../services/supabase.service';

export interface Review {
  id: string;
  event_id: string;
  user_id: string;
  username: string;
  avatar_initial: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface EventDetail {
  id: string;
  titulo: string;
  descricao: string;
  localizacao: string;
  data_evento: string;
  vagas: number;
  slots_taken: number;
  criador_id: string;
  tier_minimo: 'free' | 'pro' | 'pro+';
  privado: boolean;
  codigo_acesso?: string;
  image_url?: string;
  event_type?: string;
}

@Component({
  selector: 'app-event-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule, RouterModule],
  templateUrl: './event-details.component.html',
  styleUrls: ['./event-details.component.css'],
})
export class EventDetailsComponent implements OnInit {
  event = signal<EventDetail | null>(null);
  reviews = signal<Review[]>([]);
  loading = signal(true);
  error = signal('');

  // Registration
  registered = signal(false);
  registerLoading = signal(false);
  registerMsg = signal('');

  // Review form
  newRating = signal(0);
  newRatingHover = signal(0);
  newComment = '';
  reviewLoading = signal(false);
  reviewError = signal('');
  reviewSuccess = signal('');

  // Computed
  averageRating = computed(() => {
    const r = this.reviews();
    if (r.length === 0) return 0;
    return r.reduce((acc, rev) => acc + rev.rating, 0) / r.length;
  });

  slotsPercentage = computed(() => {
    const e = this.event();
    if (!e || e.vagas === 0) return 0;
    return Math.round(((e.slots_taken ?? 0) / e.vagas) * 100);
  });

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    public supabase: SupabaseService,
  ) {}

  async ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.router.navigate(['/events']);
      return;
    }

    try {
      await this.loadEvent(id);
      await this.loadReviews(id);
      await this.checkRegistration(id);
    } catch (err: any) {
      this.error.set('Erro ao carregar o evento.');
    } finally {
      this.loading.set(false);
    }
  }

  async loadEvent(id: string) {
    const { data, error } = await (this.supabase as any).supabase
      .from('eventos')
      .select('*')
      .eq('id', id)
      .single();
    if (error) throw error;
    this.event.set(data);
  }

  async loadReviews(eventId: string) {
    const { data, error } = await (this.supabase as any).supabase
      .from('reviews')
      .select('*')
      .eq('event_id', eventId)
      .order('created_at', { ascending: false });
    if (!error && data) this.reviews.set(data);
  }

  async checkRegistration(eventId: string) {
    const user = this.supabase.currentUser();
    if (!user) return;
    const { data } = await (this.supabase as any).supabase
      .from('registrations')
      .select('id')
      .eq('event_id', eventId)
      .eq('user_id', user.id)
      .single();
    this.registered.set(!!data);
  }

  async toggleRegistration() {
    const user = this.supabase.currentUser();
    const e = this.event();
    if (!user || !e) return;

    this.registerLoading.set(true);
    this.registerMsg.set('');

    try {
      if (this.registered()) {
        await (this.supabase as any).supabase
          .from('registrations')
          .delete()
          .eq('event_id', e.id)
          .eq('user_id', user.id);
        this.registered.set(false);
        this.event.update((ev) =>
          ev
            ? { ...ev, slots_taken: Math.max(0, (ev.slots_taken ?? 0) - 1) }
            : ev,
        );
        this.registerMsg.set('Inscrição cancelada.');
      } else {
        await (this.supabase as any).supabase
          .from('registrations')
          .insert({ event_id: e.id, user_id: user.id });
        this.registered.set(true);
        this.event.update((ev) =>
          ev ? { ...ev, slots_taken: (ev.slots_taken ?? 0) + 1 } : ev,
        );
        this.registerMsg.set('Inscrição confirmada!');
      }
    } catch {
      this.registerMsg.set('Ocorreu um erro. Tenta novamente.');
    } finally {
      this.registerLoading.set(false);
    }
  }

  async submitReview() {
    const user = this.supabase.currentUser();
    const profile = this.supabase.currentPerfil();
    const e = this.event();
    if (!user || !e) return;

    if (this.newRating() === 0) {
      this.reviewError.set('Seleciona uma classificação.');
      return;
    }
    if (!this.newComment.trim()) {
      this.reviewError.set('Escreve um comentário.');
      return;
    }

    this.reviewLoading.set(true);
    this.reviewError.set('');

    try {
      const review = {
        event_id: e.id,
        user_id: user.id,
        nome: profile?.primeiro_nome || user.email?.split('@')[0] || 'Anónimo',
        avatar_initial: (profile?.primeiro_nome ||
          user.email ||
          'A')[0].toUpperCase(),
        rating: this.newRating(),
        comment: this.newComment.trim(),
      };
      const { data, error } = await (this.supabase as any).supabase
        .from('reviews')
        .insert(review)
        .select()
        .single();
      if (error) throw error;

      this.reviews.update((r) => [data, ...r]);
      this.newRating.set(0);
      this.newComment = '';
      this.reviewSuccess.set('Review submetida com sucesso!');
      setTimeout(() => this.reviewSuccess.set(''), 3000);
    } catch (err: any) {
      this.reviewError.set(err.message || 'Erro ao submeter review.');
    } finally {
      this.reviewLoading.set(false);
    }
  }

  // Helpers
  getTierLabel(tier: string): string {
    const map: Record<string, string> = {
      free: 'Free',
      pro: 'Pro',
      'pro+': 'Pro+',
    };
    return map[tier] || tier;
  }

  getTierClass(tier: string): string {
    return `tier-${tier.replace('+', 'plus')}`;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('pt-PT', {
      weekday: 'long',
      day: '2-digit',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatDateShort(date: string): string {
    return new Date(date).toLocaleDateString('pt-PT', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  }

  canRegister(): boolean {
    const tier = this.supabase.currentPerfil()?.tier || 'free';
    const minTier = this.event()?.tier_minimo || 'free';
    const order = ['free', 'pro', 'pro+', 'admin'];
    return order.indexOf(tier) >= order.indexOf(minTier);
  }

  availableSlots(): number {
    const e = this.event();
    if (!e) return 0;
    return e.vagas - (e.slots_taken ?? 0);
  }

  starsArray(): number[] {
    return Array.from({ length: 5 }, (_, i) => i + 1);
  }

  roundedAverage(): string {
    return this.averageRating().toFixed(1);
  }

  goBack() {
    this.router.navigate(['/events']);
  }
}
