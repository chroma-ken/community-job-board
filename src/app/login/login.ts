import { Component, inject, signal, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';
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
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  firstName = signal('');
  lastName = signal('');
  companyName = signal('');
  email = signal('');
  password = signal('');
  selectedRole = signal<UserRole>('applicant');
  isRegisterMode = signal(false);
  showPassword = signal(false);
  acceptedTerms = signal(false);
  showTerms = signal(false);
  showResetConfirmation = signal(false);
  resetInProgress = signal(false);

  loading = this.authService.loading;
  authError = this.authService.authError;

  // IMPORTANT: store redirect job
  private returnJobId: string | null = null;

  ngOnInit() {
    this.authService.clearError();
    this.resetForm();

    // Read ?applyJobId=123
    this.returnJobId = this.route.snapshot.queryParamMap.get('applyJobId');
  }

  ngOnDestroy() {
    this.authService.clearError();
  }

  toggleMode() {
    this.isRegisterMode.update(x => !x);
    this.authService.clearError();
  }

  resetForm() {
    this.email.set('');
    this.password.set('');
    this.selectedRole.set('applicant');
    this.acceptedTerms.set(false);
    this.showTerms.set(false);
  }

  setRole(role: UserRole) {
    this.selectedRole.set(role);
  }

  async onForgotPassword() {
    const email = this.email().trim();
    this.authService.clearError();

    if (!email) {
      this.authService.authError.set('Please enter your email address to reset your password.');
      return;
    }

    this.resetInProgress.set(true);
    try {
      await this.authService.sendPasswordReset(email);
      this.showResetConfirmation.set(true);
    } finally {
      this.resetInProgress.set(false);
    }
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

    if (this.isRegisterMode()) {
      if (!this.acceptedTerms()) {
        this.authService.authError.set('You must agree to the Terms and Conditions to create an account.');
        return;
      }
    }

    let success: boolean;
    if (this.isRegisterMode()) {
      success = await this.authService.register(firstName, lastName, companyName, email, password, this.selectedRole());
    } else {
      success = await this.authService.login(email, password);
    }

    if (success) {
      this.resetForm();

      if (this.returnJobId) {
        // Redirect to job-list with job ID for applicants returning to apply
        this.router.navigate(['/job-list'], {
          queryParams: { applyJobId: this.returnJobId }
        });
      } else {
        // Redirect based on user role
        const userRole = this.authService.userProfile()?.role;
        if (userRole === 'admin') {
          this.router.navigate(['/admin']);
        } else if (userRole === 'employer') {
          this.router.navigate(['/employer-jobs']);
        } else {
          this.router.navigate(['/job-list']);
        }
      }
    }
  }
}
