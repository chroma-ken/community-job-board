import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../services/jobs-service';
import { AuthService } from '../services/auth.service';
import { Job, Applicant } from '../models/job.model';
import { UserProfile } from '../models/user.model';

@Component({
  selector: 'app-employer-jobs',
  imports: [CommonModule, FormsModule],
  templateUrl: './employer-jobs.html',
  styleUrl: './employer-jobs.css'
})
export class EmployerJobs implements OnInit {
  private jobService = inject(JobsService);
  private authService = inject(AuthService);

  jobs: Job[] = [];
  allJobs: Job[] = [];
  loading = false;
  selectedJob: Job | null = null;
  selectedApplicant: Applicant | null = null;
  selectedApplicantProfile: UserProfile | null = null;
  editingJob: Job | null = null;
  isDeleting = false;
  isSaving = false;
  showDeleteConfirmModal = false;
  jobToDelete: string | null = null;
  showEditModal = false;
  editSalaryMin: string = "";
  editSalaryMax: string = "";
  sortBy: string = "date-desc";

  showAlertModal = false;
  alertMessage = '';
  showRejectConfirmModal = false;
  applicantToReject: Applicant | null = null;

  salaryOptions = [
    { value: 10000, label: "₱10,000" },
    { value: 20000, label: "₱20,000" },
    { value: 30000, label: "₱30,000" },
    { value: 40000, label: "₱40,000" },
    { value: 50000, label: "₱50,000" },
    { value: 75000, label: "₱75,000" },
    { value: 100000, label: "₱100,000" },
    { value: 150000, label: "₱150,000" },
    { value: 200000, label: "₱200,000" },
    { value: 250000, label: "₱250,000" },
    { value: 300000, label: "₱300,000+" }
  ];

  async ngOnInit() {
    await this.loadEmployerJobs();
  }

  async loadEmployerJobs() {
    this.loading = true;
    const userId = this.authService.currentUser()?.uid;
    if (userId) {
      this.allJobs = await this.jobService.getEmployerJobs(userId);
      this.applySorting();
    }
    this.loading = false;
  }

  applySorting() {
    let sorted = [...this.allJobs];

    switch (this.sortBy) {
      case 'date-desc':
        sorted.sort((a, b) => {
          const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
          const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
          return dateB - dateA;
        });
        break;
      case 'date-asc':
        sorted.sort((a, b) => {
          const dateA = a.postedDate ? new Date(a.postedDate).getTime() : 0;
          const dateB = b.postedDate ? new Date(b.postedDate).getTime() : 0;
          return dateA - dateB;
        });
        break;
      case 'title-asc':
        sorted.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case 'title-desc':
        sorted.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case 'status-asc':
        sorted.sort((a, b) => (a.status || '').localeCompare(b.status || ''));
        break;
      case 'status-desc':
        sorted.sort((a, b) => (b.status || '').localeCompare(a.status || ''));
        break;
      case 'applicants-desc':
        sorted.sort((a, b) => (b.applicants?.length || 0) - (a.applicants?.length || 0));
        break;
      case 'applicants-asc':
        sorted.sort((a, b) => (a.applicants?.length || 0) - (b.applicants?.length || 0));
        break;
    }

    this.jobs = sorted;
  }

  onSortChange() {
    this.applySorting();
  }

  viewJob(job: Job) {
    this.selectedJob = job;
    this.editingJob = null;
    this.selectedApplicant = null;
  }

  async openApplicantModal(applicant: Applicant) {
    this.selectedApplicant = applicant;
    if (applicant.userId) {
      this.selectedApplicantProfile = await this.authService.getUserProfile(applicant.userId);
    }
  }

  closeApplicantModal() {
    this.selectedApplicant = null;
    this.selectedApplicantProfile = null;
  }

  startEdit(job: Job) {
    this.editingJob = { ...job };
    this.parseSalaryRange(job.salary);
    this.showEditModal = true;
  }

