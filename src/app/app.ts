import { Component, signal, inject, OnInit } from '@angular/core';
import { RouterOutlet, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { JobsService } from './services/jobs-service';

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

  async ngOnInit() {
    await this.jobsService.initializeSampleData();
    await this.jobsService.loadJobs();
  }
}
