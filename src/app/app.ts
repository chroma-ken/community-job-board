import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { JobsService } from './services/jobs-service';
import { EmployerSeedService } from './seeds/employer-seed';
import { ApplicantSeedService } from './seeds/applicant-seed';
import { AdminSeedService } from './seeds/admin-seed';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, RouterModule, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('community-job-board');
  protected authService = inject(AuthService);
  private jobsService = inject(JobsService);
  private employerSeedService = inject(EmployerSeedService);
  private applicantSeedService = inject(ApplicantSeedService);
  private adminSeedService = inject(AdminSeedService);

  async ngOnInit() {
    await this.adminSeedService.initializeAdmins();
    await this.employerSeedService.initializeEmployers();
    await this.applicantSeedService.initializeApplicants();
    await this.jobsService.initializeSampleData();
    await this.jobsService.loadJobs();
  }
}
