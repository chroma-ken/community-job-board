import { Routes } from '@angular/router';
import { JobList } from './job-list/job-list';
import { CreateJob } from './create-job/create-job';
import { Login } from './login/login';
import { AdminDashboard } from './admin/admin-dashboard';
import { SavedJobs } from './saved-jobs/saved-jobs';
import { AppliedJobs } from './applied-jobs/applied-jobs';
import { Home } from './home/home';
import { EmployerJobs } from './employer-jobs/employer-jobs';
import { Profile } from './profile/profile';
import { UserManagement } from './user-management/user-management';
import { employerGuard, adminGuard } from './guards/role.guard';
import { authGuard } from './guards/auth.guard';

export const routes: Routes = [
  {path: "", component: Home},
  {path: "job-list", component: JobList},
  {path: "create-job", component: CreateJob, canActivate: [employerGuard]},
  {path: "employer-jobs", component: EmployerJobs, canActivate: [employerGuard]},
  {path: "login", component: Login},
  {path: "admin", component: AdminDashboard, canActivate: [adminGuard]},
  {path: "user-management", component: UserManagement, canActivate: [adminGuard]},
  {path: "saved-jobs", component: SavedJobs, canActivate: [authGuard]},
  {path: "applied-jobs", component: AppliedJobs, canActivate: [authGuard]},
  {path: "profile", component: Profile, canActivate: [authGuard]}
];
