import { Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { JobsService } from '../services/jobs-service';
import { Router } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { EMPLOYER_SEED_DATA } from '../seeds/employer-seed';

@Component({
  selector: 'app-create-job',
  imports: [FormsModule, CommonModule],
  templateUrl: './create-job.html',
  styleUrl: './create-job.css',
})
export class CreateJob implements OnInit {
  private jobService = inject(JobsService);
  private router = inject(Router);
  private authService = inject(AuthService);

  title: string = '';
  company: string = '';
  location: string = '';
  type: string = '';
  description: string = '';
  salaryMin: string = '';
  salaryMax: string = '';
  salary: string = '';
  error: string = '';
  showConfirmModal = false;
  isSubmitting = false;

  salaryOptions = [
    { value: 10000, label: '₱10,000' },
    { value: 20000, label: '₱20,000' },
    { value: 30000, label: '₱30,000' },
    { value: 40000, label: '₱40,000' },
    { value: 50000, label: '₱50,000' },
    { value: 75000, label: '₱75,000' },
    { value: 100000, label: '₱100,000' },
    { value: 150000, label: '₱150,000' },
    { value: 200000, label: '₱200,000' },
    { value: 250000, label: '₱250,000' },
    { value: 300000, label: '₱300,000+' },
  ];

  ngOnInit() {
    // Get company from user profile or derive from email
    const profile = this.authService.userProfile();

    // Admins use "jobboard" as company
    if (profile?.role === 'admin') {
      this.company = 'JobBoard';
    } else if (profile?.company) {
      this.company = profile.company;
    } else if (profile?.email) {
      // Derive company from email based on seed data
      const employer = EMPLOYER_SEED_DATA.find((emp) => emp.email === profile.email);
      if (employer) {
        this.company = employer.company;
      }
    }
    console.log('Company loaded:', this.company);
  }

  isAdmin(): boolean {
    return this.authService.userProfile()?.role === 'admin';
  }

  openConfirmModal() {
    this.error = '';

    // Validate user-editable fields
    if (
      !this.title ||
      !this.location ||
      !this.type ||
      !this.description ||
      !this.salaryMin ||
      !this.salaryMax
    ) {
      this.error = 'Please fill in all fields';
      return;
    }

    // Format salary range
    const minNum = parseInt(this.salaryMin);
    const maxNum = parseInt(this.salaryMax);
    if (minNum >= maxNum) {
      this.error = 'Minimum salary must be less than maximum salary';
      return;
    }

    this.salary = `₱${minNum.toLocaleString()} - ₱${maxNum.toLocaleString()}`;

    // Ensure company is set from profile
    const profile = this.authService.userProfile();
    if (profile?.role === 'admin') {
      this.company = 'jobboard';
    } else if (profile?.company) {
      this.company = profile.company;
      console.log('Company set to:', this.company);
    } else {
      console.warn('Company not found in profile:', profile);
    }

    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
  }

  async confirmCreateJob() {
    this.isSubmitting = true;
    this.error = '';

    const userId = this.authService.currentUser()?.uid;
    if (!userId) {
      this.error = 'User not authenticated';
      this.isSubmitting = false;
      return;
    }

    const newJob = {
      title: this.title,
      company: this.company,
      location: this.location,
      type: this.type,
      description: this.description,
      salary: this.salary,
      postedBy: userId,
    };

    try {
      const created = await this.jobService.create(newJob);
      if (created) {
        console.log('Job created successfully:', created);
        this.router.navigate(['/employer-jobs']);
      } else {
        this.error = 'Failed to create job';
        this.isSubmitting = false;
      }
    } catch (err) {
      console.error('Error creating job:', err);
      this.error = 'Error creating job: ' + (err instanceof Error ? err.message : String(err));
      this.isSubmitting = false;
    }
  }
}
