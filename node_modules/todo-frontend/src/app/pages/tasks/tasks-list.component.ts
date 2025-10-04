import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TaskService } from '../../services/task.service';
import { Task, Subtask } from '../../models/task.model';
import { NavbarComponent } from '../../components/navbar/navbar.component';
import { environment } from '../../environments/environment.development';

@Component({
  selector: 'app-tasks-list',
  standalone: true,
  imports: [CommonModule, FormsModule, NavbarComponent],
  templateUrl: './tasks-list.component.html',
  styleUrls: ['./tasks-list.component.css']
})
export class TasksListComponent implements OnInit, OnDestroy {
  // Convierte rutas relativas '/uploads/...' a absolutas 'http://.../uploads/...'
  assetUrl(url?: string | null): string {
    if (!url) return '';
    const u = String(url);
    if (u.startsWith('http://') || u.startsWith('https://') || u.startsWith('blob:') || u.startsWith('data:')) {
      return u;
    }
    // Origin = environment.apiUrl sin el sufijo '/api'
    const origin = environment.apiUrl.replace(/\/api\/?$/, '');
    if (u.startsWith('/uploads')) {
      return `${origin}${u}`;
    }
    return u;
  }

  tasks: Task[] = [];
  loading = false;
  error = '';
  showAlarmConfig: Record<string, boolean> = {};
  activeAlarms: Record<string, boolean> = {};
  private alarmTimers: Record<string, any> = {};
  // Contadores por tarea
  countdowns: Record<string, string> = {};
  private countdownTicker: any;
  form: Partial<Task> = { title: '', description: '', priority: 'medium' };
  editingId: string | null = null;

  // Filtro por estado
  selectedStatus: 'all' | 'pending' | 'working' | 'completed' = 'all';

  // Filtro de historial (rango de fechas)
  historyStart: string = '';
  historyEnd: string = '';
  // Campo temporal para nuevas subtareas (por tarea)
  newSubtaskTitle: Record<string, string> = {};

  // Contadores
  get pendingCount(): number {
    return this.tasks.filter(t => t.status === 'pending').length;
  }
  get workingCount(): number {
    return this.tasks.filter(t => t.status === 'working').length;
  }

  // Tareas visibles según el filtro
  get visibleTasks(): Task[] {
    return this.selectedStatus === 'all'
      ? this.tasks
      : this.tasks.filter(t => t.status === this.selectedStatus);
  }

  // Historial de completadas ordenado por fecha de término (desc)
  get completedHistory(): Task[] {
    const start = this.parseDateStart(this.historyStart);
    const end = this.parseDateEnd(this.historyEnd);

    return this.tasks
      .filter(t => t.status === 'completed')
      .filter(t => {
        const d = new Date(t.completedAt ?? t.updatedAt ?? '').getTime();
        if (Number.isNaN(d)) {
          return !start && !end;
        }
        return (!start || d >= start) && (!end || d <= end);
      })
      .sort((a, b) => {
        const ad = new Date(a.completedAt ?? a.updatedAt ?? '').getTime();
        const bd = new Date(b.completedAt ?? b.updatedAt ?? '').getTime();
        return bd - ad;
      });
  }

  // Agrupación por estado (para la vista principal si sigues usando grupos)
  get grouped(): { pending: Task[]; working: Task[]; completed: Task[] } {
    const groups = { pending: [] as Task[], working: [] as Task[], completed: [] as Task[] };
    for (const t of this.visibleTasks) {
      groups[t.status].push(t);
    }
    return groups;
  }

  constructor(private taskService: TaskService) {}

  ngOnInit(): void {
    this.loadTasks();
    // Iniciar intervalo del contador
    this.countdownTicker = setInterval(() => this.updateCountdowns(), 1000);
  }

  ngOnDestroy(): void {
    // Limpiar intervalo global y timers por tarea
    if (this.countdownTicker) {
      clearInterval(this.countdownTicker);
      this.countdownTicker = null;
    }
    Object.keys(this.alarmTimers).forEach((id) => this.clearTimer(id));
  }

  loadTasks() {
    this.loading = true;
    this.taskService.getTasks().subscribe({
      next: (res) => {
        const tasks = res.data.tasks;
        this.tasks = tasks;
        this.loading = false;
        // Preparar alarmas ya configuradas
        for (const t of tasks) this.setupTimer(t);
        // Inicializar contadores
        this.updateCountdowns();
      },
      error: (e) => { this.error = e.error?.message || 'Error loading tasks'; this.loading = false; }
    });
  }

