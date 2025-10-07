import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'todo-header',
  standalone: true,
  imports: [CommonModule],
  template: `
    <header class="app-header">
      <h1 class="app-title">TodoApp</h1>
    </header>
  `
})
export class HeaderComponent {}