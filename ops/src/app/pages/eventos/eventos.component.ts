import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SupabaseService } from '../../services/supabase.service';
import { FormsModule } from '@angular/forms'; 
import { LucideAngularModule } from 'lucide-angular';

export interface Evento {
  id: string;
  titulo: string;
  descricao: string;
  localizacao: string;
  data_evento: string;
  vagas: number;
  criador_id: string;
  tier_minimo: 'free' | 'pro' | 'pro+';
  privado: boolean;
  codigo_acesso?: string;
}

@Component({
  selector: 'app-eventos',
  standalone: true,
  imports: [CommonModule, FormsModule, LucideAngularModule],
  templateUrl: './eventos.component.html',
  styleUrls: ['./eventos.component.css']
})
export class EventosComponent implements OnInit {
  eventos = signal<Evento[]>([]);
  loading = signal(true);
  erro = signal('');

  // Modal código acesso
  eventoSelecionado = signal<Evento | null>(null);
  codigoInput = '';
  codigoErro = signal('');

  constructor(public supabase: SupabaseService) { }

  async ngOnInit() {
    try {
      const data = await this.supabase.getEventos();
      this.eventos.set(data || []);
    } catch (err: any) {
      this.erro.set('Erro ao carregar eventos.');
    } finally {
      this.loading.set(false);
    }
  }

  getTierLabel(tier: string) {
    const tiers: any = { free: 'Free', pro: 'Pro', 'pro+': 'Pro+' };
    return tiers[tier] || tier;
  }

  getTierClass(tier: string) {
    return `tier-${tier.replace('+', 'plus')}`;
  }

  podeInscrever(evento: Evento): boolean {
    const tier = this.supabase.currentPerfil()?.tier || 'free';
    const ordem = ['free', 'pro', 'pro+', 'admin'];
    return ordem.indexOf(tier) >= ordem.indexOf(evento.tier_minimo);
  }

  abrirEvento(evento: Evento) {
    if (evento.privado) {
      this.eventoSelecionado.set(evento);
      this.codigoInput = '';
      this.codigoErro.set('');
    }
  }

  verificarCodigo() {
    const evento = this.eventoSelecionado();
    if (!evento) return;

    if (this.codigoInput.trim() === evento.codigo_acesso) {
      this.eventoSelecionado.set(null);
      // navegação futura para detalhe do evento
    } else {
      this.codigoErro.set('Código incorreto. Tenta novamente.');
    }
  }

  fecharModal(event: MouseEvent) {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.eventoSelecionado.set(null);
    }
  }

  formatarData(data: string): string {
    return new Date(data).toLocaleDateString('pt-PT', {
      day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  }
}