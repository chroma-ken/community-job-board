import { Injectable, inject } from '@angular/core';
import { Auth, createUserWithEmailAndPassword, signOut } from '@angular/fire/auth';
import { Firestore, doc, setDoc, collection, getDocs, query, where } from '@angular/fire/firestore';
import { UserProfile } from '../models/user.model';

export const ADMIN_SEED_DATA = [
  { email: 'admin@example.com' }
];

const ADMIN_PASSWORD = 'Admin123!';

@Injectable({ providedIn: 'root' })
export class AdminSeedService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);

  async initializeAdmins(): Promise<void> {
    try {
      for (const admin of ADMIN_SEED_DATA) {
        try {
          const credential = await createUserWithEmailAndPassword(
            this.auth,
            admin.email,
            ADMIN_PASSWORD
          );

          const userProfile: UserProfile = {
            uid: credential.user.uid,
            email: admin.email,
            role: 'admin',
            savedJobs: [],
            createdAt: new Date()
          };

          await setDoc(doc(this.firestore, 'users', credential.user.uid), userProfile);
          console.log(`✓ Created admin: ${admin.email}`);
        } catch (error: any) {
          if (error.code === 'auth/email-already-in-use') {
            console.log(`✓ Admin exists: ${admin.email}`);
          } else {
            console.error(`✗ Error creating admin:`, error.message);
          }
        }
      }
      
      console.log('%c=== ADMIN TEST ACCOUNT ===', 'color: red; font-size: 14px; font-weight: bold;');
      console.log(`Email: admin@example.com`);
      console.log(`Password: ${ADMIN_PASSWORD}`);
    } catch (error) {
      console.error('Admin initialization error:', error);
    }
  }
}