  parseSalaryRange(salary: string) {
    const match = salary.match(/₱([\d,]+)\s*-\s*₱([\d,]+)/);
    if (match) {
      this.editSalaryMin = match[1].replace(/,/g, '');
      this.editSalaryMax = match[2].replace(/,/g, '');
    }
  }

  cancelEdit() {
    this.editingJob = null;
    this.showEditModal = false;
    this.editSalaryMin = "";
    this.editSalaryMax = "";
  }

  showAlert(message: string) {
    this.alertMessage = message;
    this.showAlertModal = true;
  }

  closeAlertModal() {
    this.showAlertModal = false;
    this.alertMessage = '';
  }

  async saveEdit() {
    if (!this.editingJob || !this.editingJob.id) return;
    
    if (!this.editingJob.title || !this.editingJob.location || !this.editingJob.type || !this.editingJob.description || !this.editSalaryMin || !this.editSalaryMax) {
      this.showAlert('Please fill in all fields');
      return;
    }

    const minNum = parseInt(this.editSalaryMin);
    const maxNum = parseInt(this.editSalaryMax);
    if (minNum >= maxNum) {
      this.showAlert('Minimum salary must be less than maximum salary');
      return;
    }

    this.isSaving = true;
    try {
      this.editingJob.salary = `₱${minNum.toLocaleString()} - ₱${maxNum.toLocaleString()}`;
      await this.jobService.update(this.editingJob.id, this.editingJob);
      await this.loadEmployerJobs();
      this.editingJob = null;
      this.showEditModal = false;
      this.editSalaryMin = "";
      this.editSalaryMax = "";
    } catch (error) {
      console.error('Error updating job:', error);
      this.showAlert('Failed to update job');
    } finally {
      this.isSaving = false;
    }
  }

  openDeleteConfirm(jobId: string | undefined) {
    if (!jobId) return;
    this.jobToDelete = jobId;
    this.showDeleteConfirmModal = true;
  }

  closeDeleteConfirm() {
    this.showDeleteConfirmModal = false;
    this.jobToDelete = null;
  }

  async confirmDelete() {
    if (!this.jobToDelete) return;
    
    this.isDeleting = true;
    try {
      await this.jobService.delete(this.jobToDelete);
      await this.loadEmployerJobs();
      this.selectedJob = null;
      this.editingJob = null;
      this.showDeleteConfirmModal = false;
      this.jobToDelete = null;
    } catch (error) {
      console.error('Error deleting job:', error);
      this.showAlert('Failed to delete job');
    } finally {
      this.isDeleting = false;
    }
  }

  async acceptApplicant(applicant: Applicant) {
    if (!this.selectedJob?.id || !applicant.userId) return;
    
    const success = await this.jobService.updateApplicantStatus(
      this.selectedJob.id,
      applicant.userId,
      'accepted'
    );

    if (success) {
      await this.loadEmployerJobs();
      // Refresh selectedJob reference after reload
      this.selectedJob = this.jobs.find(j => j.id === this.selectedJob?.id) || null;
      this.closeApplicantModal();
    } else {
      this.showAlert('Failed to update applicant status.');
    }
  }

  openRejectConfirm(applicant: Applicant) {
    this.applicantToReject = applicant;
    this.showRejectConfirmModal = true;
  }

  closeRejectConfirm() {
    this.showRejectConfirmModal = false;
    this.applicantToReject = null;
  }

  async confirmRejectApplicant() {
    if (!this.selectedJob?.id || !this.applicantToReject?.userId) return;

    const success = await this.jobService.removeApplicant(
      this.selectedJob.id,
      this.applicantToReject.userId
    );

    if (success) {
      await this.loadEmployerJobs();
      // Refresh selectedJob reference after reload
      this.selectedJob = this.jobs.find(j => j.id === this.selectedJob?.id) || null;
      this.closeApplicantModal();
      this.closeRejectConfirm();
    } else {
      this.showAlert('Failed to reject applicant.');
      this.closeRejectConfirm();
    }
  }

  getStatusBadgeClass(status?: string): string {
    switch (status) {
      case 'approved':
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
