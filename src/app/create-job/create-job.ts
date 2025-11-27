import { Component, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Firestore, collection, collectionData, addDoc, doc, deleteDoc, updateDoc } from '@angular/fire/firestore';

@Component({
  selector: 'app-create-job',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './create-job.html',
  styleUrls: ['./create-job.css'],
})
export class CreateJob {

  // Signals for job form
  title = signal('');
  location = signal('');
  type = signal('');
  salary = signal('');
  description = signal('');
  editingId = signal<string | null>(null);

  companies: any[] = [];          // List of company documents
  jobs: any[] = [];               // Jobs for selected company
  companyIdValue: string = '';    // Bound to dropdown

  constructor(private firestore: Firestore) {
    // Load companies
    const companyCollection = collection(this.firestore, 'companies');
    collectionData(companyCollection, { idField: 'id' }).subscribe(data => {
      this.companies = data;

      // Set default company to first in list
      if (data.length > 0) {
        this.companyIdValue = data[0].id;
        this.loadJobs(this.companyIdValue);
      }
    });
  }

  // Load jobs for selected company
  loadJobs(companyId: string) {
    const jobsCollection = collection(this.firestore, `companies/${companyId}/jobs`);
    collectionData(jobsCollection, { idField: 'id' }).subscribe(data => {
      this.jobs = data;
    });
  }

  // Reset form
  resetForm() {
    this.title.set('');
    this.location.set('');
    this.type.set('');
    this.salary.set('');
    this.description.set('');
    this.editingId.set(null);
  }

  // Add or update job
  addJob() {
    const currentCompanyId = this.companyIdValue;
    if (!currentCompanyId) {
      alert('Please select a company!');
      return;
    }

    const jobDetails = {
      title: this.title(),
      location: this.location(),
      type: this.type(),
      salary: this.salary(),
      description: this.description(),
    };

    const jobsCollection = collection(this.firestore, `companies/${currentCompanyId}/jobs`);

    if (this.editingId()) {
      const jobDoc = doc(this.firestore, `companies/${currentCompanyId}/jobs/${this.editingId()}`);
      updateDoc(jobDoc, jobDetails);
      this.resetForm();
      return;
    }

    addDoc(jobsCollection, jobDetails);
    this.resetForm();
  }

  // Start editing a job
  startEditJob(job: any) {
    this.title.set(job.title);
    this.location.set(job.location);
    this.type.set(job.type);
    this.salary.set(job.salary);
    this.description.set(job.description);
    this.editingId.set(job.id);
  }

  // Delete a job
  deleteJob(jobId: string) {
    const currentCompanyId = this.companyIdValue;
    if (!currentCompanyId) return;

    const jobDoc = doc(this.firestore, `companies/${currentCompanyId}/jobs/${jobId}`);
    deleteDoc(jobDoc);

    if (this.editingId() === jobId) this.resetForm();
  }

  // Handle company selection change
  onCompanyChange(newCompanyId: string) {
    this.companyIdValue = newCompanyId;
    this.loadJobs(newCompanyId);
    this.resetForm();
  }

  // Get selected company name for display
  get selectedCompanyName(): string {
    const company = this.companies.find(c => c.id === this.companyIdValue);
    return company ? company.id : ''; // using ID as display
  }
}
