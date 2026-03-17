import { Component, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LucideAngularModule } from 'lucide-angular';
import { SupabaseService } from '../../../services/supabase.service';

@Component({
  selector: 'app-event-creation-form',
  standalone: true,
  imports: [FormsModule, RouterLink, LucideAngularModule],
  templateUrl: './event-creation-form.component.html',
  styleUrl: './event-creation-form.component.css',
})
export class EventCreationFormComponent {
  loading = signal(false);
  erro = signal('');
  imagePreview = signal<string | null>(null);
  imageFile = signal<File | null>(null);

  form = signal({
    titulo: '',
    descricao: '',
    localizacao: '',
    data_evento: '',
    vagas: null as number | null,
    tier_minimo: 'free',
    privado: false,
  });

  constructor(
    private supabase: SupabaseService,
    private router: Router,
  ) {}

  togglePrivado() {
    this.form.update((f) => ({ ...f, privado: !f.privado }));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files?.[0]) this.processImage(input.files[0]);
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    const file = event.dataTransfer?.files[0];
    if (file?.type.startsWith('image/')) this.processImage(file);
  }

  processImage(file: File) {
    if (file.size > 5 * 1024 * 1024) {
      this.erro.set('A imagem não pode exceder 5MB.');
      return;
    }
    this.imageFile.set(file);
    const reader = new FileReader();
    reader.onload = (e) => this.imagePreview.set(e.target?.result as string);
    reader.readAsDataURL(file);
  }

  removeImage(event: MouseEvent) {
    event.stopPropagation();
    this.imagePreview.set(null);
    this.imageFile.set(null);
  }

  async submit() {
    const f = this.form();
    if (
      !f.titulo ||
      !f.localizacao ||
      !f.data_evento ||
      !f.vagas ||
      !f.tier_minimo
    ) {
      this.erro.set('Preenche todos os campos obrigatórios.');
      return;
    }

    this.loading.set(true);
    this.erro.set('');

    try {
      let imagem_url: string | null = null;

      const file = this.imageFile();
      if (file) {
        const path = `eventos/${Date.now()}_${file.name}`;
        const { error: uploadError } = await this.supabase.uploadEventoImagem(
          path,
          file,
        );
        if (uploadError) throw uploadError;
        imagem_url = this.supabase.getEventoImagemUrl(path);
      }

      await this.supabase.criarEvento({
        titulo: f.titulo,
        descricao: f.descricao,
        localizacao: f.localizacao,
        data_evento: f.data_evento,
        vagas: f.vagas,
        tier_minimo: f.tier_minimo,
        privado: f.privado,
        imagem_url,
        criador_id: this.supabase.currentUser()?.id,
      });

      this.router.navigate(['/eventos']);
    } catch (e: any) {
      this.erro.set(e.message);
    } finally {
      this.loading.set(false);
    }
  }
}
