import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable } from 'rxjs';
import { Task } from '../models/task.model';

interface ListResponse { success: boolean; data: { tasks: Task[]; count: number }; }
interface ItemResponse { success: boolean; data: { task: Task }; }
interface SimpleResponse { success: boolean; message?: string; }

@Injectable({ providedIn: 'root' })
export class TaskService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getTasks(): Observable<ListResponse> {
    return this.http.get<ListResponse>(`${this.api}/tasks`);
  }
  createTask(payload: Partial<Task>): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(`${this.api}/tasks`, payload);
  }
  updateTask(id: string, payload: Partial<Task>): Observable<ItemResponse> {
    return this.http.put<ItemResponse>(`${this.api}/tasks/${id}`, payload);
  }
  toggleTaskStatus(id: string): Observable<ItemResponse> {
    return this.http.patch<ItemResponse>(`${this.api}/tasks/${id}/toggle`, {});
  }
  deleteTask(id: string): Observable<SimpleResponse> {
    return this.http.delete<SimpleResponse>(`${this.api}/tasks/${id}`);
  }

  // ====== ALARMAS ======
  updateAlarm(id: string, alarm: Partial<Task['alarm']>): Observable<ItemResponse> {
    return this.http.patch<ItemResponse>(`${this.api}/tasks/${id}/alarm`, { alarm });
  }

  uploadAlarmSound(id: string, file: File): Observable<ItemResponse> {
    const form = new FormData();
    form.append('sound', file);
    return this.http.post<ItemResponse>(`${this.api}/tasks/${id}/alarm/sound`, form);
  }

  uploadAlarmImage(id: string, file: File): Observable<ItemResponse> {
    const form = new FormData();
    form.append('image', file);
    return this.http.post<ItemResponse>(`${this.api}/tasks/${id}/alarm/image`, form);
  }

  snoozeAlarm(id: string, minutes: number): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(`${this.api}/tasks/${id}/alarm/snooze`, { minutes });
  }

  stopAlarm(id: string): Observable<ItemResponse> {
    return this.http.post<ItemResponse>(`${this.api}/tasks/${id}/alarm/stop`, {});
  }
}