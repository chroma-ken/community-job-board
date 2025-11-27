import { Routes } from '@angular/router';
import { JobList } from './job-list/job-list';
import { JobApplicationModal } from './job-application-modal/job-application-modal';
import { CreateJob } from './create-job/create-job';

export const routes: Routes = [
    {path: '', redirectTo:'job-list', pathMatch: 'full'},
    {path: 'job-list', component:JobList},
    {path: 'job-application', component:JobApplicationModal},
    {path: 'create-job', component:CreateJob},


];