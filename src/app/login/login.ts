import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { UserRole } from '../models/user.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  templateUrl: './login.html',
  styleUrl: './login.css'
})
export class Login implements OnInit, OnDestroy {
  private authService = inject(AuthService);

  firstName = signal('')
  lastName = signal('')
  companyName = signal('')
  email = signal('');
  password = signal('');
  selectedRole = signal<UserRole>('applicant');
  isRegisterMode = signal(false);

  loading = this.authService.loading;
  authError = this.authService.authError;

  ngOnInit() {
    this.authService.clearError();
    this.resetForm();
  }

  ngOnDestroy() {
    this.authService.clearError();
  }

  toggleMode() {
    this.isRegisterMode.update(value => !value);
    this.authService.clearError();
  }

  resetForm() {
    this.email.set('');
    this.password.set('');
    this.selectedRole.set('applicant');
  }

  setRole(role: UserRole) {
    this.selectedRole.set(role);
  }

  async onSubmit() {
    const email = this.email();
    const password = this.password();
    const firstName = this.firstName();
    const lastName = this.lastName();
    const companyName = this.companyName();

    if (!email || !password) {
      this.authService.authError.set('Please fill in all fields.');
      return;
    }

    let success: boolean;
    if (this.isRegisterMode()) {
      success = await this.authService.register(firstName, lastName, companyName, email, password, this.selectedRole());
    } else {
      success = await this.authService.login(email, password);
    }

    if (success) {
      this.resetForm();
    }
  }
}