  createTask() {
    if (!this.form.title) return;
    this.taskService.createTask(this.form).subscribe({
      next: () => { this.form = { title: '', description: '', priority: 'medium' }; this.loadTasks(); },
      error: (e) => { this.error = e.error?.message || 'Error creating task'; }
    });
  }

  updateTask(task: Task) {
    this.taskService.updateTask(task.id, {
      title: task.title,
      description: task.description,
      priority: task.priority,
      status: task.status,
      subtasks: task.subtasks
    }).subscribe({
      next: () => this.loadTasks(),
      error: (e) => { this.error = e.error?.message || 'Error updating task'; }
    });
  }

  // Ciclo de estado: pending -> working -> completed -> pending
  addSubtask(task: Task) {
    const title = (this.newSubtaskTitle[task.id] || '').trim();
    if (!title) return;
    const newSub: Subtask = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      completed: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    task.subtasks = Array.isArray(task.subtasks) ? task.subtasks.slice() : [];
    task.subtasks.push(newSub);
    this.newSubtaskTitle[task.id] = '';
    // Guardar solo subtareas para eficiencia
    this.taskService.updateTask(task.id, { subtasks: task.subtasks }).subscribe({
      next: () => this.loadTasks(),
      error: (e) => { this.error = e.error?.message || 'Error al agregar subtarea'; }
    });
  }

  toggleSubtask(task: Task, sub: Subtask) {
    sub.completed = !sub.completed;
    sub.updatedAt = new Date().toISOString();

    // Ajustar estado automáticamente según subtareas
    const newStatus = this.computeStatusFromSubtasks(task);
    const payload: Partial<Task> = { subtasks: task.subtasks };
    if (newStatus && newStatus !== task.status) {
      task.status = newStatus;
      payload.status = newStatus;
    }

    this.taskService.updateTask(task.id, payload).subscribe({
      next: () => this.loadTasks(),
      error: (e) => { this.error = e.error?.message || 'Error al actualizar subtarea'; }
    });
  }

  // Marcar o desmarcar todas las subtareas
  markAllSubtasks(task: Task, completed: boolean) {
    task.subtasks = Array.isArray(task.subtasks) ? task.subtasks.slice() : [];
    if (task.subtasks.length === 0) return;

    for (const s of task.subtasks) {
      s.completed = completed;
      s.updatedAt = new Date().toISOString();
    }

    // Ajustar estado automáticamente
    const newStatus = this.computeStatusFromSubtasks(task);
    const payload: Partial<Task> = { subtasks: task.subtasks };
    if (newStatus && newStatus !== task.status) {
      task.status = newStatus;
      payload.status = newStatus;
    }

    this.taskService.updateTask(task.id, payload).subscribe({
      next: () => this.loadTasks(),
      error: (e) => { this.error = e.error?.message || 'Error al actualizar subtareas'; }
    });
  }

  // Determinar estado de la tarea a partir de sus subtareas
  private computeStatusFromSubtasks(task: Task): Task['status'] | null {
    const subs = Array.isArray(task.subtasks) ? task.subtasks : [];
    if (subs.length === 0) return null;

    const allDone = subs.every(s => s.completed);
    return allDone ? 'completed' : 'working';
  }

  private nextStatus(current: Task['status']): Task['status'] {
    return current === 'pending' ? 'working' : current === 'working' ? 'completed' : 'pending';
  }

  nextActionLabel(current: Task['status']): string {
    const next = this.nextStatus(current);
    switch (next) {
      case 'working': return 'Marcar como Trabajando';
      case 'completed': return 'Marcar como Completada';
      default: return 'Marcar como Pendiente';
    }
  }

  toggle(task: Task) {
    const next = this.nextStatus(task.status);
    this.taskService.updateTask(task.id, { status: next }).subscribe({
      next: () => this.loadTasks(),
      error: (e) => { this.error = e.error?.message || 'Error toggling task'; }
    });
  }

  // Confirmación personalizada de eliminación
  showDeleteConfirm = false;
  taskToDelete: Task | null = null;

  confirmDelete(task: Task): void {
    this.taskToDelete = task;
    this.showDeleteConfirm = true;
  }

