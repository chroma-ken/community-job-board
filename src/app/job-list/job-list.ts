import { Component, inject, OnInit } from '@angular/core';
import { JobsService } from '../services/jobs-service';
import { Job } from '../models/job.model';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-job-list',
  imports: [CommonModule, FormsModule],
  templateUrl: './job-list.html',
  styleUrl: './job-list.css',
})
export class JobList implements OnInit {
  private jobService = inject(JobsService);
  private router = inject(Router);
  authService = inject(AuthService);

  jobs: Job[] = [];
  jobTitleSearch = "";
  jobLocationSearch = "";
  jobTypeSearch = "";

  jobDetails: Job | null = null;

  jobTypes = [
    { value: "", label: "All Job Types" },
    { value: "Full-Time", label: "Full-Time" },
    { value: "Part-Time", label: "Part-Time" },
    { value: "Contract", label: "Contract" },
    { value: "Remote", label: "Remote" }
  ];

  filters = {
    title: "",
    company: "",
    location: "",
    type: ""
  };

  async ngOnInit() {
    await this.jobService.loadJobs();
    this.jobs = this.jobService.list();
  }

  searchJob() {
    this.filters = {
      title: this.jobTitleSearch,
      company: "",
      location: this.jobLocationSearch,
      type: this.jobTypeSearch
    };
    this.jobs = this.jobService.list(this.filters);
  }

  resetFilters() {
    this.jobTitleSearch = "";
    this.jobLocationSearch = "";
    this.jobTypeSearch = "";
    this.filters = {
      title: "",
      company: "",
      location: "",
      type: ""
    };
    this.jobs = this.jobService.list();
  }

  viewJob(id: string | undefined) {
    if (!id) return;
    this.jobDetails = this.jobService.getById(id) || null;
  }

  isJobSaved(jobId: string | undefined): boolean {
    if (!jobId) return false;
    return this.jobService.isJobSaved(jobId);
  }

  async toggleSaveJob(jobId: string | undefined, event: Event) {
    event.stopPropagation();
    if (!jobId || !this.authService.isLoggedIn()) {
      return;
    }
    await this.jobService.toggleSaveJob(jobId);
  }

  canSaveJobs(): boolean {
    return this.authService.isLoggedIn() && this.authService.isApplicant();
  }

  async applyToJob(jobId: string | undefined, event: Event) {
    event.stopPropagation();
    if (!jobId) return;

    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }

    const success = await this.jobService.applyJob(jobId);
    if (success) {
      alert('Successfully applied to the job!');
      // Refresh the job details to show the application
      if (this.jobDetails?.id === jobId) {
        this.viewJob(jobId);
      }
    } else {
      alert('Failed to apply. You may have already applied to this job.');
    }
  }
}
