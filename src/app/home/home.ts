import { Component, inject, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

@Component({
  selector: 'app-home',
  standalone: true,
  template: ''
})
export class Home implements OnInit {
  private authService = inject(AuthService);
  private router = inject(Router);

  ngOnInit() {
    const profile = this.authService.userProfile();
    
    if (profile?.role === 'employer') {
      this.router.navigate(['/employer-jobs']);
    } else if (profile?.role === 'admin'){
      this.router.navigate(['/admin'])
    } else {
      this.router.navigate(['/job-list']);
    }
  }
}