  cancelDelete(): void {
    this.showDeleteConfirm = false;
    this.taskToDelete = null;
  }

  performDelete(): void {
    if (!this.taskToDelete) return;
    this.taskService.deleteTask(this.taskToDelete.id).subscribe({
      next: () => { this.showDeleteConfirm = false; this.taskToDelete = null; this.loadTasks(); },
      error: (e) => { this.error = e.error?.message || 'Error al eliminar tarea'; }
    });
  }

  // Eliminar tarea con confirmación (sigue disponible si quieres llamarlo desde otro lugar)
  deleteTask(task: Task) {
    if (!confirm('¿Eliminar esta tarea?')) return;
    this.taskService.deleteTask(task.id).subscribe({
      next: () => this.loadTasks(),
      error: (e) => { this.error = e.error?.message || 'Error al eliminar tarea'; }
    });
  }

  statusLabel(status: Task['status']): string {
    switch (status) {
      case 'pending': return 'pendiente';
      case 'working': return 'trabajando';
      case 'completed': return 'completada';
      default: return status;
    }
  }

  clearHistoryFilter(): void {
    this.historyStart = '';
    this.historyEnd = '';
  }

  private parseDateStart(v?: string): number | null {
    if (!v) return null;
    const d = new Date(v);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }

  private parseDateEnd(v?: string): number | null {
    if (!v) return null;
    const d = new Date(v);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }

  toggleAlarmUI(task: Task) {
    this.ensureAlarmStructure(task);
    this.showAlarmConfig[task.id] = !this.showAlarmConfig[task.id];
  }

  onSoundSelected(task: Task, evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.taskService.uploadAlarmSound(task.id, file).subscribe({
      next: (res) => { task.alarm = res.data.task.alarm; },
      error: (e) => this.error = e.error?.message || 'Error subiendo sonido'
    });
  }

  onImageSelected(task: Task, evt: Event) {
    const file = (evt.target as HTMLInputElement).files?.[0];
    if (!file) return;
    this.taskService.uploadAlarmImage(task.id, file).subscribe({
      next: (res) => { task.alarm = res.data.task.alarm; },
      error: (e) => this.error = e.error?.message || 'Error subiendo imagen'
    });
  }

  saveAlarm(task: Task) {
    const alarm = task.alarm!;
    if (!this.isScheduleValid(alarm)) {
      this.error = 'Completa la configuración de la alarma antes de guardar';
      return;
    }

    const next = this.computeNextTrigger(alarm);
    const toSave = { ...alarm, enabled: true, nextTriggerAt: next };

    this.taskService.updateAlarm(task.id, toSave).subscribe({
      next: (res) => {
        task.alarm = res.data.task.alarm;
        this.setupTimer(task);
        this.updateCountdowns();
        this.error = '';
      },
      error: (e) => this.error = e.error?.message || 'Error guardando alarma'
    });
  }

  snooze(task: Task, minutes: number) {
    this.taskService.snoozeAlarm(task.id, minutes).subscribe({
      next: (res) => {
        task.alarm = res.data.task.alarm;
        this.setupTimer(task);
        this.stopLocalPlayback(task);
      },
      error: (e) => this.error = e.error?.message || 'Error al posponer alarma'
    });
  }

  stop(task: Task) {
    this.taskService.stopAlarm(task.id).subscribe({
      next: (res) => {
        task.alarm = res.data.task.alarm;
        this.clearTimer(task.id);
        this.stopLocalPlayback(task);
      },
      error: (e) => this.error = e.error?.message || 'Error al detener alarma'
    });
  }

  private setupTimer(task: Task) {
    this.clearTimer(task.id);
    const next = task.alarm?.nextTriggerAt;
    if (!task.alarm?.enabled || !next) return;
    const ms = new Date(next).getTime() - Date.now();
    if (ms <= 0) return this.triggerAlarm(task);
    this.alarmTimers[task.id] = setTimeout(() => this.triggerAlarm(task), ms);
  }

  private clearTimer(taskId: string) {
    const t = this.alarmTimers[taskId];
    if (t) { clearTimeout(t); delete this.alarmTimers[taskId]; }
  }

