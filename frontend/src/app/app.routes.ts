import { Routes } from '@angular/router';
import { authGuard } from './guards/auth.guard';
import { TasksListComponent } from './pages/tasks/tasks-list.component';
import { LoginComponent } from './pages/login/login.component';
import { RegisterComponent } from './pages/register/register.component';

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  { path: 'tasks', canActivate: [authGuard], loadComponent: () => Promise.resolve(TasksListComponent) },
  { path: 'login', loadComponent: () => Promise.resolve(LoginComponent) },
  { path: 'register', loadComponent: () => Promise.resolve(RegisterComponent) },
  { path: '**', redirectTo: 'tasks' }
];
