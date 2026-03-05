import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SupabaseService } from '../../services/supabase.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { LucideAngularModule } from 'lucide-angular';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule, AuthModalComponent, LucideAngularModule],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  showModal = signal(false);

  constructor(public supabase: SupabaseService) { }

  openModal() { this.showModal.set(true); }
  closeModal() { this.showModal.set(false); }

  async logout() { await this.supabase.signOut(); }
}