import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { UserProfile } from '../models/user.model';

export const APPLICANT_SEED_DATA = [
  { email: 'john.smith@example.com', name: 'John Smith' },
  { email: 'maria.garcia@example.com', name: 'Maria Garcia' },
  { email: 'david.chen@example.com', name: 'David Chen' },
  { email: 'sarah.johnson@example.com', name: 'Sarah Johnson' },
  { email: 'michael.brown@example.com', name: 'Michael Brown' },
  { email: 'emma.wilson@example.com', name: 'Emma Wilson' },
  { email: 'james.lee@example.com', name: 'James Lee' },
  { email: 'sophia.martinez@example.com', name: 'Sophia Martinez' },
  { email: 'robert.taylor@example.com', name: 'Robert Taylor' },
  { email: 'olivia.anderson@example.com', name: 'Olivia Anderson' }
];

const APPLICANT_PASSWORD = 'Applicant123!';

@Injectable({ providedIn: 'root' })
export class ApplicantSeedService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  async initializeApplicants(): Promise<void> {
    try {
      for (const applicant of APPLICANT_SEED_DATA) {
        try {
          const credential = await createUserWithEmailAndPassword(
            this.auth,
            applicant.email,
            APPLICANT_PASSWORD
          );

          const userProfile: UserProfile = {
            uid: credential.user.uid,
            email: applicant.email,
            role: 'applicant',
            savedJobs: [],
            createdAt: new Date()
          };

          await setDoc(doc(this.firestore, 'users', credential.user.uid), userProfile);
          console.log(`✓ Created applicant: ${applicant.name}`);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            console.log(`✓ Applicant exists: ${applicant.name}`);
          } else {
            console.error(`✗ Error creating ${applicant.name}:`, error.message);
          }
        }
      }
      
      console.log('%c=== APPLICANT TEST ACCOUNTS ===', 'color: blue; font-size: 14px; font-weight: bold;');
      console.log(`Password: ${APPLICANT_PASSWORD}`);
      APPLICANT_SEED_DATA.forEach(app => console.log(`${app.name}: ${app.email}`));
    } catch (error) {
      console.error('Applicant initialization error:', error);
    }
  }
}
