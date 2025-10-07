import { Component } from '@angular/core';
import { RouterLink, RouterLinkActive, Router, ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { merge, of, Observable } from 'rxjs';
import { map, switchMap } from 'rxjs/operators';
import { TaskService } from '../../services/task.service';
import { TaskEventsService } from '../../services/task-events.service';

@Component({
  selector: 'todo-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <aside class="app-sidebar">
      <nav>
        <a routerLink="/tasks" routerLinkActive="active">Tareas</a>
        <a routerLink="/history" routerLinkActive="active">Historial</a>
        <a routerLink="/media" routerLinkActive="active">Multimedia</a>
        <a routerLink="/alarm" routerLinkActive="active">Alarmas</a>
        <a routerLink="/settings" routerLinkActive="active">Configuración</a>
      </nav>

      <!-- Contadores por estado -->
      <div style="margin-top:16px; border-top:1px solid #1f2937; padding-top:12px;">
        <div style="font-weight:600; margin-bottom:8px;">Estados</div>
        <div style="display:grid; grid-template-columns: 1fr auto; row-gap:6px;">
          <a href (click)="onStatusClick($event, 'pending')">Pendientes</a>
          <a href (click)="onStatusClick($event, 'pending')" class="badge">{{ (counts$ | async)?.pending ?? 0 }}</a>

          <a href (click)="onStatusClick($event, 'working')">En curso</a>
          <a href (click)="onStatusClick($event, 'working')" class="badge">{{ (counts$ | async)?.working ?? 0 }}</a>

          <a href (click)="onStatusClick($event, 'completed')">Completadas</a>
          <a href (click)="onStatusClick($event, 'completed')" class="badge">{{ (counts$ | async)?.completed ?? 0 }}</a>

          <a href (click)="onStatusClick($event, 'archived')">Archivadas</a>
          <a href (click)="onStatusClick($event, 'archived')" class="badge">{{ (counts$ | async)?.archived ?? 0 }}</a>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  counts$!: Observable<{ pending: number; working: number; completed: number; archived: number }>;

  constructor(
    private taskService: TaskService,
    private events: TaskEventsService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.counts$ = merge(of(undefined), this.events.refresh$).pipe(
      switchMap(() => this.taskService.list()),
      map(res => {
        const tasks = res.data?.tasks ?? [];
        const counts = { pending: 0, working: 0, completed: 0, archived: 0 };
        for (const t of tasks) {
          if (counts.hasOwnProperty(t.status)) counts[t.status as keyof typeof counts]++;
        }
        return counts;
      })
    );
  }

  onStatusClick(event: MouseEvent, status: 'pending' | 'working' | 'completed' | 'archived') {
    event.preventDefault();
    const current = this.route.snapshot.queryParamMap.get('status');
    const statusParam = current === status ? null : status;
    this.router.navigate(['/tasks'], { queryParams: { status: statusParam }, queryParamsHandling: 'merge' });
  }
}