import { Component, inject, OnInit } from '@angular/core';
import { JobsService } from '../services/jobs-service';
import { Job, ApplicationResponse } from '../models/job.model';
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
  jobTitleSearch = '';
  jobLocationSearch = '';
  jobTypeSearch = '';

  jobDetails: Job | null = null;
  showApplicationModal = false;
  isSubmitting = false;
  showConfirmation = false;
  applicationResponses: ApplicationResponse[] = [];

  showAlertModal = false;
  alertMessage = '';

  jobTypes = [
    { value: '', label: 'All Job Types' },
    { value: 'Full-Time', label: 'Full-Time' },
    { value: 'Part-Time', label: 'Part-Time' },
    { value: 'Hybrid', label: 'Hybrid' },
    { value: 'Hybrid(1 day onsite / WFH rest of the week)', label: 'Hybrid' },
    { value: 'Hybrid(2 days onsite / WFH rest of the week)', label: 'Hybrid' },
    { value: 'Hybrid(3 days onsite / WFH rest of the week)', label: 'Hybrid' },
    { value: 'Full-Time(Remote)', label: 'Full-Time-Remote' },
    { value: 'Part-Time(Remote)', label: 'Part-Time-Remote' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Remote', label: 'Remote' },
  ];

  filters = {
    title: '',
    company: '',
    location: '',
    type: '',
  };

  async ngOnInit() {
    await this.jobService.loadJobs();
    this.jobs = this.jobService.list();
  }

  searchJob() {
    this.filters = {
      title: this.jobTitleSearch,
      company: '',
      location: this.jobLocationSearch,
      type: this.jobTypeSearch,
    };
    this.jobs = this.jobService.list(this.filters);
  }

  resetFilters() {
    this.jobTitleSearch = '';
    this.jobLocationSearch = '';
    this.jobTypeSearch = '';
    this.filters = { title: '', company: '', location: '', type: '' };
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
    if (!jobId || !this.authService.isLoggedIn()) return;
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

    // Pull dynamic questions from the selected job
    const job = this.jobService.getById(jobId);
    if (!job) return;

    this.applicationResponses = (job.applicationQuestions || []).map(q => ({
      question: q.question,
      answer: '',
    }));

    this.showApplicationModal = true;
    this.showConfirmation = false;
  }

  closeApplicationModal() {
    this.showApplicationModal = false;
    this.showConfirmation = false;
    this.applicationResponses = [];
  }

  showAlert(message: string) {
    this.alertMessage = message;
    this.showAlertModal = true;
  }

  closeAlertModal() {
    this.showAlertModal = false;
    this.alertMessage = '';
  }

  async submitApplication() {
    const allRequiredAnswered = this.applicationResponses.every(r => r.answer.trim().length > 0);

    if (!allRequiredAnswered) {
      this.showAlert('Please answer all required questions.');
      return;
    }

    const jobId = this.jobDetails?.id;
    if (!jobId) {
      this.showAlert('Unable to submit application. Please try again.');
      return;
    }

    this.isSubmitting = true;

    const success = await this.jobService.applyJob(jobId, this.applicationResponses);

    this.isSubmitting = false;

    if (success) {
      this.showConfirmation = true;
      await this.jobService.loadJobs();
      this.jobs = this.jobService.list(this.filters);
      if (this.jobDetails?.id === jobId) {
        this.viewJob(jobId);
      }
    } else {
      this.showAlert('Failed to apply. You may have already applied to this job.');
      this.closeApplicationModal();
    }
  }
}
