import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Subtask {
  title: string;
  completed?: boolean;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high';
  status: 'pending' | 'working' | 'completed' | 'archived';
  createdAt: string;
  updatedAt: string;
  completedAt?: string;
  subtasks: Subtask[];
  remember: boolean;
}

@Injectable({ providedIn: 'root' })
export class TaskService {
  private baseUrl = 'http://localhost:3000/api/tasks';

  constructor(private http: HttpClient) {}

  list(status?: Task['status']): Observable<{ success: boolean; data: { tasks: Task[]; count: number } }> {
    const url = status ? `${this.baseUrl}?status=${status}` : this.baseUrl;
    return this.http.get<{ success: boolean; data: { tasks: Task[]; count: number } }>(url);
  }

  get(id: string): Observable<{ success: boolean; data: { task: Task } }> {
    return this.http.get<{ success: boolean; data: { task: Task } }>(`${this.baseUrl}/${id}`);
  }

  create(payload: Partial<Task>): Observable<{ success: boolean; data: { task: Task } }> {
    return this.http.post<{ success: boolean; data: { task: Task } }>(this.baseUrl, payload);
  }

  update(id: string, payload: Partial<Task>): Observable<{ success: boolean; data: { task: Task } }> {
    return this.http.put<{ success: boolean; data: { task: Task } }>(`${this.baseUrl}/${id}`, payload);
  }

  toggle(id: string): Observable<{ success: boolean; data: { task: Task } }> {
    return this.http.patch<{ success: boolean; data: { task: Task } }>(`${this.baseUrl}/${id}/toggle`, {});
  }

  delete(id: string): Observable<{ success: boolean }> {
    return this.http.delete<{ success: boolean }>(`${this.baseUrl}/${id}`);
  }
}