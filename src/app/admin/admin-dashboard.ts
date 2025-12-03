import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { JobsService } from '../services/jobs-service';
import { Job } from '../models/job.model';

@Component({
  selector: 'app-admin-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-dashboard.html',
  styleUrl: './admin-dashboard.css'
})
export class AdminDashboard implements OnInit {
  private jobsService = inject(JobsService);

  allJobs = signal<Job[]>([]);
  selectedJob = signal<Job | null>(null);
  loading = signal(false);
  actionMessage = signal<{type: 'success' | 'error', text: string} | null>(null);

  // Confirmation modal
  showConfirmModal = false;
  confirmModalTitle = '';
  confirmModalMessage = '';
  confirmModalAction: (() => Promise<void>) | null = null;
  jobToAction: Job | null = null;

  // Search filters
  searchTitle = signal<string>('');
  searchCompany = signal<string>('');
  searchLocation = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  
  pageSizeOptions = [5, 10, 25, 50];

  // Computed filtered and paginated jobs
  filteredJobs = computed(() => {
    let filtered = this.allJobs();
    
    const title = this.searchTitle().toLowerCase();
    const company = this.searchCompany().toLowerCase();
    const location = this.searchLocation().toLowerCase();

    if (title) {
      filtered = filtered.filter(job => job.title.toLowerCase().includes(title));
    }
    if (company) {
      filtered = filtered.filter(job => job.company.toLowerCase().includes(company));
    }
    if (location) {
      filtered = filtered.filter(job => job.location.toLowerCase().includes(location));
    }

    return filtered;
  });

  totalPages = computed(() => Math.ceil(this.filteredJobs().length / this.pageSize()));

  paginatedJobs = computed(() => {
    const filtered = this.filteredJobs();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return filtered.slice(start, end);
  });

  ngOnInit() {
    this.loadJobs();
  }

  loadJobs() {
    this.loading.set(true);
    this.allJobs.set(this.jobsService.list());
    this.currentPage.set(1); // Reset to first page
    this.loading.set(false);
  }

  resetFilters() {
    this.searchTitle.set('');
    this.searchCompany.set('');
    this.searchLocation.set('');
    this.currentPage.set(1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  changePageSize(size: number) {
    this.pageSize.set(size);
    this.currentPage.set(1);
  }

  selectJob(job: Job) {
    this.selectedJob.set(job);
    this.actionMessage.set(null);
  }

  closeModal() {
    this.selectedJob.set(null);
    this.actionMessage.set(null);
  }

  async approveJob(job: Job) {
    if (job.id) {
      await this.jobsService.update(job.id, { status: 'approved' });
      this.loadJobs();
      this.showMessage('success', `Job "${job.title}" has been approved.`);
      this.closeModal();
    }
  }

  openRejectConfirm(job: Job) {
    this.jobToAction = job;
    this.confirmModalTitle = 'Reject Job';
    this.confirmModalMessage = `Are you sure you want to reject "${job.title}"?`;
    this.confirmModalAction = async () => {
      if (this.jobToAction?.id) {
        await this.jobsService.delete(this.jobToAction.id);
        this.loadJobs();
        this.showMessage('success', `Job "${this.jobToAction.title}" has been removed.`);
        this.closeModal();
      }
    };
    this.showConfirmModal = true;
  }

  openDeleteConfirm(job: Job) {
    this.jobToAction = job;
    this.confirmModalTitle = 'Delete Job';
    this.confirmModalMessage = `Are you sure you want to delete "${job.title}"? This action cannot be undone.`;
    this.confirmModalAction = async () => {
      if (this.jobToAction?.id) {
        await this.jobsService.delete(this.jobToAction.id);
        this.loadJobs();
        this.showMessage('success', `Job "${this.jobToAction.title}" has been deleted.`);
        this.closeModal();
      }
    };
    this.showConfirmModal = true;
  }

  closeConfirmModal() {
    this.showConfirmModal = false;
    this.confirmModalTitle = '';
    this.confirmModalMessage = '';
    this.confirmModalAction = null;
    this.jobToAction = null;
  }

  async executeConfirmAction() {
    if (this.confirmModalAction) {
      await this.confirmModalAction();
    }
    this.closeConfirmModal();
  }

  showMessage(type: 'success' | 'error', text: string) {
    this.actionMessage.set({ type, text });
    setTimeout(() => this.actionMessage.set(null), 3000);
  }
}
