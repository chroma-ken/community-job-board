import { Injectable, inject, signal } from '@angular/core';
import { Auth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User, updateEmail as fbUpdateEmail, updatePassword as fbUpdatePassword, sendPasswordResetEmail, sendEmailVerification } from '@angular/fire/auth';
import { Firestore, doc, setDoc, getDoc, collection, updateDoc } from '@angular/fire/firestore';
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

  async getUserProfile(uid: string): Promise<UserProfile | null> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      const userDoc = await getDoc(userDocRef);
      
      if (userDoc.exists()) {
        return userDoc.data() as UserProfile;
      }
      return null;
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  async login(email: string, password: string): Promise<boolean> {
    this.loading.set(true);
    this.authError.set(null);
    
    try {
      const credential = await signInWithEmailAndPassword(this.auth, email, password);
      
      const userDocRef = doc(this.firestore, 'users', credential.user.uid);
      const userDoc = await getDoc(userDocRef);
      
      if (!userDoc.exists()) {
        await signOut(this.auth);
        this.authError.set('This account has been deleted. Please contact support or create a new account.');
        return false;
      }
      
      if (!credential.user.emailVerified) {
        this.authError.set('Please verify your email before logging in. Check your inbox for the verification link.');
        await signOut(this.auth);
        return false;
      }
      
      await new Promise(resolve => setTimeout(resolve, 500));
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

  async register(firstName: string, lastName: string, companyName: string, email: string, password: string, role: UserRole): Promise<boolean> {
    this.loading.set(true);
    this.authError.set(null);
    
    try {
      const credential = await createUserWithEmailAndPassword(this.auth, email, password);
      
      await sendEmailVerification(credential.user);
      
      const userProfile: UserProfile = {
        uid: credential.user.uid,
        firstName: firstName,
        lastName: lastName,
        company: companyName,
        email: email,
        role: role,
        savedJobs: [],
        createdAt: new Date()
      };
      
      await setDoc(doc(this.firestore, 'users', credential.user.uid), userProfile);
      
      await signOut(this.auth);
      
      this.authError.set('Registration successful! Please check your email to verify your account before logging in.');
      
      return false;
    } catch (error: any) {
      this.authError.set(this.getErrorMessage(error.code));
      return false;
    } finally {
      this.loading.set(false);
    }
  }

  async resendVerificationEmail(): Promise<void> {
    const user = this.auth.currentUser;
    if (user && !user.emailVerified) {
      try {
        await sendEmailVerification(user);
      } catch (error: any) {
        console.error('Error sending verification email:', error);
        this.authError.set(this.getErrorMessage(error.code || error.message));
        throw error;
      }
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

  async updateUserProfile(uid: string, data: Partial<UserProfile & {
    headline?: string;
    bio?: string;
    location?: string;
    website?: string;
    phone?: string;
  }>): Promise<void> {
    try {
      const userDocRef = doc(this.firestore, 'users', uid);
      await updateDoc(userDocRef, data as any);

      const current = this.userProfile();
      if (current) {
        this.userProfile.set({
          ...current,
          ...data
        });
      }
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  async updateEmail(newEmail: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('No authenticated user.');

    try {
      await fbUpdateEmail(user, newEmail);

      const profile = this.userProfile();
      if (profile) {
        await this.updateUserProfile(profile.uid, { email: newEmail });
      }
    } catch (error) {
      console.error('Error updating email:', error);
      throw error;
    }
  }

  async updatePassword(newPassword: string): Promise<void> {
    const user = this.currentUser();
    if (!user) throw new Error('No authenticated user.');

    try {
      await fbUpdatePassword(user, newPassword);
    } catch (error) {
      console.error('Error updating password:', error);
      throw error;
    }
  }

  async sendPasswordReset(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error: any) {
      console.error('Error sending password reset email:', error);
      this.authError.set(this.getErrorMessage(error.code || error.message));
      throw error;
    }
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
