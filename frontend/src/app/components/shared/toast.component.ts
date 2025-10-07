import { Component, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService, ToastMessage } from '../../services/toast.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'todo-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      <div *ngFor="let t of toasts" class="toast" [class.error]="t.type==='error'" [class.success]="t.type==='success'">
        {{ t.text }}
      </div>
    </div>
  `
})
export class ToastComponent implements OnDestroy {
  toasts: ToastMessage[] = [];
  sub: Subscription;

  constructor(private toast: ToastService) {
    this.sub = this.toast.messages$.subscribe(msg => {
      this.toasts = [...this.toasts, msg];
      setTimeout(() => {
        this.toasts = this.toasts.filter(t => t.id !== msg.id);
      }, 3000);
    });
  }

  ngOnDestroy() { this.sub?.unsubscribe(); }
}