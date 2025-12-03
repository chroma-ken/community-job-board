import { Injectable, inject, signal } from '@angular/core';
import { 
  Firestore, 
  doc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove,
  collection,
  query,
  where,
  getDocs,
  addDoc,
  deleteDoc,
  setDoc,
  getDoc,
  writeBatch,
  Timestamp
} from '@angular/fire/firestore';
import { AuthService } from './auth.service';
import { Job } from '../models/job.model';

@Injectable({ providedIn: 'root' })
export class JobsService {
  private firestore = inject(Firestore);
  private authService = inject(AuthService);
  
  jobs = signal<Job[]>([]);
  loading = signal(false);

  async initializeSampleData(): Promise<void> {
    await this.loadJobs();
  }

  async loadJobs(): Promise<void> {
    this.loading.set(true);
    try {
      await this.migrateJobTypes();
      const jobsCollection = collection(this.firestore, 'jobs');
      // Load all jobs (approved or without status field), filter out explicitly rejected jobs
      const snapshot = await getDocs(jobsCollection);
      
      const loadedJobs: Job[] = snapshot.docs
        .map(doc => {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            postedDate: data['postedDate']?.toDate ? data['postedDate'].toDate() : data['postedDate']
          } as Job;
        })
        .filter(job => job.status !== 'rejected'); // Hide only rejected jobs
      
      this.jobs.set(loadedJobs);
    } catch (error) {
      console.error('Error loading jobs:', error);
      this.jobs.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  private async migrateJobTypes(): Promise<void> {
    try {
      const jobsCollection = collection(this.firestore, 'jobs');
      const snapshot = await getDocs(jobsCollection);
      
      let migratedCount = 0;
      
      for (const jobDoc of snapshot.docs) {
        const data = jobDoc.data();
        const type = data['type'];
        let newType = type;
        
        if (type === 'Full Time') {
          newType = 'Full-Time';
        } else if (type === 'Part Time') {
          newType = 'Part-Time';
        }
        
        if (newType !== type) {
          await updateDoc(doc(this.firestore, 'jobs', jobDoc.id), {
            type: newType
          });
          console.log(`[Migrate Job Types] Updated "${type}" → "${newType}"`);
          migratedCount++;
        }
      }
      
      if (migratedCount > 0) {
        console.log(`%c✓ Migrated ${migratedCount} jobs to new type format`, 'color: purple; font-weight: bold;');
      }
    } catch (error) {
      console.error('Job type migration error:', error);
    }
  }

  list(filter?: { title?: string; company?: string; location?: string; type?: string }): Job[] {
    const allJobs = this.jobs();
    if (!filter) return allJobs;
    
    return allJobs.filter(job => {
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

  getById(id: string): Job | undefined {
    return this.jobs().find(j => j.id === id);
  }

  async getAllJobs(): Promise<Job[]> {
    try {
      const jobsCollection = collection(this.firestore, 'jobs');
      const snapshot = await getDocs(jobsCollection);

      const allJobs: Job[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          postedDate: data['postedDate']?.toDate ? data['postedDate'].toDate() : data['postedDate'],
          applicants: (data['applicants'] || []).map((app: any) => ({
            ...app,
            appliedAt: app.appliedAt?.toDate ? app.appliedAt.toDate() : app.appliedAt
          }))
        } as Job;
      });

      return allJobs;
    } catch (error) {
      console.error('Error loading all jobs:', error);
      return [];
    }
  }

  async create(job: Omit<Job, 'id'>): Promise<Job | null> {
    try {
      const jobsCollection = collection(this.firestore, 'jobs');
      const now = Timestamp.now();
      const jobData = {
        ...job,
        postedDate: now,
        status: 'pending'
      };
      
      console.log('Creating job with data:', jobData);
      const docRef = await addDoc(jobsCollection, jobData);
      console.log('Job created with ID:', docRef.id);
      
      const newJob: Job = {
        id: docRef.id,
        ...job,
        postedDate: now.toDate(),
        status: 'pending'
      };
      
      const currentJobs = this.jobs();
      this.jobs.set([...currentJobs, newJob]);
      
      return newJob;
    } catch (error) {
      console.error('Error creating job:', error);
      throw error;
    }
  }

  async update(id: string, updated: Partial<Job>): Promise<Job | null> {
    try {
      const jobDocRef = doc(this.firestore, 'jobs', id);
      await updateDoc(jobDocRef, updated);
      
      const currentJobs = this.jobs();
      const index = currentJobs.findIndex(j => j.id === id);
      if (index !== -1) {
        const updatedJob = { ...currentJobs[index], ...updated };
        const newJobs = [...currentJobs];
        newJobs[index] = updatedJob;
        this.jobs.set(newJobs);
        return updatedJob;
      }
      return null;
    } catch (error) {
      console.error('Error updating job:', error);
      return null;
    }
  }

  async delete(id: string): Promise<boolean> {
    try {
      const jobDocRef = doc(this.firestore, 'jobs', id);
      await deleteDoc(jobDocRef);
      
      const currentJobs = this.jobs();
      this.jobs.set(currentJobs.filter(j => j.id !== id));
      return true;
    } catch (error) {
      console.error('Error deleting job:', error);
      return false;
    }
  }

  isJobSaved(jobId: string): boolean {
    const savedJobs = this.authService.userProfile()?.savedJobs || [];
    return savedJobs.includes(jobId);
  }

  async saveJob(jobId: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        savedJobs: arrayUnion(jobId)
      });
      
      const currentProfile = this.authService.userProfile();
      if (currentProfile) {
        const updatedSavedJobs = [...(currentProfile.savedJobs || []), jobId];
        this.authService.userProfile.set({
          ...currentProfile,
          savedJobs: updatedSavedJobs
        });
      }
    } catch (error) {
      console.error('Error saving job:', error);
    }
  }

  async unsaveJob(jobId: string): Promise<void> {
    const user = this.authService.currentUser();
    if (!user) return;

    try {
      const userDocRef = doc(this.firestore, 'users', user.uid);
      await updateDoc(userDocRef, {
        savedJobs: arrayRemove(jobId)
      });
      
      const currentProfile = this.authService.userProfile();
      if (currentProfile) {
        const updatedSavedJobs = (currentProfile.savedJobs || []).filter(id => id !== jobId);
        this.authService.userProfile.set({
          ...currentProfile,
          savedJobs: updatedSavedJobs
        });
      }
    } catch (error) {
      console.error('Error unsaving job:', error);
    }
  }

  async toggleSaveJob(jobId: string): Promise<void> {
    if (this.isJobSaved(jobId)) {
      await this.unsaveJob(jobId);
    } else {
      await this.saveJob(jobId);
    }
  }

  async getEmployerJobs(employerId: string): Promise<Job[]> {
    try {
      console.log('Loading jobs for employer:', employerId);
      const jobsCollection = collection(this.firestore, 'jobs');
      const q = query(jobsCollection, where('postedBy', '==', employerId));
      const snapshot = await getDocs(q);
      
      console.log('Found', snapshot.docs.length, 'jobs for employer');
      const employerJobs: Job[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          postedDate: data['postedDate']?.toDate ? data['postedDate'].toDate() : data['postedDate'],
          applicants: (data['applicants'] || []).map((app: any) => ({
            ...app,
            appliedAt: app.appliedAt?.toDate ? app.appliedAt.toDate() : app.appliedAt
          }))
        } as Job;
      });
      
      console.log('Mapped employer jobs:', employerJobs);
      return employerJobs;
    } catch (error) {
      console.error('Error loading employer jobs:', error);
      return [];
    }
  }

  async applyJob(jobId: string, responses?: { question: string; answer: string }[]): Promise<boolean> {
    const user = this.authService.currentUser();
    if (!user) return false;

    try {
      const jobDocRef = doc(this.firestore, 'jobs', jobId);
      const jobSnapshot = await getDoc(jobDocRef);

      if (!jobSnapshot.exists()) {
        console.error('Job not found:', jobId);
        return false;
      }

      const existingApplicants = (jobSnapshot.data()['applicants'] || []) as any[];
      const alreadyApplied = existingApplicants.some(app => app.userId === user.uid);

      if (alreadyApplied) {
        console.warn('User has already applied to this job');
        return false;
      }

      const userProfile = await this.authService.getUserProfile(user.uid);
      const applicantName = userProfile 
        ? `${userProfile.firstName || ''} ${userProfile.lastName || ''}`.trim() 
        : '';

      const applicant = {
        userId: user.uid,
        email: user.email,
        name: applicantName || user.email,
        appliedAt: Timestamp.now(),
        status: 'pending',
        responses: responses || []
      };

      await updateDoc(jobDocRef, {
        applicants: arrayUnion(applicant)
      });

      await this.saveJob(jobId);

      console.log('Successfully applied to job:', jobId);
      return true;
    } catch (error) {
      console.error('Error applying to job:', error);
      return false;
    }
  }

  async updateApplicantStatus(
    jobId: string,
    applicantUserId: string,
    status: 'accepted' | 'rejected'
  ): Promise<boolean> {
    try {
      const jobDocRef = doc(this.firestore, 'jobs', jobId);
      const snapshot = await getDoc(jobDocRef);

      if (!snapshot.exists()) {
        console.error('Job not found when updating applicant status:', jobId);
        return false;
      }

      const data = snapshot.data();
      const applicants = (data['applicants'] || []) as any[];

      const updatedApplicants = applicants.map(applicant => {
        if (applicant.userId === applicantUserId) {
          return {
            ...applicant,
            status
          };
        }
        return applicant;
      });

      await updateDoc(jobDocRef, {
        applicants: updatedApplicants
      });

      return true;
    } catch (error) {
      console.error('Error updating applicant status:', error);
      return false;
    }
  }

  async removeApplicant(jobId: string, applicantUserId: string): Promise<boolean> {
    try {
      const jobDocRef = doc(this.firestore, 'jobs', jobId);
      const snapshot = await getDoc(jobDocRef);

      if (!snapshot.exists()) {
        console.error('Job not found when removing applicant:', jobId);
        return false;
      }

      const data = snapshot.data();
      const applicants = (data['applicants'] || []) as any[];

      const updatedApplicants = applicants.filter(
        applicant => applicant.userId !== applicantUserId
      );

      await updateDoc(jobDocRef, {
        applicants: updatedApplicants
      });

      console.log('Successfully removed applicant from job:', jobId);
      return true;
    } catch (error) {
      console.error('Error removing applicant:', error);
      return false;
    }
  }
}
