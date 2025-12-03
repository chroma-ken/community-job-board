import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { JobsService } from '../services/jobs-service';
import { Job } from '../models/job.model';

@Component({
  selector: 'app-applied-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './applied-jobs.html',
  styleUrl: './applied-jobs.css'
})
export class AppliedJobs implements OnInit {
  private authService = inject(AuthService);
  private jobsService = inject(JobsService);

  appliedJobs = signal<Array<Job & { applicationStatus?: string }>>([]);
  loading = signal(false);

  async ngOnInit() {
    await this.loadAppliedJobs();
  }

  async loadAppliedJobs() {
    this.loading.set(true);
    const userId = this.authService.currentUser()?.uid;

    if (userId) {
      const allJobs = await this.jobsService.getAllJobs();
      const applied = allJobs
        .filter(job =>
          job.applicants?.some(applicant => 
            applicant.userId === userId && applicant.status !== 'rejected'
          )
        )
        .map(job => {
          const applicant = job.applicants?.find(a => a.userId === userId);
          return {
            ...job,
            applicationStatus: applicant?.status || 'pending'
          };
        });

      this.appliedJobs.set(applied);
    }

    this.loading.set(false);
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'accepted':
        return 'bg-success';
      case 'pending':
        return 'bg-warning text-dark';
      case 'rejected':
        return 'bg-danger';
      default:
        return 'bg-secondary';
    }
  }
}
