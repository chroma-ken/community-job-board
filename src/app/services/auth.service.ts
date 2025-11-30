import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, collection } from '@angular/fire/firestore';
import { Router } from '@angular/router';
import { UserProfile, UserRole } from '../models/user.model';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private auth = inject(Auth);
  private firestore = inject(Firestore);
  private router = inject(Router);
  
  currentUser = signal<User | null>(null);
  userProfile = signal<UserProfile | null>(null);
  isLoggedIn = signal(false);
  authError = signal<string | null>(null);
  loading = signal(false);
  
  private authReady = signal(false);

  constructor() {
    onAuthStateChanged(this.auth, async (user) => {
      this.currentUser.set(user);
      this.isLoggedIn.set(!!user);
      
      if (user) {
        await this.loadUserProfile(user.uid);
      } else {
        this.userProfile.set(null);
      }
      
      this.authReady.set(true);
    });
  }

  async waitForAuthState(): Promise<void> {
    // Wait for auth state to be ready
    while (!this.authReady()) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }

  private async loadUserProfile(uid: string): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        this.userProfile.set(userDoc.data() as UserProfile);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.loading.set(true);
    this.authError.set(null);
    
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      await new Promise(resolve => setTimeout(resolve, 500)); // Wait for auth state to update
      await this.loadUserProfile(credential.user.uid);
      this.clearError();
      this.router.navigate(['/']);
      return true;
    } catch (error: any) {
      console.error('Login error full:', error);
      const errorMsg = this.getErrorMessage(error.code || error.message);
      this.authError.set(errorMsg);
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async register(email: string, password: string, role: UserRole): Promise<boolean> {
    this.loading.set(true);
    this.authError.set(null);
    
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      const userProfile: UserProfile = {
        uid: credential.user.uid,
        email: email,
        role: role,
        savedJobs: [],
        createdAt: new Date()
      };
      
      await setDoc(doc(this.firestore, 'users', credential.user.uid), userProfile);
      this.userProfile.set(userProfile);
      
      this.clearError();
      this.router.navigate(['/']);
      return true;
    } catch (error: any) {
      this.authError.set(this.getErrorMessage(error.code));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.auth);
      this.userProfile.set(null);
      this.clearError();
      this.router.navigate(['/login']);
    } catch (error: any) {
      this.authError.set(this.getErrorMessage(error.code));
    }
  }

  hasRole(role: UserRole): boolean {
    return this.userProfile()?.role === role;
  }

  isAdmin(): boolean {
    return this.hasRole('admin');
  }

  isEmployer(): boolean {
    return this.hasRole('employer');
  }

  isApplicant(): boolean {
    return this.hasRole('applicant');
  }

  clearError(): void {
    this.authError.set(null);
  }

  private getErrorMessage(code: string): string {
    switch (code) {
      case 'auth/user-not-found':
        return 'No account found with this email.';
      case 'auth/wrong-password':
        return 'Incorrect password.';
      case 'auth/invalid-credential':
        return 'Invalid email or password.';
      case 'auth/email-already-in-use':
        return 'An account with this email already exists.';
      case 'auth/weak-password':
        return 'Password should be at least 6 characters.';
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/too-many-requests':
        return 'Too many failed attempts. Please try again later.';
      default:
        return 'An error occurred. Please try again.';
    }
  }
}
