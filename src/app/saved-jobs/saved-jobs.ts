import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { JobsService } from '../services/jobs-service';
import { Job } from '../models/job.model';

@Component({
  selector: 'app-saved-jobs',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './saved-jobs.html',
  styleUrl: './saved-jobs.css'
})
export class SavedJobs implements OnInit {
  private authService = inject(AuthService);
  private jobsService = inject(JobsService);

  savedJobs = signal<Job[]>([]);
  loading = signal(false);

  ngOnInit() {
    this.loadSavedJobs();
  }

  loadSavedJobs() {
    this.loading.set(true);
    const savedJobIds = this.authService.userProfile()?.savedJobs || [];
    const allJobs = this.jobsService.list();
    const saved = allJobs.filter(job => job.id && savedJobIds.includes(job.id));
    this.savedJobs.set(saved);
    this.loading.set(false);
  }

  async removeSavedJob(jobId: string | undefined) {
    if (jobId) {
      await this.jobsService.unsaveJob(jobId);
      this.loadSavedJobs();
    }
  }
}
