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

  title = '';
  company = '';
  location = '';
  type = '';
  description = '';
  salaryMin = '';
  salaryMax = '';
  salary = '';
  error = '';
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

  // Selected questions for the job application
  applicationQuestions: { question: string }[] = [];

  // Premade + custom questions inside dropdown
  dropdownQuestions: { text: string; selected: boolean; isCustom?: boolean }[] = [
    { text: 'Why do you want to work here?', selected: false },
    { text: 'Describe your strengths and weaknesses.', selected: false },
    { text: 'What are your salary expectations?', selected: false },
    { text: 'Where do you see yourself in 5 years?', selected: false },
    { text: 'What motivates you?', selected: false },
  ];

  newDropdownQuestion = '';
  showDropdown = false;

  ngOnInit() {
    const profile = this.authService.userProfile();
    if (profile?.role === 'admin') this.company = 'JobBoard';
    else if (profile?.company) this.company = profile.company;
    else if (profile?.email) {
      const employer = EMPLOYER_SEED_DATA.find(emp => emp.email === profile.email);
      if (employer) this.company = employer.company;
    }
  }

  isAdmin(): boolean {
    return this.authService.userProfile()?.role === 'admin';
  }

  toggleDropdown() {
    this.showDropdown = !this.showDropdown;
  }

  toggleQuestionSelection(question: { text: string; selected: boolean }) {
    question.selected = !question.selected;
  }

  addCustomDropdownQuestion() {
    const trimmed = this.newDropdownQuestion.trim();
    if (!trimmed) return;

    if (!this.dropdownQuestions.some(q => q.text.toLowerCase() === trimmed.toLowerCase())) {
      this.dropdownQuestions.push({ text: trimmed, selected: true, isCustom: true });
    }

    this.newDropdownQuestion = '';
  }

  deleteDropdownQuestion(index: number) {
    if (this.dropdownQuestions[index]?.isCustom) {
      this.dropdownQuestions.splice(index, 1);
    }
  }

  addSelectedQuestionsToForm() {
    this.dropdownQuestions.forEach(q => {
      if (q.selected && !this.applicationQuestions.some(aq => aq.question === q.text)) {
        this.applicationQuestions.push({ question: q.text });
        q.selected = false; // reset checkbox
      }
    });
  }

  removeQuestion(index: number) {
    this.applicationQuestions.splice(index, 1);
  }

  openConfirmModal() {
    this.error = '';
    if (!this.title || !this.location || !this.type || !this.description || !this.salaryMin || !this.salaryMax) {
      this.error = 'Please fill in all fields';
      return;
    }

    const minNum = parseInt(this.salaryMin);
    const maxNum = parseInt(this.salaryMax);
    if (minNum >= maxNum) {
      this.error = 'Minimum salary must be less than maximum salary';
      return;
    }

    this.salary = `₱${minNum.toLocaleString()} - ₱${maxNum.toLocaleString()}`;
    const profile = this.authService.userProfile();
    if (profile?.role === 'admin') this.company = 'jobboard';
    else if (profile?.company) this.company = profile.company;
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

    const filteredQuestions = this.applicationQuestions
      .map(q => q.question.trim())
      .filter(q => q.length > 0)
      .map(q => ({ question: q, answer: '' }));

    const newJob = {
      title: this.title,
      company: this.company,
      location: this.location,
      type: this.type,
      description: this.description,
      salary: this.salary,
      postedBy: userId,
      applicationQuestions: filteredQuestions,
    };

    try {
      const created = await this.jobService.create(newJob);
      if (created) this.router.navigate(['/employer-jobs']);
      else this.error = 'Failed to create job';
    } catch (err) {
      this.error = 'Error creating job: ' + (err instanceof Error ? err.message : String(err));
    } finally {
      this.isSubmitting = false;
    }
  }
}
``