  private triggerAlarm(task: Task) {
    this.activeAlarms[task.id] = true;
    try {
      const audioEl = document.getElementById(`audio-${task.id}`) as HTMLAudioElement | null;
      if (audioEl && task.alarm?.soundUrl) {
        audioEl.src = this.assetUrl(task.alarm.soundUrl);
        audioEl.load();
        audioEl.play().catch(() => {
          // Si el navegador bloquea auto-play, al menos el control queda listo para reproducir manualmente
        });
      }
    } catch (e) {
      // Silenciar errores de reproducción
    }
    const alarm = task.alarm || {};
    const next = this.computeNextTrigger(alarm, true);
    const toSave = { ...alarm, nextTriggerAt: next };
    this.taskService.updateAlarm(task.id, toSave).subscribe({
      next: (res) => { task.alarm = res.data.task.alarm; this.setupTimer(task); },
      error: () => {}
    });
  }

  private stopLocalPlayback(task: Task) {
    this.activeAlarms[task.id] = false;
    const audio = document.getElementById(`audio-${task.id}`) as HTMLAudioElement | null;
    if (audio) { audio.pause(); audio.currentTime = 0; }
  }

  // Switch: activar/desactivar alarma
  toggleAlarmEnabled(task: Task, enabled: boolean) {
    const alarm = task.alarm || {};
    let next = alarm.nextTriggerAt ?? null;

    if (enabled) {
      // Recalcular próximo disparo
      next = this.computeNextTrigger({ ...alarm, enabled: true }) ?? null;
    } else {
      // Desactivar y limpiar
      this.clearTimer(task.id);
      this.stopLocalPlayback(task);
      next = null;
    }

    this.taskService.updateAlarm(task.id, { ...alarm, enabled, nextTriggerAt: next }).subscribe({
      next: (res) => {
        task.alarm = res.data.task.alarm;
        if (enabled) {
          this.setupTimer(task);
        }
        this.updateCountdowns();
      },
      error: (e) => this.error = e.error?.message || 'Error al actualizar estado de la alarma'
    });
  }

  // Actualizar contadores (cada segundo)
  private updateCountdowns() {
    const tasks = this.tasks || [];
    const now = Date.now();

    for (const t of tasks) {
      const a = t.alarm;
      if (this.activeAlarms[t.id]) {
        this.countdowns[t.id] = 'Sonando';
        continue;
      }
      if (!a?.enabled || !a?.nextTriggerAt) {
        this.countdowns[t.id] = '-';
        continue;
      }
      const diff = new Date(a.nextTriggerAt).getTime() - now;
      this.countdowns[t.id] = diff > 0 ? this.formatDuration(diff) : '00:00';
    }
  }

  private formatDuration(ms: number): string {
    const totalSec = Math.floor(ms / 1000);
    const h = Math.floor(totalSec / 3600);
    const m = Math.floor((totalSec % 3600) / 60);
    const s = totalSec % 60;
    const pad = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${pad(h)}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
  }

  private computeNextTrigger(alarm: Task['alarm'] = {}, afterTrigger = false): string | null {
    if (!alarm?.schedule || alarm.enabled === false) return null;
    const s = alarm.schedule;
    const now = new Date();
    if (s.type === 'interval' && s.intervalMinutes) {
      const ref = afterTrigger ? now : now;
      return new Date(ref.getTime() + s.intervalMinutes * 60 * 1000).toISOString();
    }
    if (s.type === 'daily' && s.time) {
      const [hh, mm] = s.time.split(':').map(Number);
      const next = new Date();
      next.setHours(hh, mm, 0, 0);
      if (next.getTime() <= now.getTime()) next.setDate(next.getDate() + 1);
      return next.toISOString();
    }
    if (s.type === 'weekly' && typeof s.dayOfWeek === 'number' && s.time) {
      const [hh, mm] = s.time.split(':').map(Number);
      const next = new Date();
      next.setHours(hh, mm, 0, 0);
      const diff = (s.dayOfWeek - next.getDay() + 7) % 7;
      if (diff === 0 && next.getTime() <= now.getTime()) next.setDate(next.getDate() + 7);
      else next.setDate(next.getDate() + diff);
      return next.toISOString();
    }
    if (s.type === 'once' && s.dateTime) {
      const dt = new Date(s.dateTime);
      return dt.getTime() > now.getTime() ? dt.toISOString() : null;
    }
    return null;
  }

