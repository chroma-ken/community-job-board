import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../services/jobs-service';
import { AuthService } from '../services/auth.service';
import { Job } from '../models/job.model';

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
  loading = false;
  selectedJob: Job | null = null;
  editingJob: Job | null = null;
  isDeleting = false;
  isSaving = false;
  showDeleteConfirmModal = false;
  jobToDelete: string | null = null;
  showEditModal = false;
  editSalaryMin: string = "";
  editSalaryMax: string = "";

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
      this.jobs = await this.jobService.getEmployerJobs(userId);
    }
    this.loading = false;
  }

  viewJob(job: Job) {
    this.selectedJob = job;
    this.editingJob = null;
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

  async saveEdit() {
    if (!this.editingJob || !this.editingJob.id) return;
    
    if (!this.editingJob.title || !this.editingJob.location || !this.editingJob.type || !this.editingJob.description || !this.editSalaryMin || !this.editSalaryMax) {
      alert('Please fill in all fields');
      return;
    }

    const minNum = parseInt(this.editSalaryMin);
    const maxNum = parseInt(this.editSalaryMax);
    if (minNum >= maxNum) {
      alert('Minimum salary must be less than maximum salary');
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
      alert('Failed to update job');
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
      alert('Failed to delete job');
    } finally {
      this.isDeleting = false;
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
