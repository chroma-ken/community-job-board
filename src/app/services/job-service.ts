import { Injectable } from '@angular/core';


export interface Job {
  id: number;
  title: string;
  company: string;
  location: string;
  type: string;
  description: string;
  salary: string;
}


@Injectable({ providedIn: 'root' })
export class JobsService {


// sample data
  private jobs: Job[] = [
    { id: 1, title: 'Frontend Developer', company: 'TechCorp', location: 'Manila', type: 'Full-time', description: 'Develop and maintain UI components using Angular and modern web technologies.', salary: '₱40,000 - ₱60,000' },
    { id: 2, title: 'Backend Developer', company: 'DevSolutions', location: 'Cebu', type: 'Full-time', description: 'Build and optimize backend services using Node.js and database systems.', salary: '₱45,000 - ₱70,000' },
    { id: 3, title: 'UI/UX Designer', company: 'Designify', location: 'Remote', type: 'Contract', description: 'Create user-centered designs, wireframes, and prototypes for web and mobile apps.', salary: '₱30,000 - ₱50,000' },
    { id: 4, title: 'IT Support Specialist', company: 'SysCare', location: 'Davao', type: 'Part-time', description: 'Provide hardware and software technical support to clients and internal teams.', salary: '₱18,000 - ₱25,000' },
    { id: 5, title: 'Project Manager', company: 'BuildRight', location: 'Quezon City', type: 'Full-time', description: 'Oversee project timelines, client communication, and team coordination.', salary: '₱60,000 - ₱90,000' },
    { id: 6, title: 'Data Analyst', company: 'InsightWorks', location: 'Makati', type: 'Full-time', description: 'Analyze datasets, create dashboards, and provide data-driven insights for business decisions.', salary: '₱40,000 - ₱65,000' },
    { id: 7, title: 'QA Tester', company: 'QualityPlus', location: 'Remote', type: 'Contract', description: 'Test applications, report bugs, and ensure high product quality before release.', salary: '₱25,000 - ₱40,000' },
    { id: 8, title: 'Mobile App Developer', company: 'AppWave', location: 'Cebu', type: 'Full-time', description: 'Develop mobile applications using Flutter and maintain app store deployments.', salary: '₱50,000 - ₱75,000' },
    { id: 9, title: 'Network Administrator', company: 'NetSecure', location: 'Manila', type: 'Full-time', description: 'Maintain network infrastructure, monitor security, and troubleshoot connectivity issues.', salary: '₱35,000 - ₱55,000' },
    { id: 10, title: 'Content Writer', company: 'CopyCraft', location: 'Remote', type: 'Part-time', description: 'Write high-quality blog posts, technical documentation, and marketing content.', salary: '₱15,000 - ₱25,000' }
  ];

  constructor() {}

  list(filter?: { title?: string; company?: string; location?: string; type?: string }): Job[] {
    if (!filter) return this.jobs;
    return this.jobs.filter(job => {
      const matchTitle = filter.title
        ? job.title.toLowerCase().includes(filter.title.toLowerCase())
        : true;


      const matchCompany = filter.company
        ? job.company.toLowerCase().includes(filter.company.toLowerCase())
        : true;


      const matchLocation = filter.location
        ? job.location.toLowerCase().includes(filter.location.toLowerCase())
        : true;


      const matchType = filter.type
        ? job.type.toLowerCase() === filter.type.toLowerCase()
        : true;


      return matchTitle && matchCompany && matchLocation && matchType;
    });
  }

// get one job by id
  getById(id: number): Job | undefined {
    return this.jobs.find(j => j.id === id);
  }


// create a new job entry
  create(job: Omit<Job, 'id'>): Job {
    const newJob: Job = {
      id: this.jobs.length + 1,
      ...job
    };
    this.jobs.push(newJob);
    return newJob;
  }


// update an existing job
  update(id: number, updated: Partial<Job>): Job | undefined {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) return undefined;


    this.jobs[index] = {...this.jobs[index], ...updated};
    return this.jobs[index];
  }


// delete a job
  delete(id: number): boolean {
    const index = this.jobs.findIndex(j => j.id === id);
    if (index === -1) return false;


    this.jobs.splice(index, 1);
    return true;
  }
}