  // Asegura que la estructura de la alarma exista para el binding
  private ensureAlarmStructure(task: Task): void {
    if (!task.alarm) {
      task.alarm = { enabled: false, schedule: { type: 'interval', intervalMinutes: 5 } };
      return;
    }
    if (!task.alarm.schedule) {
      task.alarm.schedule = { type: 'interval', intervalMinutes: 5 };
      return;
    }
    // Normaliza valores por tipo
    const s = task.alarm.schedule;
    if (s.type === 'interval' && (s.intervalMinutes == null || s.intervalMinutes <= 0)) {
      s.intervalMinutes = 5;
    }
    if (s.type === 'daily' && !s.time) {
      s.time = '09:00';
    }
    if (s.type === 'weekly') {
      if (typeof s.dayOfWeek !== 'number') s.dayOfWeek = 1; // Lunes
      if (!s.time) s.time = '09:00';
    }
  }

  // Handlers para template: evitan [(ngModel)] sobre rutas opcionales
  onScheduleTypeChange(task: Task, type: 'interval' | 'daily' | 'weekly' | 'once') {
    this.ensureAlarmStructure(task);
    task.alarm!.schedule!.type = type;

    // Reset de campos según tipo
    const s = task.alarm!.schedule!;
    if (type === 'interval') {
      s.intervalMinutes = s.intervalMinutes && s.intervalMinutes > 0 ? s.intervalMinutes : 5;
      delete s.time; delete s.dayOfWeek; delete s.dateTime;
    } else if (type === 'daily') {
      s.time = s.time || '09:00';
      delete s.intervalMinutes; delete s.dayOfWeek; delete s.dateTime;
    } else if (type === 'weekly') {
      s.dayOfWeek = typeof s.dayOfWeek === 'number' ? s.dayOfWeek : 1;
      s.time = s.time || '09:00';
      delete s.intervalMinutes; delete s.dateTime;
    } else if (type === 'once') {
      const iso = new Date(Date.now() + 5 * 60 * 1000).toISOString();
      s.dateTime = s.dateTime || iso;
      delete s.intervalMinutes; delete s.dayOfWeek; delete s.time;
    }
  }

  onIntervalChange(task: Task, minutes: any) {
    this.ensureAlarmStructure(task);
    const val = Number(minutes);
    task.alarm!.schedule!.intervalMinutes = isNaN(val) || val <= 0 ? 1 : val;
  }

  onDailyTimeChange(task: Task, time: string) {
    this.ensureAlarmStructure(task);
    task.alarm!.schedule!.time = time;
  }

  onWeeklyDayChange(task: Task, day: any) {
    this.ensureAlarmStructure(task);
    const d = Number(day);
    task.alarm!.schedule!.dayOfWeek = isNaN(d) ? 0 : d;
  }

  onWeeklyTimeChange(task: Task, time: string) {
    this.ensureAlarmStructure(task);
    task.alarm!.schedule!.time = time;
  }

  onOnceDateTimeChange(task: Task, localValue: string) {
    this.ensureAlarmStructure(task);
    task.alarm!.schedule!.dateTime = this.fromLocalDateTime(localValue);
  }

  // Helpers para datetime-local
  toLocalDateTime(iso?: string | null): string {
    if (!iso) return '';
    const d = new Date(iso);
    const pad = (n: number) => String(n).padStart(2, '0');
    const y = d.getFullYear();
    const m = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hh = pad(d.getHours());
    const mm = pad(d.getMinutes());
    return `${y}-${m}-${day}T${hh}:${mm}`;
  }

  fromLocalDateTime(local: string): string {
    // Convierte 'YYYY-MM-DDTHH:mm' a ISO
    const d = new Date(local);
    return d.toISOString();
  }

  // Valida que el schedule esté completo según el tipo
  isScheduleValid(alarm?: Task['alarm']): boolean {
    if (!alarm?.schedule) return false;
    const s = alarm.schedule;
    switch (s.type) {
      case 'interval':
        return typeof s.intervalMinutes === 'number' && s.intervalMinutes > 0;
      case 'daily':
        return !!s.time;
      case 'weekly':
        return typeof s.dayOfWeek === 'number' && s.dayOfWeek >= 0 && s.dayOfWeek <= 6 && !!s.time;
      case 'once':
        return !!s.dateTime && new Date(s.dateTime).getTime() > Date.now();
      default:
        return false;
    }
  }
}