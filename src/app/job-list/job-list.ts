import { Component, inject, OnInit } from '@angular/core';
import { JobsService } from '../services/jobs-service';
import { Job, ApplicationResponse } from '../models/job.model';
import { AuthService } from '../services/auth.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-job-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './job-list.html',
  styleUrl: './job-list.css',
})
export class JobList implements OnInit {
  private jobService = inject(JobsService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  authService = inject(AuthService);

  jobs: Job[] = [];
  jobDetails: Job | null = null;

  loading = false;

  jobTitleSearch = '';
  jobLocationSearch = '';
  jobTypeSearch = '';

  filters = {
    title: '',
    company: '',
    location: '',
    type: '',
  };

  showApplicationModal = false;
  showConfirmation = false;
  showAlertModal = false;

  alertMessage = '';
  isSubmitting = false;

  applicationResponses: ApplicationResponse[] = [];

  jobTypes = [
    { value: '', label: 'All Job Types' },
    { value: 'Full-Time', label: 'Full-Time' },
    { value: 'Part-Time', label: 'Part-Time' },
    { value: 'Hybrid', label: 'Hybrid' },
   { value: 'Hybrid(1 day onsite / WFH rest of the week)', label: 'Hybrid (1 Day Onsite)' },
    { value: 'Hybrid(2 days onsite / WFH rest of the week)', label: 'Hybrid (2 Days Onsite)' },
    { value: 'Hybrid(3 days onsite / WFH rest of the week)', label: 'Hybrid (3 Days Onsite)' },
    { value: 'Full-Time(Remote)', label: 'Full-Time-Remote' },
    { value: 'Part-Time(Remote)', label: 'Part-Time-Remote' },
    { value: 'Contract', label: 'Contract' },
    { value: 'Remote', label: 'Remote' },
  ];

async ngOnInit() {
    // CHANGE: Set loading to true before fetching data
    this.loading = true;

    try {
      // Load jobs first
      await this.jobService.loadJobs();
      this.jobs = this.jobService.list();
    } finally {
      // CHANGE: Set loading to false after data is loaded (or if it fails)
      this.loading = false;
    }

    // Check if login/signup redirected user back to apply automatically
    const returnJobId = this.route.snapshot.queryParamMap.get('applyJobId');
    if (returnJobId) {
      const job = this.jobService.getById(returnJobId);

      if (job) {
        this.viewJob(returnJobId);

        // Auto-open application modal only if logged in
        if (this.authService.isLoggedIn()) {
          this.autoOpenApplication(returnJobId);
        }
      }
    }
  }

  // Auto-open application modal after login/signup redirect
  autoOpenApplication(jobId: string) {
    const job = this.jobService.getById(jobId);
    if (!job) return;

    this.applicationResponses = (job.applicationQuestions || []).map(q => ({
      question: q.question,
      answer: '',
    }));

    this.showApplicationModal = true;
    this.showConfirmation = false;
  }

  // Searching functionality
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

  // View job details
  viewJob(id: string | undefined) {
    if (!id) return;
    this.jobDetails = this.jobService.getById(id) || null;
  }

  // Saved jobs
  isJobSaved(jobId: string | undefined) {
    return jobId ? this.jobService.isJobSaved(jobId) : false;
  }

  async toggleSaveJob(jobId: string | undefined, event: Event) {
    event.stopPropagation();

    if (!jobId) return;
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { redirect: 'savedJobs' },
      });
      return;
    }

    await this.jobService.toggleSaveJob(jobId);
  }

  canSaveJobs() {
    return this.authService.isLoggedIn() && this.authService.isApplicant();
  }

  // Handle applying to job
  async applyToJob(jobId: string | undefined, event: Event) {
    event.stopPropagation();
    if (!jobId) return;

    // If user is unlogged → send to login/signup and preserve job ID
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login'], {
        queryParams: { applyJobId: jobId },
      });
      return;
    }

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
    const allAnswered = this.applicationResponses.every(r => r.answer.trim());
    if (!allAnswered) {
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
      this.showAlert('Failed to apply. You may have already applied.');
      this.closeApplicationModal();
    }
  }

  formatDescription(text: string): string {
  if (!text) return '';

  const lines = text.split('\n');

  let html = '';
  let inList = false;

  for (let line of lines) {
    line = line.trim();
    if (line.startsWith('-') || line.startsWith('*')) {
      const content = line.slice(1).trim();
      if (!inList) {
        html += '<ul>';
        inList = true;
      }
      html += `<li>${content}</li>`;
    } else {
      if (inList) {
        html += '</ul>';
        inList = false;
      }
      if (line) html += `<p>${line}</p>`;
    }
  }

  if (inList) html += '</ul>';
  return html;
}

}
