    import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../services/auth.service';
import { UserProfile } from '../models/user.model';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './profile.html',
  styleUrl: './profile.css'
})
export class Profile {
  private authService = inject(AuthService);

  profile: UserProfile | null = null;
  firstName: string = '';
  lastName: string = '';
  company: string = '';
  headline: string = '';
  bio: string = '';
  location: string = '';
  website: string = '';
  phone: string = '';

  email: string = '';
  newPassword: string = '';
  confirmPassword: string = '';

  loadingProfile = false;
  savingProfile = false;
  savingAccount = false;
  error: string | null = null;
  successMessage: string | null = null;

  constructor() {
    this.loadProfile();
  }

  async loadProfile() {
    this.loadingProfile = true;
    this.error = null;

    try {
      await this.authService.waitForAuthState();
      const userProfile = this.authService.userProfile();
      const user = this.authService.currentUser();

      if (!userProfile || !user) {
        this.error = 'You must be logged in to view your profile.';
        return;
      }

      this.profile = userProfile;
      this.firstName = userProfile.firstName || '';
      this.lastName = userProfile.lastName || '';
      this.company = (userProfile as any).company || (userProfile as any).companyName || '';
      this.headline = (userProfile as any).headline || '';
      this.bio = (userProfile as any).bio || '';
      this.location = (userProfile as any).location || '';
      this.website = (userProfile as any).website || '';
      this.phone = (userProfile as any).phone || '';

      this.email = user.email || userProfile.email;
    } catch (e) {
      console.error('Error loading profile:', e);
      this.error = 'Failed to load profile.';
    } finally {
      this.loadingProfile = false;
    }
  }

  async saveProfile() {
    if (!this.profile) return;

    this.savingProfile = true;
    this.error = null;
    this.successMessage = null;

    try {
      await this.authService.updateUserProfile(this.profile.uid, {
        firstName: this.firstName || undefined,
        lastName: this.lastName || undefined,
        company: this.company || undefined,
        headline: this.headline || undefined,
        bio: this.bio || undefined,
        location: this.location || undefined,
        website: this.website || undefined,
        phone: this.phone || undefined
      });

      this.successMessage = 'Profile updated successfully.';
      await this.loadProfile();
    } catch (e: any) {
      console.error('Error saving profile:', e);
      this.error = 'Failed to update profile.';
    } finally {
      this.savingProfile = false;
    }
  }

  async saveAccountSettings() {
    if (!this.profile) return;

    if (this.newPassword && this.newPassword !== this.confirmPassword) {
      this.error = 'New password and confirmation do not match.';
      return;
    }

    this.savingAccount = true;
    this.error = null;
    this.successMessage = null;

    try {
      if (this.email && this.email !== this.profile.email) {
        await this.authService.updateEmail(this.email);
      }

      if (this.newPassword) {
        await this.authService.updatePassword(this.newPassword);
        this.newPassword = '';
        this.confirmPassword = '';
      }

      this.successMessage = 'Account settings updated successfully.';
      await this.loadProfile();
    } catch (e: any) {
      console.error('Error updating account settings:', e);
      this.error = e?.message || 'Failed to update account settings.';
    } finally {
      this.savingAccount = false;
    }
  }
}

