import { Routes } from '@angular/router';
import { TasksPageComponent } from './pages/tasks-page.component';
import { HistoryPageComponent } from './pages/history-page.component';
import { MediaPageComponent } from './pages/media-page.component';
import { AlarmPageComponent } from './pages/alarm-page.component';
import { SettingsPageComponent } from './pages/settings-page.component';

export const appRoutes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'tasks' },
  { path: 'tasks', component: TasksPageComponent },
  { path: 'history', component: HistoryPageComponent },
  { path: 'media', component: MediaPageComponent },
  { path: 'alarm', component: AlarmPageComponent },
  { path: 'settings', component: SettingsPageComponent },
  { path: '**', redirectTo: 'tasks' }
];
