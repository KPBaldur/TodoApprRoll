import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment.development';
import { Observable, tap } from 'rxjs';
import { User } from '../models/user.model';

interface AuthResponse {
  success: boolean;
  message?: string;
  data?: { token?: string; user?: User };
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  getToken(): string | null {
    return typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }

  register(payload: { name: string; email: string; password: string; role?: 'user' | 'admin' }): Observable<AuthResponse> {
    // El backend espera 'username', no 'name'
    return this.http.post<AuthResponse>(`${this.api}/auth/register`, {
      username: payload.name,
      email: payload.email,
      password: payload.password,
      role: payload.role
    });
  }

  login(payload: { email: string; password: string }): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.api}/auth/login`, payload).pipe(
      tap((res) => {
        const token = res.data?.token;
        const user = res.data?.user;
        if (token) localStorage.setItem('token', token);
        if (user) localStorage.setItem('user', JSON.stringify(user));
      })
    );
  }

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }
}