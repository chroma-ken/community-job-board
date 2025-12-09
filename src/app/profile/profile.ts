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

  profileImageFile: File | null = null;
  profileImageUrl: string | null = null;

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
      this.company = userProfile.companyName || '';
      this.headline = userProfile.headline || '';
      this.bio = userProfile.bio || '';
      this.location = userProfile.location || '';
      this.website = userProfile.website || '';
      this.phone = userProfile.phone || '';
      this.profileImageUrl = (userProfile as any).profileImage || null;

      this.email = user.email || userProfile.email;
    } catch (e) {
      console.error('Error loading profile:', e);
      this.error = 'Failed to load profile.';
    } finally {
      this.loadingProfile = false;
    }
  }

  onProfileImageSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    this.profileImageFile = input.files[0];

    // Preview image
    const reader = new FileReader();
    reader.onload = () => {
      this.profileImageUrl = reader.result as string;
    };
    reader.readAsDataURL(this.profileImageFile);
  }
  async saveProfile() {
  if (!this.profile?.uid) {
    this.error = 'Profile not loaded properly.';
    return;
  }

  this.savingProfile = true;
  this.error = null;
  this.successMessage = null;

  try {
    // Only include fields that are non-empty
    const updatedProfile: Partial<UserProfile & { profileImage?: string }> = {};
    if (this.firstName) updatedProfile.firstName = this.firstName;
    if (this.lastName) updatedProfile.lastName = this.lastName;
    if (this.company) updatedProfile.companyName = this.company;
    if (this.headline) updatedProfile.headline = this.headline;
    if (this.bio) updatedProfile.bio = this.bio;
    if (this.location) updatedProfile.location = this.location;
    if (this.website) updatedProfile.website = this.website;
    if (this.phone) updatedProfile.phone = this.phone;
    if (this.profileImageUrl) updatedProfile.profileImage = this.profileImageUrl;

    await this.authService.updateUserProfile(this.profile.uid, updatedProfile);

    this.successMessage = 'Profile updated successfully.';
    await this.loadProfile();
  } catch (e: any) {
    console.error('Error saving profile:', e);
    this.error = e?.message || 'Failed to update profile.';
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
