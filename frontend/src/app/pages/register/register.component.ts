import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
// ... existing code ...
import { NavbarComponent } from '../../components/navbar/navbar.component';
// ... existing code ...

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, NavbarComponent],
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.css']
})
export class RegisterComponent {
  // ... existing code ...
  name = '';
  email = '';
  password = '';
  role: 'user' | 'admin' = 'user';
  error = '';

  constructor(private auth: AuthService, private router: Router) {}

  submit() {
    this.error = '';
    this.auth.register({ name: this.name, email: this.email, password: this.password, role: this.role }).subscribe({
      next: () => this.router.navigate(['/login']),
      error: (e) => this.error = e.error?.message || 'Register failed'
    });
  }
  // ... existing code ...
}