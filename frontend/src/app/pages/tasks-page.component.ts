import { Component, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, RouterLinkActive, ActivatedRoute, Router } from '@angular/router';
import { TaskService, Task, Subtask } from '../services/task.service';
import { TaskEventsService } from '../services/task-events.service';
import { BehaviorSubject, Subject, merge, of, switchMap, map, combineLatest, startWith, debounceTime, distinctUntilChanged, Observable } from 'rxjs';
import { ToastService } from '../services/toast.service';

@Component({
  selector: 'todo-tasks-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section class="page">
      <h2 class="page-title">Tareas</h2>

      <div class="filters-bar">
        <label>
          Estado:
          <select [(ngModel)]="statusFilter" (change)="onFilterChange()">
            <option *ngFor="let s of statuses" [value]="s">{{ s }}</option>
          </select>
        </label>

        <label>
          Prioridad:
          <select [(ngModel)]="priorityFilter" (change)="onPriorityChange()">
            <option *ngFor="let p of priorities" [value]="p">{{ p }}</option>
          </select>
        </label>

        <label class="filters-search">
          Buscar:
          <input [(ngModel)]="searchText" (ngModelChange)="onSearch($event)" type="text" placeholder="Filtrar por título..." />
        </label>

        <!-- Ordenación -->
        <label>
          Ordenar por:
          <select [(ngModel)]="sortBy" (change)="onSortChange()">
            <option value="title">Título</option>
            <option value="priority">Prioridad</option>
            <option value="status">Estado</option>
            <option value="createdAt">Creación</option>
            <option value="updatedAt">Actualización</option>
          </select>
        </label>

        <label>
          Dirección:
          <select [(ngModel)]="sortDir" (change)="onSortChange()">
            <option value="asc">Ascendente</option>
            <option value="desc">Descendente</option>
          </select>
        </label>

        <button class="btn" (click)="reload()">Recargar</button>
        <button class="btn" (click)="clearFilters()">Limpiar filtros</button>
      </div>

      <!-- Tarjetas de Prioridad -->
      <div class="priority-cards">
        <button
          class="priority-card priority-low"
          [class.selected]="priorityFilter === 'low'"
          (click)="onPriorityCardClick('low')">
          <div class="priority-card-count">Tareas activas ({{ (priorityCounts$ | async)?.low ?? 0 }})</div>
          <div class="priority-card-title">Low Priority</div>
        </button>

        <button
          class="priority-card priority-medium"
          [class.selected]="priorityFilter === 'medium'"
          (click)="onPriorityCardClick('medium')">
          <div class="priority-card-count">Tareas activas ({{ (priorityCounts$ | async)?.medium ?? 0 }})</div>
          <div class="priority-card-title">Medium Priority</div>
        </button>

        <button
          class="priority-card priority-high"
          [class.selected]="priorityFilter === 'high'"
          (click)="onPriorityCardClick('high')">
          <div class="priority-card-count">Tareas activas ({{ (priorityCounts$ | async)?.high ?? 0 }})</div>
          <div class="priority-card-title">High Priority</div>
        </button>
      </div>

      <!-- Formulario crear tarea -->
      <div style="background:#111827; padding:12px; border-radius:8px; border:1px solid #1f2937; margin-bottom:16px;">
        <h3 style="margin-top:0;">Crear tarea</h3>
        <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
          <label>
            Título
            <input [(ngModel)]="newTask.title" type="text" placeholder="Título de la tarea" />
          </label>
          <label>
            Prioridad
            <select [(ngModel)]="newTask.priority">
              <option value="low">Baja</option>
              <option value="medium">Media</option>
              <option value="high">Alta</option>
            </select>
          </label>
          <label style="grid-column:1 / -1;">
            Descripción
            <textarea [(ngModel)]="newTask.description" rows="2" placeholder="Descripción (opcional)"></textarea>
          </label>
          <label>
            <input type="checkbox" [(ngModel)]="newTask.remember" /> Recordatorio
          </label>
          <div style="text-align:right;">
            <button class="btn" (click)="createTask()" [disabled]="!canSave()">Guardar</button>
          </div>
        </div>
      </div>

      <!-- Lista de tareas -->
      <h3 class="section-title">Tareas activas</h3>

      <ul class="task-list">
        <li
          *ngFor="let t of (tasks$ | async); trackBy: trackById"
          class="task-item"
          [class.priority-low]="t.priority === 'low'"
          [class.priority-medium]="t.priority === 'medium'"
          [class.priority-high]="t.priority === 'high'"
          [class.state-pending]="t.status === 'pending'"
          [class.state-working]="t.status === 'working'"
          [class.state-completed]="t.status === 'completed'"
          [class.state-archived]="t.status === 'archived'">
          <div class="title">{{ t.title }}</div>
          <div class="meta">
            <span class="badge" [class.low]="t.priority==='low'" [class.medium]="t.priority==='medium'" [class.high]="t.priority==='high'">
              {{ t.priority }}
            </span>
            <span class="badge status"
                  [class.pending]="t.status==='pending'"
                  [class.working]="t.status==='working'"
                  [class.completed]="t.status==='completed'"
                  [class.archived]="t.status==='archived'">
              {{ t.status }}
            </span>
          </div>
          <div class="actions">
            <label>
              Estado:
              <select [value]="t.status" (change)="setStatus(t, $any($event.target).value)">
                <option value="pending">Pendiente</option>
                <option value="working">En curso</option>
                <option value="completed">Completada</option>
                <option value="archived">Archivada</option>
              </select>
            </label>

            <button class="btn" *ngIf="editingId !== t.id" (click)="startEdit(t)">Editar</button>
            <button class="btn danger" (click)="remove(t)">Eliminar</button>
          </div>

          <!-- Detalles: descripción y subtareas -->
          <div class="details">
            <p *ngIf="t.description" class="description">{{ t.description }}</p>

            <ul class="subtasks" *ngIf="t.subtasks?.length">
              <li *ngFor="let s of t.subtasks; let i = index">
                <label>
                  <input
                    type="checkbox"
                    [checked]="s.completed"
                    (change)="toggleSubtask(t, i, $any($event.target).checked)" />
                  <span [class.completed]="s.completed">{{ s.title }}</span>
                </label>
                <button class="btn danger" (click)="removeSubtaskInline(t, i)">Quitar</button>
              </li>
            </ul>

            <!-- Añadir subtarea inline -->
            <div class="subtasks-add">
              <input #newSubtask type="text" placeholder="Nueva subtarea..." />
              <button class="btn" (click)="addSubtaskInline(t, newSubtask.value); newSubtask.value=''">Añadir</button>
            </div>
          </div>

          <!-- Detalles: descripción y subtareas -->
          <div class="details">
            <p *ngIf="t.description" class="description">{{ t.description }}</p>

            <ul class="subtasks" *ngIf="t.subtasks?.length">
              <li *ngFor="let s of t.subtasks; let i = index">
                <label>
                  <input
                    type="checkbox"
                    [checked]="s.completed"
                    (change)="toggleSubtask(t, i, $any($event.target).checked)" />
                  <span [class.completed]="s.completed">{{ s.title }}</span>
                </label>
                <button class="btn danger" (click)="removeSubtaskInline(t, i)">Quitar</button>
              </li>
            </ul>

            <!-- Añadir subtarea inline -->
            <div class="subtasks-add">
              <input #newSubtask type="text" placeholder="Nueva subtarea..." />
              <button class="btn" (click)="addSubtaskInline(t, newSubtask.value); newSubtask.value=''">Añadir</button>
            </div>
          </div>

          <!-- Panel de edición inline -->
          <div *ngIf="editingId === t.id" style="margin-top:10px; background:#0b1220; border:1px solid #1f2937; padding:10px; border-radius:8px;">
            <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
              <label>
                Título
                <input [(ngModel)]="editModel.title" type="text" />
              </label>
              <label>
                Prioridad
                <select [(ngModel)]="editModel.priority">
                  <option value="low">Baja</option>
                  <option value="medium">Media</option>
                  <option value="high">Alta</option>
                </select>
              </label>
              <label style="grid-column: 1 / -1;">
                Descripción
                <textarea [(ngModel)]="editModel.description" rows="2"></textarea>
              </label>
            </div>

            <!-- Subtareas -->
            <div style="margin-top:10px;">
              <div style="font-weight:600; margin-bottom:6px;">Subtareas</div>
              <div *ngFor="let s of editModel.subtasks; let i = index" style="display:flex; align-items:center; gap:8px; margin-bottom:6px;">
                <input type="checkbox" [(ngModel)]="editModel.subtasks[i].completed" />
                <input [(ngModel)]="editModel.subtasks[i].title" type="text" style="flex:1;" />
                <button class="btn danger" (click)="removeSubtask(i)">Quitar</button>
              </div>

              <div style="display:flex; gap:8px; align-items:center;">
                <input [(ngModel)]="newSubtaskTitle" type="text" placeholder="Nueva subtarea..." style="flex:1;" />
                <button class="btn" (click)="addSubtask()">Añadir</button>
              </div>
            </div>

            <div style="text-align:right; margin-top:10px;">
              <button class="btn" (click)="saveEdit(t)">Guardar cambios</button>
              <button class="btn" (click)="cancelEdit()">Cancelar</button>
            </div>
          </div>
        </li>
      </ul>

      <p *ngIf="(tasks$ | async)?.length === 0" style="opacity:0.8;">No hay tareas. Crea una nueva arriba y pulsa "Recargar".</p>
    </section>
  `
})
export class TasksPageComponent {
  statuses = ['all', 'pending', 'working', 'completed', 'archived'];
  priorities = ['all', 'low', 'medium', 'high'];

  priorityCounts$!: Observable<{ low: number; medium: number; high: number }>;

  // Edición inline
  editingId: string | null = null;
  editModel: { title: string; description: string; priority: 'low' | 'medium' | 'high'; subtasks: Subtask[] } = {
    title: '',
    description: '',
    priority: 'medium',
    subtasks: []
  };
  newSubtaskTitle = '';

  statusFilter: 'all' | Task['status'] = 'all';
  priorityFilter: 'all' | Task['priority'] = 'all';

  // búsqueda por título
  searchText = '';
  private searchTerm$ = new Subject<string>();

  private filters$ = new BehaviorSubject<{ status: 'all' | Task['status']; priority: 'all' | Task['priority'] }>({
    status: 'all',
    priority: 'all'
  });

  // combinar filtros + término de búsqueda con debounce
  tasks$ = combineLatest([
    this.filters$,
    this.searchTerm$.pipe(startWith(''), debounceTime(300), distinctUntilChanged())
  ]).pipe(
    switchMap(([f, term]) =>
      this.taskService.list(f.status !== 'all' ? (f.status as Task['status']) : undefined).pipe(
        map(res => {
          let tasks: Task[] = res.data?.tasks ?? [];
          if (f.priority !== 'all') {
            tasks = tasks.filter((t: Task) => t.priority === f.priority);
          }
          const q = term?.toLowerCase().trim();
          if (q) {
            tasks = tasks.filter((t: Task) => t.title.toLowerCase().includes(q));
          }

          // Ordenación
          const pr = { low: 1, medium: 2, high: 3 } as const;
          const sr = { pending: 1, working: 2, completed: 3, archived: 4 } as const;

          const dir = this.sortDir === 'asc' ? 1 : -1;
          tasks = [...tasks].sort((a, b) => {
            let av: any, bv: any;

            switch (this.sortBy) {
              case 'title':
                av = a.title.toLowerCase(); bv = b.title.toLowerCase(); break;
              case 'priority':
                av = pr[a.priority]; bv = pr[b.priority]; break;
              case 'status':
                av = sr[a.status]; bv = sr[b.status]; break;
              case 'createdAt':
                av = new Date(a.createdAt).getTime(); bv = new Date(b.createdAt).getTime(); break;
              case 'updatedAt':
                av = new Date(a.updatedAt).getTime(); bv = new Date(b.updatedAt).getTime(); break;
            }
            if (av < bv) return -1 * dir;
            if (av > bv) return 1 * dir;
            return 0;
          });

          return tasks;
        })
      )
    )
  );

  newTask: { title: string; description?: string; priority: 'low' | 'medium' | 'high'; remember: boolean } = {
    title: '',
    description: '',
    priority: 'medium',
    remember: false
  };

  // controles de orden
  sortBy: 'title' | 'priority' | 'status' | 'createdAt' | 'updatedAt' = 'createdAt';
  sortDir: 'asc' | 'desc' = 'desc';

  constructor(
    private taskService: TaskService,
    private taskEvents: TaskEventsService,
    private route: ActivatedRoute,
    private router: Router,
    private toast: ToastService
  ) {
    // Inicializar contadores de prioridad
    this.priorityCounts$ = merge(of(undefined), this.taskEvents.refresh$).pipe(
      switchMap(() => this.taskService.list()),
      map(res => {
        const tasks = res.data?.tasks ?? [];
        const counts = { low: 0, medium: 0, high: 0 };
        for (const t of tasks) {
          if (counts.hasOwnProperty(t.priority)) counts[t.priority as keyof typeof counts]++;
        }
        return counts;
      })
    );

    this.route.queryParamMap.subscribe(params => {
      const status = params.get('status') as Task['status'] | null;
      const valid = ['pending', 'working', 'completed', 'archived'] as const;

      this.statusFilter = status && (valid as readonly string[]).includes(status) ? (status as Task['status']) : 'all';

      const q = params.get('q') ?? '';
      this.searchText = q;
      this.searchTerm$.next(q);

      this.reload();
    });
  }

  reload() {
    this.filters$.next({ status: this.statusFilter, priority: this.priorityFilter });
  }

  onSortChange() {
    this.reload();
  }

  canSave() {
    const title = this.newTask.title?.trim() ?? '';
    return title.length >= 3;
  }

  setStatus(t: Task, status: Task['status']) {
    if (!status || status === t.status) return;
    this.taskService.update(t.id, { status }).subscribe({
      next: _ => {
        this.reload();
        this.taskEvents.trigger();
        this.toast.success('Estado actualizado');
      },
      error: () => {}
    });
  }

  remove(t: Task) {
    const ok = window.confirm('¿Seguro que deseas eliminar esta tarea? Esta acción no se puede deshacer.');
    if (!ok) return;

    this.taskService.delete(t.id).subscribe({
      next: _ => {
        this.reload();
        this.taskEvents.trigger();
        this.toast.success('Tarea eliminada');
      },
      error: () => {}
    });
  }

  onFilterChange() {
    const statusParam = this.statusFilter !== 'all' ? this.statusFilter : null;
    this.router.navigate([], { queryParams: { status: statusParam }, queryParamsHandling: 'merge' });
    this.reload();
  }

  onPriorityChange() {
    const priorityParam = this.priorityFilter !== 'all' ? this.priorityFilter : null;
    this.router.navigate([], { queryParams: { priority: priorityParam }, queryParamsHandling: 'merge' });
    this.reload();
  }

  // Toggle por tarjeta: clic repetido limpia el filtro
  onPriorityCardClick(priority: 'low' | 'medium' | 'high') {
    const isSame = this.priorityFilter === priority;
    this.priorityFilter = isSame ? 'all' : priority;
    const priorityParam = isSame ? null : priority;
    this.router.navigate([], { queryParams: { priority: priorityParam }, queryParamsHandling: 'merge' });
    this.reload();
  }

  onSearch(value: string) {
    const q = (value ?? '').trim();
    this.router.navigate([], { queryParams: { q: q || null }, queryParamsHandling: 'merge' });
    this.searchTerm$.next(q);
  }

  // Limpia filtros: estado, prioridad y búsqueda; además elimina status y q de la URL
  clearFilters() {
    this.statusFilter = 'all';
    this.priorityFilter = 'all';
    this.searchText = '';

    this.router.navigate([], { queryParams: { status: null, q: null }, queryParamsHandling: 'merge' });
    this.searchTerm$.next('');
    this.reload();
  }

  createTask() {
    const payload = {
      title: this.newTask.title?.trim(),
      description: this.newTask.description?.trim(),
      priority: this.newTask.priority,
      remember: this.newTask.remember
    };
    if (!payload.title || payload.title.length < 3) {
      return;
    }
    this.taskService.create(payload).subscribe({
      next: _ => {
        this.newTask = { title: '', description: '', priority: 'medium', remember: false };
        this.reload();
        this.taskEvents.trigger();
        this.toast.success('Tarea creada');
      },
      error: () => {}
    });
  }

  startEdit(t: Task) {
    this.editingId = t.id;
    this.editModel = {
      title: t.title,
      description: t.description ?? '',
      priority: t.priority,
      subtasks: (t.subtasks ?? []).map(s => ({ title: s.title, completed: !!s.completed }))
    };
    this.newSubtaskTitle = '';
  }

  cancelEdit() {
    this.editingId = null;
    this.editModel = { title: '', description: '', priority: 'medium', subtasks: [] };
    this.newSubtaskTitle = '';
  }

  addSubtask() {
    const title = (this.newSubtaskTitle ?? '').trim();
    if (!title) return;
    this.editModel.subtasks = [...this.editModel.subtasks, { title, completed: false }];
    this.newSubtaskTitle = '';
  }

  removeSubtask(index: number) {
    const ok = window.confirm('¿Seguro que deseas eliminar esta subtarea?');
    if (!ok) return;

    this.editModel.subtasks = this.editModel.subtasks.filter((_, i) => i !== index);
  }

  saveEdit(original: Task) {
    if (!this.editingId) return;
    const payload: Partial<Task> = {
      title: (this.editModel.title ?? '').trim(),
      description: (this.editModel.description ?? '').trim(),
      priority: this.editModel.priority,
      subtasks: this.editModel.subtasks
    };
    if (!payload.title || payload.title.length < 3) {
      return;
    }

    this.taskService.update(this.editingId, payload).subscribe({
      next: _ => {
        this.editingId = null;
        this.editModel = { title: '', description: '', priority: 'medium', subtasks: [] };
        this.reload();
        this.taskEvents.trigger();
        this.toast.success('Tarea actualizada');
      },
      error: () => {}
    });
  }

  toggleSubtask(t: Task, index: number, completed: boolean) {
    const subtasks = (t.subtasks ?? []).map((s, i) => i === index ? { ...s, completed } : s);
    this.taskService.update(t.id, { subtasks }).subscribe({
      next: _ => {
        this.reload();
        this.taskEvents.trigger();
        this.toast?.success?.('Subtarea actualizada');
      },
      error: () => {}
    });
  }

  trackById(_: number, item: Task) { return item.id; }

  removeSubtaskInline(t: Task, index: number) {
    const ok = window.confirm('¿Seguro que deseas eliminar esta subtarea?');
    if (!ok) return;

    const subtasks = (t.subtasks ?? []).filter((_, i) => i !== index);
    this.taskService.update(t.id, { subtasks }).subscribe({
      next: _ => {
        this.reload();
        this.taskEvents.trigger();
        this.toast?.success?.('Subtarea eliminada');
      },
      error: () => {}
    });
  }

  addSubtaskInline(t: Task, title: string) {
    const name = (title ?? '').trim();
    if (!name) return;

    const subtasks = [...(t.subtasks ?? []), { title: name, completed: false }];
    this.taskService.update(t.id, { subtasks }).subscribe({
      next: _ => {
        this.reload();
        this.taskEvents.trigger();
        this.toast?.success?.('Subtarea añadida');
      },
      error: () => {}
    });
  }
}